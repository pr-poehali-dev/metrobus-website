import json
import os
import psycopg2


def handler(event: dict, context) -> dict:
    '''Возвращает справочник номеров маршрутов города из таблицы transport_routes — полный список,
    синхронизируемый раз в сутки из ICQR Admin API (get_all_routes) независимо от того, есть ли
    по маршруту одобренные отзывы или прошли ли они модерацию. Используется на фронтенде для
    подсказки/валидации при вводе номеров маршрутов в фильтре "Мои маршруты".
    Args: event - dict с httpMethod; context - объект с request_id.
    Returns: HTTP response с JSON { routes: string[] } — отсортированный список уникальных номеров маршрутов.
    '''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    headers = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    try:
        cur.execute("SELECT DISTINCT route_number FROM transport_routes ORDER BY route_number")
        routes = [r[0] for r in cur.fetchall()]
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'routes': routes}),
        }
    finally:
        cur.close()
        conn.close()
