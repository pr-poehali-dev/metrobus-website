import json
import os
import hmac
import hashlib
import time


def make_token(secret: str, ttl_seconds: int = 12 * 3600) -> str:
    expires = int(time.time()) + ttl_seconds
    sig = hmac.new(secret.encode(), str(expires).encode(), hashlib.sha256).hexdigest()
    return f"{expires}.{sig}"


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
    '''Проверяет ПИН-код администратора и выдаёт временный токен сессии для доступа к панели модерации.
    Args: event - dict с httpMethod, body ({"pin": "1234"}) или headers X-Admin-Token для проверки; context - объект с request_id.
    Returns: HTTP response с токеном сессии или статусом валидности.
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

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        pin = str(body.get('pin', ''))
        expected_pin = os.environ.get('ADMIN_PIN', '')
        if not expected_pin or not hmac.compare_digest(pin, expected_pin):
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'invalid_pin'}),
            }
        token = make_token(secret)
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'token': token}),
        }

    if method == 'GET':
        req_headers = event.get('headers', {}) or {}
        token = req_headers.get('X-Admin-Token') or req_headers.get('x-admin-token', '')
        valid = bool(token) and verify_token(secret, token)
        return {
            'statusCode': 200 if valid else 401,
            'headers': headers,
            'body': json.dumps({'valid': valid}),
        }

    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({'error': 'method_not_allowed'}),
    }
