import json
import os
import re
from datetime import date, timedelta
import psycopg2
import psycopg2.extras


TRANSPORT_LABELS = {
    'bus': 'Автобус',
    'tram': 'Трамвай',
    'trolley': 'Троллейбус',
    'trolleybus': 'Троллейбус',
}

MONTHS = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

CLUSTER_RULES = [
    {'key': 'delays', 'label': 'Опоздания', 'icon': 'Clock', 'positive': False,
     'words': ['опозд', 'задерж', 'долго ждал', 'не приход', 'жд']},
    {'key': 'crowded', 'label': 'Переполненность', 'icon': 'Users', 'positive': False,
     'words': ['перепол', 'битком', 'толчея', 'зажат', 'не влез']},
    {'key': 'driver', 'label': 'Водитель', 'icon': 'UserCog', 'positive': False,
     'words': ['водител', 'резко', 'грубо', 'хамств']},
    {'key': 'clean', 'label': 'Чистота', 'icon': 'Sparkles', 'positive': True,
     'words': ['чист', 'опрятн', 'аккуратн', 'новый салон']},
    {'key': 'positive', 'label': 'Позитив', 'icon': 'Smile', 'positive': True,
     'words': ['спасибо', 'вежлив', 'отличн', 'вовремя', 'комфорт', 'доволен']},
]


def normalize_transport(t: str) -> str:
    t = (t or '').lower()
    if t.startswith('trolley'):
        return 'trolley'
    if t in ('bus', 'tram'):
        return t
    return t or 'bus'


def classify_comment(comment: str):
    if not comment:
        return None
    text = comment.lower()
    for rule in CLUSTER_RULES:
        for w in rule['words']:
            if w in text:
                return rule
    return None


