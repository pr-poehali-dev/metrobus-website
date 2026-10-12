import json
import os
import hmac
import hashlib
import time
import urllib.request
import urllib.error
import psycopg2
from concurrent.futures import ThreadPoolExecutor, as_completed, wait


ICQR_BASE_URL = os.environ.get('ICQR_API_BASE_URL', 'https://api.icqr.ru')

ALLOWED_ACTIONS = {'approve', 'reject', 'reset'}
ALLOWED_STATUSES = {'pending', 'approved', 'rejected', 'all'}


def verify_token(secret: str, token: str) -> bool:
    try:
        expires_str, sig = token.split('.', 1)
    except ValueError:
        return False
    expected = hmac.new(secret.encode(), expires_str.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, sig):
        return False
    return int(expires_str) > int(time.time())


def enrich_is_passenger(items: list) -> None:
    '''Дополняет каждую запись списка полем is_passanger, запрашивая карточку отзыва (get_rating) в ICQR Admin API,
    т.к. команда list_ratings это поле не возвращает — оно приходит только в get_rating. Запросы идут параллельно.'''
    ids = [item['id'] for item in items if item.get('id') is not None]
    if not ids:
        return

    def fetch_one(rating_id):
        try:
            _, payload = icqr_command('get_rating', {'rating_id': rating_id})
            if payload.get('Request_status', {}).get('Code') != 'Ok':
                return rating_id, None
            data = payload.get('Data') or {}
            return rating_id, data.get('is_passanger')
        except Exception:
            return rating_id, None

    results = {}
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = [pool.submit(fetch_one, rid) for rid in ids]
        for future in as_completed(futures):
            rid, is_passanger = future.result()
            results[rid] = is_passanger

    for item in items:
        if item.get('id') in results:
            item['is_passanger'] = results[item['id']]


def icqr_command(command: str, command_params: dict):
    token = os.environ['ICQR_API_ADMIN_TOKEN']
    body = json.dumps({'Command': command, 'Command_params': command_params}).encode('utf-8')
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
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            status = resp.status
            payload = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        status = e.code
        try:
            payload = json.loads(e.read().decode('utf-8'))
        except Exception:
            payload = {'Request_status': {'Code': 'Error', 'Message': str(e)}}
    return status, payload


DETAIL_FIELDS = (
    'id', 'created_at', 'route_number', 'vehicle_number', 'transport_type', 'rating', 'result_false',
    'page_opened_lat', 'page_opened_lng', 'submit_clicked_lat', 'submit_clicked_lng',
    'page_opened_accuracy_m', 'submit_clicked_accuracy_m', 'distance_to_route_m', 'nearest_stop_distance_m',
    'nearest_stop_name', 'source_screen', 'is_passanger', 'rating_client_id', 'moderation_status', 'location_code',
    'page_opened_at', 'submit_clicked_at',
)
SCAN_LOOKAHEAD = 25
SCAN_STOP_AFTER_MISSES = 15

REASON_MAP = {
    'далеко от маршрута': 'far', 'too_far_from_route': 'far',
    'геопозиция не получена': 'no_geo', 'no_geolocation': 'no_geo',
    'транспорт не найден': 'not_found', 'vehicle_not_found': 'not_found', 'vehicle_not_active': 'not_found',
    'inpad_success_without_rating': 'draft',
}


def normalize_reason(raw):
    if raw in (None, '', 0, '0'):
        return 'ok'
    return REASON_MAP.get(str(raw).strip(), 'other')


def _num(v):
    try:
        return float(v) if v is not None and v != '' else None
    except (TypeError, ValueError):
        return None


def distance_bucket(dist):
    if dist is None:
        return 'unknown'
    if dist <= 300:
        return 'near'
    if dist <= 1000:
        return 'm300_1k'
    if dist <= 5000:
        return 'k1_5'
    if dist <= 20000:
        return 'k5_20'
    return 'k20_plus'


def _point(r):
    lat = _num(r.get('submit_clicked_lat')) or _num(r.get('page_opened_lat'))
    lng = _num(r.get('submit_clicked_lng')) or _num(r.get('page_opened_lng'))
    if lat is None or lng is None:
        return None
    return (round(lat, 5), round(lng, 5))


def fetch_rating_row(rating_id: int):
    '''Карточка записи ICQR (get_rating). Возвращает dict, {'missing': True} если записи нет, либо None при сбое сети.'''
    try:
        _, d = icqr_command('get_rating', {'rating_id': rating_id})
    except Exception:
        return None
    status = d.get('Request_status', {}) or {}
    if status.get('Code') == 'Ok':
        full = d.get('Data') or {}
        return {k: full.get(k) for k in DETAIL_FIELDS}
    if 'не найдена' in str(status.get('Message') or ''):
        return {'id': rating_id, 'missing': True}
    return None


