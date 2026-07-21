import json
import os
import hmac
import hashlib
import time
import psycopg2
import psycopg2.extras


ALLOWED_SORT_FIELDS = {
    'rated_at': 'rated_at',
    'rating': 'rating',
    'route_number': 'route_number',
    'transport_type': 'transport_type',
    'synced_at': 'synced_at',
}


def verify_token(secret: str, token: str) -> bool:
    try:
        expires_str, sig = token.split('.', 1)
    except ValueError:
        return False
    expected = hmac.new(secret.encode(), expires_str.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, sig):
        return False
    return int(expires_str) > int(time.time())


def handler(event: dict, context) -> dict:
    '''Возвращает реестр отзывов пассажиров для админ-панели: поиск, фильтры, сортировка, пагинация.
    Требует валидный токен сессии в заголовке X-Admin-Token.
    Args: event - dict с httpMethod, queryStringParameters (search, transport_type, rating_min, rating_max,
        date_from, date_to, sort, order, page, per_page), headers X-Admin-Token; context - объект с request_id.
    Returns: HTTP response с JSON { items, total, page, per_page }.
    '''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    headers = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

    secret = os.environ['DATABASE_URL']
    req_headers = event.get('headers', {}) or {}
    token = req_headers.get('X-Admin-Token') or req_headers.get('x-admin-token', '')
    if not token or not verify_token(secret, token):
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'unauthorized'}),
        }

    params = event.get('queryStringParameters') or {}
    search = (params.get('search') or '').strip()
    transport_type = (params.get('transport_type') or '').strip()
    rating_min = params.get('rating_min')
    rating_max = params.get('rating_max')
    date_from = params.get('date_from')
    date_to = params.get('date_to')
    sort = ALLOWED_SORT_FIELDS.get(params.get('sort', 'rated_at'), 'rated_at')
    order = 'ASC' if (params.get('order') or '').upper() == 'ASC' else 'DESC'
    try:
        page = max(1, int(params.get('page', 1)))
    except (TypeError, ValueError):
        page = 1
    try:
        per_page = min(200, max(1, int(params.get('per_page', 50))))
    except (TypeError, ValueError):
        per_page = 50
    offset = (page - 1) * per_page

    conditions = ["is_draft = false"]
    values = []

    if search:
        conditions.append(
            "(comment ILIKE %s OR route_number ILIKE %s OR nearest_stop_name ILIKE %s OR stop_to_name ILIKE %s OR direction_name ILIKE %s)"
        )
        like = f"%{search}%"
        values.extend([like, like, like, like, like])

    if transport_type:
        conditions.append("transport_type = %s")
        values.append(transport_type)

    if rating_min:
        conditions.append("rating >= %s")
        values.append(int(rating_min))

    if rating_max:
        conditions.append("rating <= %s")
        values.append(int(rating_max))

    if date_from:
        conditions.append("rated_at >= %s")
        values.append(date_from)

    if date_to:
        conditions.append("rated_at < (%s::date + INTERVAL '1 day')")
        values.append(date_to)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        count_query = f"SELECT COUNT(*) AS total FROM transport_passenger_ratings {where_clause}"
        cur.execute(count_query, values)
        total = cur.fetchone()['total']

        cur.execute(
            """
            SELECT COUNT(*) AS anomaly_count FROM transport_passenger_ratings
            WHERE route_number IS NULL OR transport_type IS NULL
               OR (nearest_stop_name IS NULL AND stop_to_name IS NULL)
            """
        )
        anomaly_total = cur.fetchone()['anomaly_count']

        list_query = f"""
            SELECT id, icqr_id, rating, comment, route_number, transport_type,
                   direction_name, nearest_stop_name, stop_to_name, rated_at, synced_at,
                   vehicle_number, nearest_stop_distance_m, distance_to_route_m,
                   page_opened_lat, page_opened_lng, submit_lat, submit_lng, movement_distance_m,
                   uuid, result_false, ip, is_passenger, operator_id, operator_title,
                   transport_opened_lat, transport_opened_lng, transport_opened_dist,
                   transport_submit_lat, transport_submit_lng, transport_submit_dist,
                   possibly_not_passenger, anti_fraud_reason, rating_client_id,
                   location_id, location_code
            FROM transport_passenger_ratings
            {where_clause}
            ORDER BY {sort} {order}
            LIMIT %s OFFSET %s
        """
        cur.execute(list_query, values + [per_page, offset])
        rows = cur.fetchall()

        items = []
        for r in rows:
            is_anomaly = (
                not r['route_number']
                or not r['transport_type']
                or (not r['nearest_stop_name'] and not r['stop_to_name'])
            )
            if is_anomaly:
                sentiment = 'anomaly'
            elif r['rating'] >= 4:
                sentiment = 'positive'
            elif r['rating'] <= 2:
                sentiment = 'negative'
            else:
                sentiment = 'neutral'

            trust_flags = []
            if r['possibly_not_passenger']:
                trust_flags.append('possibly_not_passenger')
            if r['anti_fraud_reason']:
                trust_flags.append('anti_fraud_reason')
            if r['transport_opened_dist'] is not None and r['transport_opened_dist'] > 300:
                trust_flags.append('far_from_vehicle_open')
            if r['transport_submit_dist'] is not None and r['transport_submit_dist'] > 300:
                trust_flags.append('far_from_vehicle_submit')
            if r['movement_distance_m'] is not None and r['movement_distance_m'] > 2000:
                trust_flags.append('excessive_movement')
            trust_level = 'low' if (r['possibly_not_passenger'] or r['anti_fraud_reason']) else (
                'medium' if trust_flags else 'high'
            )

            items.append({
                'id': r['id'],
                'icqrId': r['icqr_id'],
                'rating': r['rating'],
                'comment': r['comment'],
                'routeNumber': r['route_number'],
                'transportType': r['transport_type'],
                'directionName': r['direction_name'],
                'nearestStopName': r['nearest_stop_name'],
                'stopToName': r['stop_to_name'],
                'ratedAt': r['rated_at'].isoformat() if r['rated_at'] else None,
                'syncedAt': r['synced_at'].isoformat() if r['synced_at'] else None,
                'sentiment': sentiment,
                'isAnomaly': is_anomaly,
                'vehicleNumber': r['vehicle_number'],
                'nearestStopDistanceM': r['nearest_stop_distance_m'],
                'distanceToRouteM': r['distance_to_route_m'],
                'pageOpenedLat': r['page_opened_lat'],
                'pageOpenedLng': r['page_opened_lng'],
                'submitLat': r['submit_lat'],
                'submitLng': r['submit_lng'],
                'movementDistanceM': r['movement_distance_m'],
                'uuid': r['uuid'],
                'resultFalse': r['result_false'],
                'ip': r['ip'],
                'isPassenger': r['is_passenger'],
                'operatorId': r['operator_id'],
                'operatorTitle': r['operator_title'],
                'transportOpenedLat': r['transport_opened_lat'],
                'transportOpenedLng': r['transport_opened_lng'],
                'transportOpenedDist': r['transport_opened_dist'],
                'transportSubmitLat': r['transport_submit_lat'],
                'transportSubmitLng': r['transport_submit_lng'],
                'transportSubmitDist': r['transport_submit_dist'],
                'trustLevel': trust_level,
                'trustFlags': trust_flags,
                'isObserver': r['is_passenger'] is False,
                'notCountedReason': r['result_false'],
                'possiblyNotPassenger': r['possibly_not_passenger'],
                'antiFraudReason': r['anti_fraud_reason'],
                'locationCode': r['location_code'],
            })

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'items': items,
                'total': total,
                'anomalyTotal': anomaly_total,
                'page': page,
                'perPage': per_page,
            }),
        }
    finally:
        cur.close()
        conn.close()