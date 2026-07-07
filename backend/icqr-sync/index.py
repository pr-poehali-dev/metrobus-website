import json
import os
import urllib.request
import urllib.parse
from datetime import datetime
import psycopg2


ICQR_BASE_URL = os.environ.get('ICQR_API_BASE_URL', 'https://api.icqr.ru')


def fetch_page(page: int, per_page: int = 100):
    token = os.environ['ICQR_API_TOKEN']
    params = {'page': page, 'per_page': per_page}
    url = f"{ICQR_BASE_URL}/json/ratings-published?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json',
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode('utf-8'))


def handler(event: dict, context) -> dict:
    '''Синхронизирует одобренные отзывы пассажиров с ICQR Public API в локальную таблицу transport_passenger_ratings.
    Args: event - dict с httpMethod; context - объект с request_id.
    Returns: HTTP response с количеством загруженных/обновлённых отзывов.
    '''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    headers = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor()

    total_upserted = 0
    page = 1
    total_pages = 1

    try:
        while page <= total_pages:
            data = fetch_page(page)
            if data.get('Request_status', {}).get('Code') != 'Ok':
                return {
                    'statusCode': 502,
                    'headers': headers,
                    'body': json.dumps({'error': 'icqr_upstream_error'}),
                }
            payload = data.get('Data', {})
            items = payload.get('items', [])
            pagination = payload.get('pagination', {})
            total_pages = pagination.get('total_pages', 1)

            for item in items:
                cur.execute(
                    """
                    INSERT INTO transport_passenger_ratings
                        (icqr_id, rating, comment, route_number, transport_type,
                         direction_name, nearest_stop_name, stop_to_name, rated_at, synced_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, now())
                    ON CONFLICT (icqr_id) DO UPDATE SET
                        rating = EXCLUDED.rating,
                        comment = EXCLUDED.comment,
                        route_number = EXCLUDED.route_number,
                        transport_type = EXCLUDED.transport_type,
                        direction_name = EXCLUDED.direction_name,
                        nearest_stop_name = EXCLUDED.nearest_stop_name,
                        stop_to_name = EXCLUDED.stop_to_name,
                        rated_at = EXCLUDED.rated_at,
                        synced_at = now()
                    """,
                    (
                        item['id'],
                        item['rating'],
                        item.get('comment'),
                        item.get('route_number'),
                        item.get('transport_type'),
                        item.get('direction_name'),
                        item.get('nearest_stop_name'),
                        item.get('stop_to_name'),
                        item['created_at'],
                    ),
                )
                total_upserted += 1

            page += 1

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'synced': total_upserted}),
        }
    finally:
        cur.close()
        conn.close()