def handler(event: dict, context) -> dict:
    '''Возвращает агрегированные данные дашборда оценок: сводку, разбивку по видам транспорта,
    хронологию по дням выбранного месяца и AI-кластеры комментариев.
    Args: event - dict с httpMethod и queryStringParameters (monthOffset, viewMode: 'passengers'|'observers');
        context - объект с request_id.
    Returns: HTTP response с JSON { summary, timeline, clusters, viewMode }.
    '''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    headers = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

    params = event.get('queryStringParameters') or {}
    try:
        month_offset = int(params.get('monthOffset', 0))
    except (TypeError, ValueError):
        month_offset = 0

    view_mode = params.get('viewMode', 'passengers')
    if view_mode not in ('passengers', 'observers'):
        view_mode = 'passengers'
    # passengers: is_passenger = true ИЛИ NULL (старые записи без декларации считаем пассажирскими)
    # observers: is_passenger = false (пользователь явно указал "Я наблюдатель вне транспорта")
    role_filter = 'is_passenger IS DISTINCT FROM false' if view_mode == 'passengers' else 'is_passenger = false'

    today = date.today()
    year = today.year
    month = today.month + month_offset
    while month < 1:
        month += 12
        year -= 1
    while month > 12:
        month -= 12
        year += 1

    prev_month = month - 1
    prev_year = year
    if prev_month < 1:
        prev_month = 12
        prev_year -= 1

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute(
            f"""
            SELECT COALESCE(AVG(rating), 0) AS average, COUNT(*) AS cnt
            FROM transport_passenger_ratings
            WHERE date_trunc('month', rated_at) = date_trunc('month', %s::date)
              AND is_draft = false AND {role_filter}
            """,
            (date(year, month, 1),),
        )
        cur_row = cur.fetchone()
        current_average = float(cur_row['average'])
        month_count = int(cur_row['cnt'])

        cur.execute(
            f"""
            SELECT COALESCE(AVG(rating), 0) AS average
            FROM transport_passenger_ratings
            WHERE date_trunc('month', rated_at) = date_trunc('month', %s::date)
              AND is_draft = false AND {role_filter}
            """,
            (date(prev_year, prev_month, 1),),
        )
        prev_average = float(cur.fetchone()['average'])

        cur.execute(
            f"""
            SELECT transport_type, COALESCE(AVG(rating), 0) AS average, COUNT(*) AS cnt
            FROM transport_passenger_ratings
            WHERE is_draft = false AND {role_filter}
            GROUP BY transport_type
            """
        )
        by_type_raw = cur.fetchall()
        by_type_map = {}
        for row in by_type_raw:
            key = normalize_transport(row['transport_type'])
            by_type_map[key] = {
                'type': key,
                'label': TRANSPORT_LABELS.get(key, key.capitalize()),
                'average': round(float(row['average']), 2),
                'count': int(row['cnt']),
            }
        for key in ('bus', 'tram', 'trolley'):
            by_type_map.setdefault(key, {
                'type': key, 'label': TRANSPORT_LABELS[key], 'average': 0, 'count': 0,
            })
        by_type = [by_type_map['bus'], by_type_map['tram'], by_type_map['trolley']]

        cur.execute(
            f"""
            SELECT COUNT(DISTINCT route_number) AS cnt FROM transport_passenger_ratings
            WHERE route_number IS NOT NULL AND is_draft = false AND {role_filter}
            """
        )
        routes_count = int(cur.fetchone()['cnt'])

        cur.execute(
            f"""
            SELECT EXTRACT(DAY FROM rated_at)::int AS day, transport_type,
                   AVG(rating) AS value, COUNT(*) AS cnt
            FROM transport_passenger_ratings
            WHERE date_trunc('month', rated_at) = date_trunc('month', %s::date)
              AND is_draft = false AND {role_filter}
            GROUP BY day, transport_type
            ORDER BY day
            """,
            (date(year, month, 1),),
        )
        timeline_rows: dict[int, dict] = {}
        for r in cur.fetchall():
            key = normalize_transport(r['transport_type'])
            if key not in ('bus', 'tram', 'trolley'):
                continue
            day_bucket = timeline_rows.setdefault(r['day'], {})
            day_bucket[key] = {'value': float(r['value']), 'count': int(r['cnt'])}

        if month == 12:
            days_in_month = 31
        else:
            days_in_month = (date(year, month + 1, 1) - date(year, month, 1)).days
        timeline = []
        for d in range(1, days_in_month + 1):
            day_bucket = timeline_rows.get(d, {})
            point = {'day': d}
            for key in ('bus', 'tram', 'trolley'):
                entry = day_bucket.get(key)
                point[key] = round(entry['value'], 2) if entry else None
                point[f'{key}Count'] = entry['count'] if entry else 0
            timeline.append(point)

        cur.execute(
            f"""
            SELECT comment FROM transport_passenger_ratings
            WHERE comment IS NOT NULL AND comment != '' AND is_draft = false AND {role_filter}
            """
        )
        comments = [r['comment'] for r in cur.fetchall()]
        cluster_counts = {r['key']: {'rule': r, 'count': 0, 'examples': []} for r in CLUSTER_RULES}
        classified_total = 0
        for c in comments:
            match = classify_comment(c)
            if match:
                bucket = cluster_counts[match['key']]
                bucket['count'] += 1
                classified_total += 1
                if len(bucket['examples']) < 3:
                    bucket['examples'].append(c)

        clusters = []
        for rule in CLUSTER_RULES:
            bucket = cluster_counts[rule['key']]
            share = round((bucket['count'] / classified_total) * 100) if classified_total else 0
            clusters.append({
                'key': rule['key'],
                'label': rule['label'],
                'icon': rule['icon'],
                'positive': rule['positive'],
                'share': share,
                'examples': bucket['examples'],
            })

        result = {
            'summary': {
                'average': round(current_average, 2),
                'prevAverage': round(prev_average, 2),
                'monthCount': month_count,
                'byType': by_type,
                'routesCount': routes_count,
            },
            'timeline': timeline,
            'month': f'{MONTHS[month - 1]}, {year}',
            'clusters': clusters,
            'viewMode': view_mode,
        }

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(result),
        }
    finally:
        cur.close()
        conn.close()