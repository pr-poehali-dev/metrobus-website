import json
import os
import hmac
import hashlib
import time
import binascii
import psycopg2


def make_token(secret: str, role: str, login: str, ttl_seconds: int = 12 * 3600) -> str:
    expires = int(time.time()) + ttl_seconds
    payload = f"{role}:{login}:{expires}"
    sig = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{role}:{login}:{expires}.{sig}"


def verify_token(secret: str, token: str):
    try:
        payload, sig = token.rsplit('.', 1)
        role, login, expires_str = payload.split(':', 2)
    except ValueError:
        return None
    expected = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, sig):
        return None
    if int(expires_str) <= int(time.time()):
        return None
    return {'role': role, 'login': login}


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, hash_hex = stored_hash.split('$', 1)
    except ValueError:
        return False
    salt = binascii.unhexlify(salt_hex)
    expected = binascii.unhexlify(hash_hex)
    computed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
    return hmac.compare_digest(computed, expected)


def handler(event: dict, context) -> dict:
    '''Аутентификация перевозчиков и заказчиков (регуляторов) по логину/паролю.
    POST { role, login, password } проверяет учётные данные в таблице role_accounts и выдаёт токен сессии.
    GET с заголовком X-Role-Token проверяет валидность токена и возвращает role/login/orgName.
    Args: event - dict с httpMethod, body или headers X-Role-Token; context - объект с request_id.
    Returns: HTTP response с токеном сессии и данными аккаунта, либо статусом валидности.
    '''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Role-Token',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    headers = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}
    secret = os.environ['DATABASE_URL']
    dsn = os.environ['DATABASE_URL']

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        role = str(body.get('role', ''))
        login = str(body.get('login', '')).strip()
        password = str(body.get('password', ''))

        if role not in ('carrier', 'regulator') or not login or not password:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'invalid_request'}),
            }

        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        try:
            cur.execute(
                "SELECT password_hash, org_name FROM role_accounts WHERE role = %s AND login = %s",
                (role, login),
            )
            row = cur.fetchone()
        finally:
            cur.close()
            conn.close()

        if not row or not verify_password(password, row[0]):
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'invalid_credentials'}),
            }

        token = make_token(secret, role, login)
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'token': token, 'role': role, 'login': login, 'orgName': row[1]}),
        }

    if method == 'GET':
        req_headers = event.get('headers', {}) or {}
        token = req_headers.get('X-Role-Token') or req_headers.get('x-role-token', '')
        session = verify_token(secret, token) if token else None
        if not session:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'valid': False}),
            }

        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        try:
            cur.execute(
                "SELECT org_name FROM role_accounts WHERE role = %s AND login = %s",
                (session['role'], session['login']),
            )
            row = cur.fetchone()
        finally:
            cur.close()
            conn.close()

        if not row:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'valid': False}),
            }

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'valid': True, 'role': session['role'], 'login': session['login'], 'orgName': row[0]}),
        }

    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({'error': 'method_not_allowed'}),
    }
