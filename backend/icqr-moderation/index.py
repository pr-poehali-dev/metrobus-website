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
)


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


def build_quality_report(params: dict) -> dict:
    '''Собирает полную картину попыток оценки за период: все записи ICQR (включая soft-отказы result_false),
    детализированные через get_rating — геопозиция, расстояние до маршрута, номер ТС, клиент.'''
    started = time.monotonic()
    deadline = started + 3.3
    date_from = params.get('date_from')
    date_to = params.get('date_to')
    base = {'moderation_status': 'all', 'include_soft': True, 'per_page': 100}
    if date_from:
        base['date_from'] = date_from
    if date_to:
        base['date_to'] = date_to

    items = []
    page = 1
    total = 0
    while page <= 5:
        _, payload = icqr_command('list_ratings', dict(base, page=page))
        if payload.get('Request_status', {}).get('Code') != 'Ok':
            return {'error': payload.get('Request_status', {}).get('Message') or 'icqr_error'}
        data = payload.get('Data') or {}
        items.extend(data.get('items') or [])
        pag = data.get('pagination') or {}
        total = pag.get('total') or len(items)
        if page >= (pag.get('total_pages') or 1):
            break
        page += 1

    list_elapsed = round(time.monotonic() - started, 2)
    deadline = time.monotonic() + 7

    def fetch_one(it):
        try:
            _, d = icqr_command('get_rating', {'rating_id': it['id']})
            if d.get('Request_status', {}).get('Code') == 'Ok':
                full = d.get('Data') or {}
                return {k: full.get(k, it.get(k)) for k in DETAIL_FIELDS}
        except Exception:
            pass
        return None

    cached = {}
    ids = [int(it['id']) for it in items if it.get('id') is not None]
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor()
    try:
        if ids:
            cur.execute('SELECT icqr_id, data FROM icqr_attempts_cache WHERE icqr_id IN (' + ','.join(str(i) for i in ids) + ')')
            cached = {r[0]: r[1] for r in cur.fetchall()}

        missing = [it for it in items if it.get('id') is not None and int(it['id']) not in cached]
        fetched = []
        if missing:
            pool = ThreadPoolExecutor(max_workers=12)
            futures = [pool.submit(fetch_one, it) for it in missing]
            wait(futures, timeout=max(0.3, deadline - time.monotonic()))
            for f in futures:
                if f.done() and f.result() is not None:
                    fetched.append(f.result())
            pool.shutdown(wait=False, cancel_futures=True)
        if fetched:
            values_sql = ','.join(
                cur.mogrify('(%s, %s::jsonb, now())', (int(r['id']), json.dumps(r, default=str, ensure_ascii=False))).decode('utf-8')
                for r in fetched
            )
            cur.execute(
                'INSERT INTO icqr_attempts_cache (icqr_id, data, fetched_at) VALUES ' + values_sql
                + ' ON CONFLICT (icqr_id) DO UPDATE SET data = EXCLUDED.data, fetched_at = now()'
            )
            for r in fetched:
                cached[int(r['id'])] = r
    finally:
        cur.close()
        conn.close()

    rows = []
    for it in items:
        d = cached.get(int(it['id'])) if it.get('id') is not None else None
        if d:
            row = dict(d)
            row['moderation_status'] = it.get('moderation_status', row.get('moderation_status'))
            row['result_false'] = it.get('result_false')
            rows.append(row)
    pending_details = len(items) - len(rows)

    reasons = {}
    buckets = {k: 0 for k in ('near', 'm300_1k', 'k1_5', 'k5_20', 'k20_plus', 'unknown')}
    rejected_buckets = dict(buckets)
    vehicles = {}
    clients = {}
    no_geo = no_geo_rejected = partial_geo = poor_accuracy = 0
    accepted = rejected = 0
    passengers = observers = 0

    for r in rows:
        has_open = r.get('page_opened_lat') not in (None, '')
        has_submit = r.get('submit_clicked_lat') not in (None, '')
        if not has_open and not has_submit:
            geo = 'none'
            no_geo += 1
        elif has_open and has_submit:
            geo = 'full'
        else:
            geo = 'partial'
            partial_geo += 1
        r['geo'] = geo

        acc = _num(r.get('submit_clicked_accuracy_m')) or _num(r.get('page_opened_accuracy_m'))
        if acc is not None and acc > 100:
            poor_accuracy += 1

        dist = _num(r.get('distance_to_route_m'))
        bucket = distance_bucket(dist)
        r['distance_bucket'] = bucket
        buckets[bucket] += 1

        reason = r.get('result_false')
        if reason:
            rejected += 1
            reasons[reason] = reasons.get(reason, 0) + 1
            rejected_buckets[bucket] += 1
            if geo == 'none':
                no_geo_rejected += 1
        else:
            accepted += 1

        ip = r.get('is_passanger')
        if ip in (1, '1', True):
            passengers += 1
        elif ip in (0, '0', False):
            observers += 1

        vn = str(r.get('vehicle_number') or '—')
        v = vehicles.setdefault(vn, {'vehicle': vn, 'attempts': 0, 'rejected': 0, 'routes': set(), 'clients': set()})
        v['attempts'] += 1
        v['rejected'] += 1 if reason else 0
        if r.get('route_number'):
            v['routes'].add(str(r['route_number']))
        cid = r.get('rating_client_id') or ''
        if cid:
            v['clients'].add(cid)
            c = clients.setdefault(cid, {'client': cid[:8], 'attempts': 0, 'rejected': 0, 'routes': set(), 'vehicles': set(), 'noGeo': 0})
            c['attempts'] += 1
            c['rejected'] += 1 if reason else 0
            c['noGeo'] += 1 if geo == 'none' else 0
            if r.get('route_number'):
                c['routes'].add(str(r['route_number']))
            c['vehicles'].add(vn)
        r['client'] = cid[:8] if cid else None
        r.pop('rating_client_id', None)
        for k in ('page_opened_lat', 'page_opened_lng', 'submit_clicked_lat', 'submit_clicked_lng'):
            r.pop(k, None)

    def pack(d, n=10):
        out = []
        for v in sorted(d.values(), key=lambda x: -x['attempts'])[:n]:
            item = dict(v)
            for k in ('routes', 'vehicles', 'clients'):
                if k in item:
                    item[k] = sorted(item[k]) if k != 'clients' else len(item[k])
            out.append(item)
        return out

    suspicious_vehicles = [v for v in pack(vehicles, 50) if len(v['routes']) >= 2 or v['clients'] >= 3]

    return {
        'period': {'dateFrom': date_from, 'dateTo': date_to},
        'elapsed': round(time.monotonic() - started, 2),
        'listElapsed': list_elapsed,
        'total': total,
        'analyzed': len(rows),
        'truncated': pending_details > 0,
        'pendingDetails': pending_details,
        'accepted': accepted,
        'rejected': rejected,
        'reasons': reasons,
        'noGeo': no_geo,
        'noGeoRejected': no_geo_rejected,
        'partialGeo': partial_geo,
        'poorAccuracy': poor_accuracy,
        'passengers': passengers,
        'observers': observers,
        'distanceBuckets': buckets,
        'rejectedDistanceBuckets': rejected_buckets,
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