def scan_icqr_attempts(cur, deadline: float) -> dict:
    '''Догружает в icqr_attempts_cache все записи ICQR (включая отказы result_false, которые list_ratings скрывает),
    перебирая id подряд через get_rating. Возвращает состояние сканирования.'''
    cur.execute("SELECT icqr_id, (data->>'missing') IS NOT NULL, data->>'result_false', data->>'created_at', fetched_at FROM icqr_attempts_cache")
    known = {}
    refresh = []
    max_found = 0
    for rid, missing, rf, created, fetched in cur.fetchall():
        known[rid] = missing
        if not missing:
            max_found = max(max_found, rid)
            if rf == 'inpad_success_without_rating' and created and fetched and (time.time() - fetched.timestamp()) > 600:
                refresh.append(rid)
    holes = [i for i in range(1, max_found + 1) if i not in known]
    ahead = list(range(max_found + 1, max_found + 1 + SCAN_LOOKAHEAD))
    targets = holes + refresh[-20:] + ahead

    results = {}
    done_n = none_n = 0
    for i in targets:
        if time.monotonic() > deadline:
            break
        r = fetch_rating_row(i)
        done_n += 1
        if r is None:
            none_n += 1
            continue
        results[i] = r

    new_max = max([max_found] + [i for i, r in results.items() if not r.get('missing')])
    to_store = []
    for i, r in results.items():
        if r.get('missing') and i > new_max:
            continue
        to_store.append((i, r))
    if to_store:
        values_sql = ','.join(
            cur.mogrify('(%s, %s::jsonb, now())', (i, json.dumps(r, default=str, ensure_ascii=False))).decode('utf-8')
            for i, r in to_store
        )
        cur.execute(
            'INSERT INTO icqr_attempts_cache (icqr_id, data, fetched_at) VALUES ' + values_sql
            + ' ON CONFLICT (icqr_id) DO UPDATE SET data = EXCLUDED.data, fetched_at = now()'
        )

    remaining_holes = [i for i in holes if i not in results]
    misses_ahead = 0
    for i in ahead:
        r = results.get(i)
        if r is None:
            break
        if r.get('missing'):
            misses_ahead += 1
        else:
            misses_ahead = 0
    complete = not remaining_holes and (new_max == max_found) and all(i in results for i in ahead)
    return {'complete': complete, 'maxId': new_max, 'holesLeft': len(remaining_holes)}


