import json
import os
import psycopg2


def handler(event: dict, context) -> dict:
    '''Возвращает справочник номеров маршрутов города из таблицы transport_routes — полный список,
    синхронизируемый раз в сутки из ICQR Admin API (get_all_routes) независимо от того, есть ли
    по маршруту одобренные отзывы или прошли ли они модерацию. Используется на фронтенде для
    подсказки/валидации при вводе номеров маршрутов в фильтре "Мои маршруты".
    Args: event - dict с httpMethod; context - объект с request_id.
    Returns: HTTP response с JSON { routes: { number: string, types: string[] }[] } — отсортированный
    список уникальных номеров маршрутов с видами транспорта, которые их обслуживают.
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
        cur.execute(
            "SELECT route_number, array_agg(DISTINCT transport_type ORDER BY transport_type) "
            "FROM transport_routes WHERE transport_type != '' GROUP BY route_number ORDER BY route_number"
        )
        routes = [{'number': r[0], 'types': r[1]} for r in cur.fetchall()]
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'routes': routes}),
        }
    finally:
        cur.close()
        conn.close()