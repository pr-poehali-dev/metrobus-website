import json
import os
import hmac
import hashlib
import time
import urllib.request
import urllib.error


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


def handler(event: dict, context) -> dict:
    '''Прокси (BFF) к ICQR Admin Command API для модерации отзывов пассажиров: очередь pending,
    карточка отзыва, действия approve/reject/reset. Требует валидный токен сессии в X-Admin-Token.
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
    action_route = params.get('action', 'list')

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
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'items': data.get('items', []),
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
