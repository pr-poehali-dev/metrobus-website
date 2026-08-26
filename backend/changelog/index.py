import json
import os
import hmac
import hashlib
import time
import psycopg2
import psycopg2.extras


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
    '''Управляет записями истории обновлений сервиса (changelog).
    GET без токена — публичный список опубликованных записей (для страницы /changelog), отсортированных
    по entry_date DESC, sort_order DESC. GET с X-Admin-Token — возвращает все записи (включая неопубликованные)
    для админ-панели. POST/PUT с X-Admin-Token создаёт или обновляет запись { id?, entryDate, title, items, published }.
    DELETE с X-Admin-Token и query id удаляет запись.
    Args: event - dict с httpMethod, queryStringParameters (id для DELETE), body (JSON записи для POST/PUT),
        headers (X-Admin-Token для операций записи/просмотра черновиков); context - объект с request_id.
    Returns: HTTP response с JSON { items } для GET, { ok, id } для POST/PUT/DELETE.
    '''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    headers = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}
    secret = os.environ['DATABASE_URL']

    req_headers = event.get('headers', {}) or {}
    token = req_headers.get('X-Admin-Token') or req_headers.get('x-admin-token', '')
    is_admin = bool(token) and verify_token(secret, token)

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        if method == 'GET':
            if is_admin:
                cur.execute(
                    "SELECT id, entry_date, title, items, published, sort_order FROM changelog_entries "
                    "ORDER BY entry_date DESC, sort_order DESC, id DESC"
                )
            else:
                cur.execute(
                    "SELECT id, entry_date, title, items, published, sort_order FROM changelog_entries "
                    "WHERE published = true ORDER BY entry_date DESC, sort_order DESC, id DESC"
                )
            rows = cur.fetchall()
            items = [{
                'id': r['id'],
                'entryDate': r['entry_date'].isoformat(),
                'title': r['title'],
                'items': r['items'],
                'published': r['published'],
                'sortOrder': r['sort_order'],
            } for r in rows]
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'items': items})}

        if not is_admin:
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'unauthorized'})}

        if method in ('POST', 'PUT'):
            body = json.loads(event.get('body') or '{}')
            entry_id = body.get('id')
            entry_date = body.get('entryDate')
            title = body.get('title')
            items_list = body.get('items') or []
            published = bool(body.get('published', True))
            sort_order = int(body.get('sortOrder', 0))

            if not entry_date or not title:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'entryDate_and_title_required'})}

            if entry_id:
                cur.execute(
                    "UPDATE changelog_entries SET entry_date = %s, title = %s, items = %s, "
                    "published = %s, sort_order = %s, updated_at = now() WHERE id = %s RETURNING id",
                    (entry_date, title, json.dumps(items_list), published, sort_order, entry_id),
                )
                row = cur.fetchone()
                if not row:
                    conn.rollback()
                    return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'not_found'})}
                conn.commit()
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True, 'id': row['id']})}
            else:
                cur.execute(
                    "INSERT INTO changelog_entries (entry_date, title, items, published, sort_order) "
                    "VALUES (%s, %s, %s, %s, %s) RETURNING id",
                    (entry_date, title, json.dumps(items_list), published, sort_order),
                )
                new_id = cur.fetchone()['id']
                conn.commit()
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True, 'id': new_id})}

        if method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            entry_id = params.get('id')
            if not entry_id:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'id_required'})}
            cur.execute("DELETE FROM changelog_entries WHERE id = %s RETURNING id", (entry_id,))
            row = cur.fetchone()
            conn.commit()
            if not row:
                return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'not_found'})}
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True, 'id': row['id']})}

        return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'method_not_allowed'})}
    finally:
        cur.close()
        conn.close()