def build_quality_report(params: dict) -> dict:
    '''Полная картина попыток оценки из ICQR: каждая запись (принятые, черновики inpad и отказы
    "далеко от маршрута" / "геопозиция не получена" / "транспорт не найден") с геоданными и устройством.'''
    started = time.monotonic()
    deadline = started + 3.5
    date_from = params.get('date_from')
    date_to = params.get('date_to')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor()
    try:
        scan = scan_icqr_attempts(cur, deadline)
        cur.execute("SELECT data FROM icqr_attempts_cache WHERE (data->>'missing') IS NULL")
        all_rows = [r[0] for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

    def in_period(r):
        d = str(r.get('created_at') or '')[:10]
        if date_from and d < date_from:
            return False
        if date_to and d > date_to:
            return False
        return True

    rows = [dict(r) for r in all_rows if in_period(r)]

    fallback_points = {_point(r) for r in all_rows if normalize_reason(r.get('result_false')) == 'no_geo'}
    fallback_points.discard(None)

    reasons = {'ok': 0, 'draft': 0, 'far': 0, 'no_geo': 0, 'not_found': 0, 'other': 0}
    raw_reasons = {}
    buckets = {k: 0 for k in ('near', 'm300_1k', 'k1_5', 'k5_20', 'k20_plus', 'unknown')}
    far_buckets = dict(buckets)
    by_source = {}
    by_day = {}
    places = {}
    vehicles = {}
    clients = {}
    no_geo_total = 0
    not_found_no_geo = 0
    poor_accuracy = 0
    passengers = observers = 0

    for r in rows:
        reason = normalize_reason(r.get('result_false'))
        r['reason'] = reason
        reasons[reason] += 1
        if reason == 'other':
            raw_reasons[str(r.get('result_false'))] = raw_reasons.get(str(r.get('result_false')), 0) + 1

        pt = _point(r)
        if reason == 'no_geo' or pt is None:
            geo = 'none'
        elif pt in fallback_points:
            geo = 'fallback'
        else:
            geo = 'real'
        r['geo'] = geo
        if geo != 'real':
            no_geo_total += 1
            if reason == 'not_found':
                not_found_no_geo += 1

        acc = _num(r.get('submit_clicked_accuracy_m')) or _num(r.get('page_opened_accuracy_m'))
        if acc is not None and acc > 100:
            poor_accuracy += 1

        dist = _num(r.get('distance_to_route_m'))
        bucket = distance_bucket(dist) if reason in ('ok', 'far', 'draft') else 'unknown'
        r['distance_bucket'] = bucket
        if reason in ('ok', 'far', 'draft'):
            buckets[bucket] += 1
        if reason == 'far':
            far_buckets[bucket] += 1

        src = r.get('source_screen') or 'unknown'
        s_ = by_source.setdefault(src, {'source': src, 'total': 0, 'ok': 0, 'draft': 0, 'far': 0, 'no_geo': 0, 'not_found': 0, 'other': 0})
        s_['total'] += 1
        s_[reason] += 1

        day = str(r.get('created_at') or '')[:10]
        d_ = by_day.setdefault(day, {'day': day, 'total': 0, 'ok': 0, 'draft': 0, 'far': 0, 'no_geo': 0, 'not_found': 0, 'other': 0})
        d_['total'] += 1
        d_[reason] += 1

        if pt and geo == 'real':
            key = (round(pt[0], 3), round(pt[1], 3))
            p_ = places.setdefault(key, {'lat': key[0], 'lng': key[1], 'attempts': 0, 'ok': 0, 'far': 0, 'not_found': 0, 'draft': 0, 'routes': set()})
            p_['attempts'] += 1
            if reason in ('ok', 'far', 'not_found', 'draft'):
                p_[reason] += 1
            if r.get('route_number'):
                p_['routes'].add(str(r['route_number']))

        ip = r.get('is_passanger')
        if reason == 'ok':
            if ip in (1, '1', True):
                passengers += 1
            elif ip in (0, '0', False):
                observers += 1

        vn = r.get('vehicle_number')
        if vn not in (None, ''):
            vn = str(vn)
            v = vehicles.setdefault(vn, {'vehicle': vn, 'attempts': 0, 'rejected': 0, 'routes': set(), 'clients': set()})
            v['attempts'] += 1
            v['rejected'] += 1 if reason in ('far', 'not_found', 'no_geo') else 0
            if r.get('route_number'):
                v['routes'].add(str(r['route_number']))
            if r.get('rating_client_id'):
                v['clients'].add(r['rating_client_id'])

        cid = r.get('rating_client_id') or ''
        if cid:
            c = clients.setdefault(cid, {'client': cid[:8], 'attempts': 0, 'rejected': 0, 'routes': set(), 'vehicles': set(), 'noGeo': 0})
            c['attempts'] += 1
            c['rejected'] += 1 if reason in ('far', 'not_found', 'no_geo') else 0
            c['noGeo'] += 1 if geo != 'real' else 0
            if r.get('route_number'):
                c['routes'].add(str(r['route_number']))
            if vn:
                c['vehicles'].add(vn)

        r['client'] = cid[:8] if cid else None
        r.pop('rating_client_id', None)
        r['lat'], r['lng'] = (pt if pt and geo == 'real' else (None, None))
        for k in ('page_opened_lat', 'page_opened_lng', 'submit_clicked_lat', 'submit_clicked_lng'):
            r.pop(k, None)

    def pack(d, n=10, key='attempts'):
        out = []
        for v in sorted(d.values(), key=lambda x: -x[key])[:n]:
            item = dict(v)
            for k in ('routes', 'vehicles'):
                if k in item:
                    item[k] = sorted(item[k])
            if 'clients' in item:
                item['clients'] = len(item['clients'])
            out.append(item)
        return out

    suspicious_vehicles = [v for v in pack(vehicles, 100) if len(v['routes']) >= 2 or v['clients'] >= 3]
    rejected = reasons['far'] + reasons['no_geo'] + reasons['not_found']

    return {
        'period': {'dateFrom': date_from, 'dateTo': date_to},
        'elapsed': round(time.monotonic() - started, 2),
        'scan': scan,
        'truncated': not scan['complete'],
        'total': len(rows),
        'analyzed': len(rows),
        'accepted': reasons['ok'],
        'drafts': reasons['draft'],
        'rejected': rejected,
        'reasonCounts': reasons,
        'otherReasons': raw_reasons,
        'noGeo': no_geo_total,
        'noGeoRejected': reasons['no_geo'],
        'notFoundNoGeo': not_found_no_geo,
        'poorAccuracy': poor_accuracy,
        'passengers': passengers,
        'observers': observers,
        'distanceBuckets': buckets,
        'rejectedDistanceBuckets': far_buckets,
        'bySource': sorted(by_source.values(), key=lambda x: -x['total']),
        'byDay': sorted(by_day.values(), key=lambda x: x['day'], reverse=True),
        'topPlaces': [p for p in pack(places, 10) if p['attempts'] >= 2],
        'uniqueClients': len(clients),
        'uniqueVehicles': len(vehicles),
        'topVehicles': pack(vehicles),
        'suspiciousVehicles': suspicious_vehicles,
        'topClients': pack(clients),
        'rows': sorted(rows, key=lambda x: str(x.get('created_at') or ''), reverse=True),
    }


def handler(event: dict, context) -> dict:
    '''Прокси (BFF) к ICQR Admin Command API для модерации отзывов пассажиров: очередь pending,
    карточка отзыва, действия approve/reject/reset. Список дополнительно обогащается полем is_passanger
    параллельными запросами get_rating (list_ratings это поле не отдаёт). Требует валидный токен сессии в X-Admin-Token.
    Args: event - dict с httpMethod, queryStringParameters (status, page, per_page, rating_id,
        route_number, has_comment, date_from, date_to), body для POST-действий модерации,
        headers X-Admin-Token; context - объект с request_id.
    Returns: HTTP response с данными очереди/карточки/результатом модерации.
    '''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    headers = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

    params = event.get('queryStringParameters') or {}
    action_route = params.get('action', 'list')

    secret = os.environ['DATABASE_URL']
    req_headers = event.get('headers', {}) or {}
    token = req_headers.get('X-Admin-Token') or req_headers.get('x-admin-token', '')
    if not token or not verify_token(secret, token):
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'unauthorized'}),
        }

    if method == 'GET' and action_route == 'quality':
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps(build_quality_report(params), default=str, ensure_ascii=False)}

    if method == 'GET' and action_route == 'get':
        rating_id = params.get('rating_id')
        if not rating_id:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'rating_id_required'})}
        try:
            rating_id = int(rating_id)
        except ValueError:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'invalid_rating_id'})}

        status, payload = icqr_command('get_rating', {'rating_id': rating_id})
        if payload.get('Request_status', {}).get('Code') != 'Ok':
            return {
                'statusCode': status if status != 200 else 502,
                'headers': headers,
                'body': json.dumps({'error': payload.get('Request_status', {}).get('Code', 'icqr_error'),
                                     'message': payload.get('Request_status', {}).get('Message')}),
            }
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'item': payload.get('Data')})}

    if method == 'GET':
        moderation_status = params.get('status', 'pending')
        if moderation_status not in ALLOWED_STATUSES:
            moderation_status = 'pending'

        command_params = {'moderation_status': moderation_status}

        route_number = params.get('route_number')
        if route_number:
            command_params['route_number'] = route_number

        location_code = params.get('location_code')
        if location_code:
            command_params['location_code'] = location_code

        route_id = params.get('route_id')
        if route_id:
            command_params['route_id'] = route_id

        date_from = params.get('date_from')
        if date_from:
            command_params['date_from'] = date_from

        date_to = params.get('date_to')
        if date_to:
            command_params['date_to'] = date_to

        has_comment = params.get('has_comment')
        if has_comment is not None:
            command_params['has_comment'] = has_comment.lower() == 'true'

        try:
            page = max(1, int(params.get('page', 1)))
        except (TypeError, ValueError):
            page = 1
        try:
            per_page = min(100, max(1, int(params.get('per_page', 50))))
        except (TypeError, ValueError):
            per_page = 50

        command_params['page'] = page
        command_params['per_page'] = per_page

        status, payload = icqr_command('list_ratings', command_params)
        if payload.get('Request_status', {}).get('Code') != 'Ok':
            return {
                'statusCode': status if status != 200 else 502,
                'headers': headers,
                'body': json.dumps({'error': payload.get('Request_status', {}).get('Code', 'icqr_error'),
                                     'message': payload.get('Request_status', {}).get('Message')}),
            }
        data = payload.get('Data', {})
        items = data.get('items', [])
        enrich_is_passenger(items)
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'items': items,
                'pagination': data.get('pagination', {}),
            }),
        }

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        rating_id = body.get('rating_id')
        action = body.get('action')
        moderation_note = body.get('moderation_note')
        moderator_id = body.get('moderator_id')

        if not rating_id:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'rating_id_required'})}
        if action not in ALLOWED_ACTIONS:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'invalid_action'})}

        command_params = {'rating_id': int(rating_id), 'action': action}
        if moderation_note:
            command_params['moderation_note'] = str(moderation_note)[:500]
        if moderator_id:
            command_params['moderator_id'] = str(moderator_id)[:64]

        status, payload = icqr_command('moderate_rating', command_params)
        if payload.get('Request_status', {}).get('Code') != 'Ok':
            return {
                'statusCode': status if status != 200 else 502,
                'headers': headers,
                'body': json.dumps({'error': payload.get('Request_status', {}).get('Code', 'icqr_error'),
                                     'message': payload.get('Request_status', {}).get('Message')}),
            }
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'item': payload.get('Data')})}

    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({'error': 'method_not_allowed'}),
    }