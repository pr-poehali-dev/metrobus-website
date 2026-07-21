import json
import os
import urllib.request
import psycopg2


def get_client_ip(event: dict) -> str:
    headers = event.get('headers', {}) or {}
    xff = headers.get('X-Forwarded-For') or headers.get('x-forwarded-for')
    if xff:
        return xff.split(',')[0].strip()
    request_context = event.get('requestContext', {}) or {}
    identity = request_context.get('identity', {}) or {}
    return identity.get('sourceIp') or '0.0.0.0'


def lookup_city_by_ip(ip: str) -> dict:
    try:
        url = f'https://ipwho.is/{ip}?lang=ru'
        req = urllib.request.Request(url, headers={'User-Agent': 'metrobus'})
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode())
        if data.get('success') and data.get('country_code') == 'RU':
            return {'city': data.get('city'), 'region': data.get('region')}
    except Exception:
        pass
    return {'city': None, 'region': None}


def handler(event: dict, context) -> dict:
    '''Определяет город пользователя по IP и фиксирует голос "хочу сервис в своём городе".
    Args: event - dict с httpMethod; GET определяет город по IP отправителя, POST с body {"city", "region"}
        записывает голос (уникальный по паре город+IP); context - объект с request_id.
    Returns: HTTP response с определённым городом (GET) или количеством голосов за город (POST).
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
    ip = get_client_ip(event)

    if method == 'GET':
        geo = lookup_city_by_ip(ip)
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps(geo)}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        city = (body.get('city') or '').strip()
        region = (body.get('region') or '').strip()
        if not city:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'city_required'}),
            }

        dsn = os.environ['DATABASE_URL']
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        try:
            cur.execute(
                "INSERT INTO city_votes (city, region, ip) VALUES (%s, %s, %s) "
                "ON CONFLICT (city, ip) DO NOTHING",
                (city, region, ip),
            )
            conn.commit()
            cur.execute("SELECT COUNT(*) FROM city_votes WHERE city = %s", (city,))
            count = cur.fetchone()[0]
        finally:
            cur.close()
            conn.close()

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'success': True, 'votes': count}),
        }

    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({'error': 'method_not_allowed'}),
    }
