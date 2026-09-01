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

CLUSTER_RULES_TRIPS = [
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

CLUSTER_RULES_ROUTES = [
    {'key': 'route', 'label': 'Маршрут', 'icon': 'Milestone', 'positive': False,
     'words': ['кружит', 'объезд', 'нелогичн', 'петля', 'крюк', 'напрямую не', 'долго едет']},
    {'key': 'stops', 'label': 'Остановки', 'icon': 'MapPin', 'positive': False,
     'words': ['далеко до остановк', 'нет остановки', 'убрали остановку', 'неудобн останов', 'не доезжа']},
    {'key': 'interval', 'label': 'Интервал', 'icon': 'Clock', 'positive': False,
     'words': ['редко ходит', 'долго ждать', 'большой интервал', 'не дождеш', 'ходит редко']},
    {'key': 'transfer', 'label': 'Пересадки', 'icon': 'ArrowLeftRight', 'positive': False,
     'words': ['пересадк', 'стыков', 'неудобная пересад']},
    {'key': 'positive', 'label': 'Позитив', 'icon': 'Smile', 'positive': True,
     'words': ['удобно', 'логично', 'спасибо', 'отличн', 'вовремя', 'доволен']},
]


def normalize_transport(t: str) -> str:
    t = (t or '').lower()
    if t.startswith('trolley'):
        return 'trolley'
    if t in ('bus', 'tram'):
        return t
    return t or 'bus'


def classify_comment(comment: str, rules: list):
    if not comment:
        return None
    text = comment.lower()
    for rule in rules:
        for w in rule['words']:
            if w in text:
                return rule
    return None


STATUS_LABELS = {True: 'draft', False: 'published'}


def handler(event: dict, context) -> dict:
    '''Возвращает агрегированные данные дашборда оценок: сводку, разбивку по видам транспорта,
    хронологию по дням выбранного месяца, кластеры комментариев (только вручную проверенных
    модератором в админ-консоли, comment_verified = true), а также до 3 ключевых метрик и список
    последних записей — набор которых зависит от комбинации viewMode (поездки/маршруты)
    и dataScope (мои/все), определяемого наличием параметра myToken:
      - Мои: metric1 = кол-во своих оценённых поездок/маршрутов (is_draft=false),
             metric2 = прирост своих записей за последние 7 дней, metric3 = null,
             records = последние 3 своих записи (все статусы, включая черновики).
      - Все: metric1 = кол-во оценённых поездок/маршрутов по городу (is_draft=false),
             metric2 = покрытие маршрутов (кол-во разных route_number с оценкой из общего
             числа активных маршрутов города, взятого из app_settings.total_active_routes_count),
             metric3 = только для viewMode='passengers': охват уникальных ТС (кол-во разных
             vehicle_number с оценкой из общего числа бортов города, взятого из
             app_settings.total_active_vehicles_count; временная оценочная цифра до появления
             точных данных из API ICQR), для viewMode='observers' metric3 = null,
             records = последние 3 опубликованные записи по городу (is_draft=false).
    Если передан параметр myToken — данные фильтруются только оценками этого пользователя
    ICQR.RU (сопоставление по полю rating_client_id, которое ICQR присваивает пользователю).
    Также всегда возвращается публичный общегородской рейтинг topActiveUsers — топ-10 по количеству
    опубликованных записей (is_draft=false) в рамках выбранного viewMode: для 'passengers' считаются
    оценки поездок, для 'observers' — оценки маршрутов, с анонимизированными подписями вида
    "Пользователь #XXXX" (последние 4 символа rating_client_id) и флагом isMe для
    текущего пользователя, если передан myToken. Рейтинг не зависит от dataScope. Если передан
    myToken, также возвращается myRank — место текущего пользователя в этом же рейтинге его роли
    (rank, count, totalUsers), даже если он не входит в топ-10; myRank = null, если myToken не
    передан или у пользователя ещё нет опубликованных записей выбранной роли.
    Если передан параметр routes (список номеров маршрутов через запятую, сохранённый пользователем
    локально как "Мои маршруты") — абсолютно все разделы ответа (summary, timeline, clusters, metric1-3,
    records, topActiveUsers, myRank) фильтруются только оценками по этим маршрутам; знаменатель метрики
    "Покрытие" в этом случае — количество выбранных маршрутов, а не общее число маршрутов города.
    Args: event - dict с httpMethod и queryStringParameters (monthOffset, viewMode: 'passengers'|'observers',
        myToken: опциональный идентификатор пользователя ICQR.RU для фильтра "мои оценки",
        routes: опциональный список номеров маршрутов через запятую для фильтра "Мои маршруты");
        context - объект с request_id.
    Returns: HTTP response с JSON { summary, timeline, clusters, viewMode, dataScope, metric1, metric2, metric3,
        records, topActiveUsers, myRank }. summary.routesDirectory = { synced, total, incomplete } — статус
        справочника маршрутов transport_routes (synced — сколько маршрутов реально загружено в БД,
        total — ожидаемое кол-во из app_settings.total_active_routes_count, incomplete = true, если
        синхронизация не завершена полностью — используется на фронтенде для предупреждения.
        summary.ratingsSync = { status, errorMessage, lastSyncAt } — статус последней записи в
        icqr_sync_log (синхронизация отзывов пассажиров с ICQR) — используется на фронтенде для
        аналогичного цветового индикатора рядом с метрикой "Оценено".
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

    data_scope = params.get('dataScope', 'all')
    if data_scope not in ('mine', 'all'):
        data_scope = 'all'

    my_token = (params.get('myToken') or '').strip() or None
    if data_scope == 'mine':
        if my_token:
            role_filter += ' AND rating_client_id = %s'
            token_param = (my_token,)
        else:
            # dataScope=mine, но токен пользователя в этом браузере ещё не найден — нет своих данных
            role_filter += ' AND false'
            token_param = ()
    else:
        token_param = ()

    # Фильтр "Мои маршруты" — необязательный список номеров маршрутов, выбранный пользователем
    # локально (localStorage) и переданный в параметре routes через запятую. Применяется ко всем
    # разделам дашборда: сводке, разбивке по транспорту, хронологии, кластерам, KPI, списку записей
    # и общегородскому рейтингу активности.
    routes_raw = (params.get('routes') or '').strip()
    routes_list = [r.strip() for r in routes_raw.split(',') if r.strip()] if routes_raw else []
    if routes_list:
        role_filter += ' AND route_number = ANY(%s)'
        token_param = token_param + (routes_list,)
        routes_filter_sql = ' AND route_number = ANY(%s)'
        routes_filter_param = (routes_list,)
    else:
        routes_filter_sql = ''
        routes_filter_param = ()

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
        month_params = (date(year, month, 1),) + token_param
        prev_month_params = (date(prev_year, prev_month, 1),) + token_param
        no_date_params = token_param

        cur.execute(
            f"""
            SELECT COALESCE(AVG(rating), 0) AS average, COUNT(*) AS cnt
            FROM transport_passenger_ratings
            WHERE date_trunc('month', rated_at) = date_trunc('month', %s::date)
              AND is_draft = false AND {role_filter}
            """,
            month_params,
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
            prev_month_params,
        )
        prev_average = float(cur.fetchone()['average'])

        cur.execute(
            f"""
            SELECT transport_type, COALESCE(AVG(rating), 0) AS average, COUNT(*) AS cnt
            FROM transport_passenger_ratings
            WHERE is_draft = false AND {role_filter}
            GROUP BY transport_type
            """,
            no_date_params,
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
        by_type = [by_type_map['bus'], by_type_map['trolley'], by_type_map['tram']]

        cur.execute(
            f"""
            SELECT COUNT(DISTINCT route_number) AS cnt FROM transport_passenger_ratings
            WHERE route_number IS NOT NULL AND is_draft = false AND {role_filter}
            """,
            no_date_params,
        )
        routes_count = int(cur.fetchone()['cnt'])

        # Статус справочника маршрутов (transport_routes), используемого для подсказок "Мои маршруты"
        # и как знаменатель метрики "Покрытие": сверяем реальное число синхронизированных маршрутов
        # с ожидаемым total_active_routes_count, чтобы показать индикатор неполной синхронизации.
        cur.execute("SELECT COUNT(DISTINCT route_number) AS cnt FROM transport_routes")
        directory_synced = int(cur.fetchone()['cnt'])
        cur.execute("SELECT value FROM app_settings WHERE key = 'total_active_routes_count'")
        directory_total_row = cur.fetchone()
        try:
            directory_total = int(directory_total_row['value']) if directory_total_row and directory_total_row['value'] else None
        except (TypeError, ValueError):
            directory_total = None
        routes_directory = {
            'synced': directory_synced,
            'total': directory_total,
            'incomplete': bool(directory_total) and directory_synced < directory_total,
        }

        # Статус последней синхронизации отзывов пассажиров с ICQR (icqr_sync_log): используется
        # для цветового индикатора рядом с метрикой "Оценено" — та же логика светофора, что и у
        # справочника маршрутов. status=None или 'error' — синхронизация не удалась (красный);
        # status='ok', но error_message заполнен (например, сбоем дозагрузки геоданных) — частичная
        # проблема (жёлтый); status='ok' без ошибок — всё в порядке (зелёный).
        cur.execute(
            "SELECT status, error_message, created_at FROM icqr_sync_log ORDER BY created_at DESC LIMIT 1"
        )
        sync_row = cur.fetchone()
        ratings_sync = {
            'status': sync_row['status'] if sync_row else None,
            'errorMessage': sync_row['error_message'] if sync_row else None,
            'lastSyncAt': sync_row['created_at'].isoformat() if sync_row and sync_row['created_at'] else None,
        }

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
            month_params,
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
            WHERE comment IS NOT NULL AND comment != '' AND is_draft = false
              AND comment_verified = true AND {role_filter}
            """,
            no_date_params,
        )
        comments = [r['comment'] for r in cur.fetchall()]
        cluster_rules = CLUSTER_RULES_TRIPS if view_mode == 'passengers' else CLUSTER_RULES_ROUTES
        cluster_counts = {r['key']: {'rule': r, 'count': 0, 'examples': []} for r in cluster_rules}
        classified_total = 0
        for c in comments:
            match = classify_comment(c, cluster_rules)
            if match:
                bucket = cluster_counts[match['key']]
                bucket['count'] += 1
                classified_total += 1
                if len(bucket['examples']) < 3:
                    bucket['examples'].append(c)

        clusters = []
        for rule in cluster_rules:
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

        # ===== Метрики и список записей для карточки "Мои/Все" =====
        if data_scope == 'mine':
            # Метрика 1: кол-во своих оценённых поездок/наблюдений (опубликованные)
            cur.execute(
                f"SELECT COUNT(*) AS cnt FROM transport_passenger_ratings WHERE is_draft = false AND {role_filter}",
                no_date_params,
            )
            metric1_value = int(cur.fetchone()['cnt'])
            metric1_label = 'Моих оценённых записей'

            # Метрика 2: прирост своих записей за последние 7 дней
            cur.execute(
                f"""
                SELECT COUNT(*) AS cnt FROM transport_passenger_ratings
                WHERE is_draft = false AND rated_at >= now() - interval '7 days' AND {role_filter}
                """,
                no_date_params,
            )
            metric2_value = int(cur.fetchone()['cnt'])
            metric2_label = 'Прирост за 7 дней'
            metric3 = None

            # Список: последние N своих записей (все статусы, включая черновики)
            records_filter = role_filter
            records_params = no_date_params
        else:
            # Метрика 1: кол-во оценённых поездок/наблюдений по городу (опубликованные)
            cur.execute(
                f"SELECT COUNT(*) AS cnt FROM transport_passenger_ratings WHERE is_draft = false AND {role_filter}",
                no_date_params,
            )
            metric1_value = int(cur.fetchone()['cnt'])
            metric1_label = 'Оценено'

            # Метрика 2: покрытие маршрутов — N маршрутов из M имеют хотя бы одну оценку.
            # При активном фильтре "Мои маршруты" знаменатель — кол-во выбранных маршрутов, а не весь город.
            if routes_list:
                total_routes = len(routes_list)
            else:
                cur.execute(
                    "SELECT value FROM app_settings WHERE key = 'total_active_routes_count'"
                )
                settings_row = cur.fetchone()
                try:
                    total_routes = int(settings_row['value']) if settings_row and settings_row['value'] else None
                except (TypeError, ValueError):
                    total_routes = None

            cur.execute(
                f"""
                SELECT COUNT(DISTINCT route_number) AS cnt FROM transport_passenger_ratings
                WHERE route_number IS NOT NULL AND is_draft = false AND {role_filter}
                """,
                no_date_params,
            )
            covered_routes = int(cur.fetchone()['cnt'])
            metric2_value = covered_routes
            metric2_total = total_routes
            metric2_label = 'Покрытие'

            # Метрика 3 (только для поездок): охват уникальных ТС — N бортов из M получили оценку
            metric3 = None
            if view_mode == 'passengers':
                cur.execute(
                    "SELECT value FROM app_settings WHERE key = 'total_active_vehicles_count'"
                )
                vehicles_settings_row = cur.fetchone()
                try:
                    total_vehicles = int(vehicles_settings_row['value']) if vehicles_settings_row and vehicles_settings_row['value'] else None
                except (TypeError, ValueError):
                    total_vehicles = None

                cur.execute(
                    f"""
                    SELECT COUNT(DISTINCT vehicle_number) AS cnt FROM transport_passenger_ratings
                    WHERE vehicle_number IS NOT NULL AND is_draft = false AND {role_filter}
                    """,
                    no_date_params,
                )
                covered_vehicles = int(cur.fetchone()['cnt'])
                metric3 = {'value': covered_vehicles, 'label': 'Охват ТС', 'total': total_vehicles}

            # Список: последние опубликованные записи по городу
            records_filter = f"is_draft = false AND {role_filter}"
            records_params = no_date_params

        cur.execute(
            f"""
            SELECT id, route_number, transport_type, vehicle_number, rating, comment,
                   is_draft, rated_at
            FROM transport_passenger_ratings
            WHERE {records_filter}
            ORDER BY rated_at DESC
            LIMIT 3
            """,
            records_params,
        )
        records = []
        for r in cur.fetchall():
            records.append({
                'id': r['id'],
                'routeNumber': r['route_number'],
                'transportType': normalize_transport(r['transport_type']),
                'vehicleNumber': r['vehicle_number'],
                'rating': r['rating'],
                'comment': r['comment'],
                'status': STATUS_LABELS[r['is_draft']],
                'ratedAt': r['rated_at'].isoformat() if r['rated_at'] else None,
            })

        metric1 = {'value': metric1_value, 'label': metric1_label}
        metric2 = {'value': metric2_value, 'label': metric2_label}
        if data_scope == 'all':
            metric2['total'] = metric2_total

        # ===== Публичный рейтинг активности: топ-10 по кол-ву опубликованных оценок =====
        # Зависит от viewMode: для 'passengers' считаются пассажирские оценки, для 'observers' — наблюдения.
        # Не зависит от dataScope — всегда общегородской в рамках выбранной роли (не фильтруется по my_token).
        role_filter_plain = 'is_passenger IS DISTINCT FROM false' if view_mode == 'passengers' else 'is_passenger = false'
        role_filter_plain += routes_filter_sql
        rank_label = 'Пользователь'
        cur.execute(
            f"""
            SELECT rating_client_id, COUNT(*) AS cnt
            FROM transport_passenger_ratings
            WHERE is_draft = false AND rating_client_id IS NOT NULL
              AND {role_filter_plain}
            GROUP BY rating_client_id
            ORDER BY cnt DESC, rating_client_id
            LIMIT 10
            """,
            routes_filter_param,
        )
        top_active_users = []
        for rank, r in enumerate(cur.fetchall(), start=1):
            client_id = r['rating_client_id']
            suffix = client_id[-4:] if client_id else '????'
            top_active_users.append({
                'rank': rank,
                'label': f'{rank_label} #{suffix}',
                'count': int(r['cnt']),
                'isMe': bool(my_token) and client_id == my_token,
            })

        # Моё место в общегородском рейтинге этой же роли (даже если оно за пределами топ-10)
        my_rank = None
        if my_token:
            cur.execute(
                f"""
                WITH counts AS (
                    SELECT rating_client_id, COUNT(*) AS cnt
                    FROM transport_passenger_ratings
                    WHERE is_draft = false AND rating_client_id IS NOT NULL
                      AND {role_filter_plain}
                    GROUP BY rating_client_id
                ),
                ranked AS (
                    SELECT rating_client_id, cnt,
                           RANK() OVER (ORDER BY cnt DESC, rating_client_id) AS rnk,
                           COUNT(*) OVER () AS total_users
                    FROM counts
                )
                SELECT rnk, cnt, total_users FROM ranked WHERE rating_client_id = %s
                """,
                routes_filter_param + (my_token,),
            )
            my_rank_row = cur.fetchone()
            if my_rank_row:
                my_rank = {
                    'rank': int(my_rank_row['rnk']),
                    'count': int(my_rank_row['cnt']),
                    'totalUsers': int(my_rank_row['total_users']),
                }

        result = {
            'summary': {
                'average': round(current_average, 2),
                'prevAverage': round(prev_average, 2),
                'monthCount': month_count,
                'byType': by_type,
                'routesCount': routes_count,
                'routesDirectory': routes_directory,
                'ratingsSync': ratings_sync,
            },
            'timeline': timeline,
            'month': f'{MONTHS[month - 1]}, {year}',
            'clusters': clusters,
            'viewMode': view_mode,
            'dataScope': data_scope,
            'metric1': metric1,
            'metric2': metric2,
            'metric3': metric3,
            'records': records,
            'topActiveUsers': top_active_users,
            'myRank': my_rank,
        }

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(result),
        }
    finally:
        cur.close()
        conn.close()