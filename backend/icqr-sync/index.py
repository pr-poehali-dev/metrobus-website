import json
import os
import urllib.request
import urllib.parse
import urllib.error
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


def fetch_rating_details(rating_id: int):
    '''Запрашивает у ICQR Admin API карточку отзыва с геоданными (page_opened_*, submit_*), vehicle_number и т.д.'''
    token = os.environ['ICQR_API_ADMIN_TOKEN']
    body = json.dumps({'Command': 'get_rating', 'Command_params': {'rating_id': rating_id}}).encode('utf-8')
    req = urllib.request.Request(
        f"{ICQR_BASE_URL}/api/index.php",
        data=body,
        method='POST',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json',
        },
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        payload = json.loads(resp.read().decode('utf-8'))
    if payload.get('Request_status', {}).get('Code') != 'Ok':
        return None
    return payload.get('Data')


def to_float(v):
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None


def haversine_m(lat1, lng1, lat2, lng2):
    '''Расстояние между двумя точками в метрах по формуле гаверсинуса.'''
    if None in (lat1, lng1, lat2, lng2):
        return None
    from math import radians, sin, cos, sqrt, atan2
    r = 6371000
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return r * 2 * atan2(sqrt(a), sqrt(1 - a))


def enrich_geo(cur, limit: int = 30):
    '''Дозагружает геоданные (координаты открытия формы и отправки оценки) для ещё не обогащённых записей.'''
    cur.execute(
        "SELECT id, icqr_id FROM transport_passenger_ratings WHERE geo_enriched_at IS NULL ORDER BY id DESC LIMIT %s",
        (limit,),
    )
    rows = cur.fetchall()
    enriched = 0
    for row_id, icqr_id in rows:
        try:
            details = fetch_rating_details(icqr_id)
        except (urllib.error.URLError, TimeoutError):
            continue
        if not details:
            continue

        page_lat = to_float(details.get('page_opened_lat'))
        page_lng = to_float(details.get('page_opened_lng'))
        submit_lat = to_float(details.get('submit_clicked_lat'))
        submit_lng = to_float(details.get('submit_clicked_lng'))
        movement_m = haversine_m(page_lat, page_lng, submit_lat, submit_lng)

        cur.execute(
            """
            UPDATE transport_passenger_ratings SET
                vehicle_number = %s,
                nearest_stop_distance_m = %s,
                distance_to_route_m = %s,
                page_opened_lat = %s,
                page_opened_lng = %s,
                page_opened_accuracy_m = %s,
                submit_lat = %s,
                submit_lng = %s,
                submit_accuracy_m = %s,
                movement_distance_m = %s,
                geo_enriched_at = now()
            WHERE id = %s
            """,
            (
                details.get('vehicle_number'),
                details.get('nearest_stop_distance_m'),
                details.get('distance_to_route_m'),
                page_lat,
                page_lng,
                details.get('page_opened_accuracy_m'),
                submit_lat,
                submit_lng,
                details.get('submit_clicked_accuracy_m'),
                movement_m,
                row_id,
            ),
        )
        enriched += 1
    return enriched


def log_sync_result(cur, status: str, synced_count: int, error_message: str = None):
    cur.execute(
        "INSERT INTO icqr_sync_log (status, synced_count, error_message) VALUES (%s, %s, %s)",
        (status, synced_count, error_message),
    )


def handler(event: dict, context) -> dict:
    '''Синхронизирует одобренные отзывы пассажиров с ICQR Public API в локальную таблицу transport_passenger_ratings,
    затем дозагружает геоданные (координаты открытия формы и отправки оценки, расстояние между ними) через ICQR Admin API.
    При GET с параметром status=1 возвращает статус последней синхронизации без запуска новой.
    Args: event - dict с httpMethod, queryStringParameters (status); context - объект с request_id.
    Returns: HTTP response с количеством загруженных/обновлённых отзывов, кол-вом обогащённых геоданными записей
        или статусом последней синхронизации.
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

    params = event.get('queryStringParameters') or {}
    if method == 'GET' and params.get('status') == '1':
        try:
            cur.execute(
                "SELECT status, synced_count, error_message, created_at FROM icqr_sync_log ORDER BY created_at DESC LIMIT 1"
            )
            row = cur.fetchone()
            if not row:
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'status': None, 'syncedCount': 0, 'errorMessage': None, 'lastSyncAt': None}),
                }
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'status': row[0],
                    'syncedCount': row[1],
                    'errorMessage': row[2],
                    'lastSyncAt': row[3].isoformat() if row[3] else None,
                }),
            }
        finally:
            cur.close()
            conn.close()

    total_upserted = 0
    page = 1
    total_pages = 1

    try:
        while page <= total_pages:
            try:
                data = fetch_page(page)
            except (urllib.error.URLError, TimeoutError) as e:
                log_sync_result(cur, 'error', total_upserted, f'Ошибка соединения с ICQR API: {e}')
                return {
                    'statusCode': 502,
                    'headers': headers,
                    'body': json.dumps({'error': 'icqr_connection_error'}),
                }

            if data.get('Request_status', {}).get('Code') != 'Ok':
                message = data.get('Request_status', {}).get('Message', 'icqr_upstream_error')
                log_sync_result(cur, 'error', total_upserted, message)
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

        geo_enriched = 0
        try:
            geo_enriched = enrich_geo(cur)
        except Exception:
            pass

        log_sync_result(cur, 'ok', total_upserted)
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'synced': total_upserted, 'geoEnriched': geo_enriched}),
        }
    except Exception as e:
        log_sync_result(cur, 'error', total_upserted, str(e))
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'internal_error'}),
        }
    finally:
        cur.close()
        conn.close()