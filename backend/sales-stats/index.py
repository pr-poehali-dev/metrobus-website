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
    '''Возвращает агрегированную статистику продаж билетов ICQR для консоли модерации: выручку,
    динамику по дням, разбивку по маршрутам/перевозчикам/способам оплаты, статус платежей и промокоды.
    Требует валидный токен сессии в заголовке X-Admin-Token.
    Args: event - dict с httpMethod, queryStringParameters (date_from, date_to); headers X-Admin-Token;
        context - объект с request_id.
    Returns: HTTP response с JSON { summary, timeline, byRoute, byCarrier, byPaymentStatus, topPromocodes }.
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
    date_from = params.get('date_from')
    date_to = params.get('date_to')

    conditions = ["payment_status = 'PAID'"]
    values: list = []
    if date_from:
        conditions.append("payment_at >= %s")
        values.append(date_from)
    if date_to:
        conditions.append("payment_at < (%s::date + INTERVAL '1 day')")
        values.append(date_to)
    where_clause = f"WHERE {' AND '.join(conditions)}"

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute(
            f"""
            SELECT
                COALESCE(SUM(amount_price), 0) AS revenue,
                COALESCE(SUM(icqr_price), 0) AS commission,
                COUNT(*) AS tickets_count,
                COALESCE(AVG(amount_price), 0) AS avg_ticket
            FROM icqr_tickets
            {where_clause}
            """,
            values,
        )
        summary_row = cur.fetchone()

        cur.execute(
            """
            SELECT COUNT(*) AS refunds_count, COALESCE(SUM(sum), 0) AS refunds_sum
            FROM icqr_ticket_refunds
            WHERE type = 'REFUND'
            """
        )
        refunds_row = cur.fetchone()

        cur.execute(
            f"""
            SELECT date_trunc('day', payment_at)::date AS day,
                   COALESCE(SUM(amount_price), 0) AS revenue,
                   COUNT(*) AS cnt
            FROM icqr_tickets
            {where_clause}
            GROUP BY day
            ORDER BY day
            """,
            values,
        )
        timeline = [
            {'day': r['day'].isoformat(), 'revenue': int(r['revenue']), 'count': int(r['cnt'])}
            for r in cur.fetchall()
        ]

        cur.execute(
            f"""
            SELECT route_number, COALESCE(SUM(amount_price), 0) AS revenue, COUNT(*) AS cnt
            FROM icqr_tickets
            {where_clause} AND route_number IS NOT NULL
            GROUP BY route_number
            ORDER BY revenue DESC
            LIMIT 15
            """,
            values,
        )
        by_route = [
            {'routeNumber': r['route_number'], 'revenue': int(r['revenue']), 'count': int(r['cnt'])}
            for r in cur.fetchall()
        ]

        cur.execute(
            f"""
            SELECT carrier_name, COALESCE(SUM(amount_price), 0) AS revenue,
                   COALESCE(SUM(icqr_price), 0) AS commission, COUNT(*) AS cnt
            FROM icqr_tickets
            {where_clause} AND carrier_name IS NOT NULL
            GROUP BY carrier_name
            ORDER BY revenue DESC
            LIMIT 15
            """,
            values,
        )
        by_carrier = [
            {
                'carrierName': r['carrier_name'],
                'revenue': int(r['revenue']),
                'commission': int(r['commission']),
                'count': int(r['cnt']),
            }
            for r in cur.fetchall()
        ]

        cur.execute(
            """
            SELECT payment_status, COUNT(*) AS cnt
            FROM icqr_tickets
            GROUP BY payment_status
            """
        )
        by_payment_status = [
            {'status': r['payment_status'] or 'UNKNOWN', 'count': int(r['cnt'])}
            for r in cur.fetchall()
        ]

        cur.execute(
            f"""
            SELECT promokod, COUNT(*) AS cnt, COALESCE(SUM(amount_price), 0) AS revenue
            FROM icqr_tickets
            {where_clause} AND promokod IS NOT NULL AND promokod != ''
            GROUP BY promokod
            ORDER BY cnt DESC
            LIMIT 10
            """,
            values,
        )
        top_promocodes = [
            {'promokod': r['promokod'], 'count': int(r['cnt']), 'revenue': int(r['revenue'])}
            for r in cur.fetchall()
        ]

        result = {
            'summary': {
                'revenue': int(summary_row['revenue']),
                'commission': int(summary_row['commission']),
                'ticketsCount': int(summary_row['tickets_count']),
                'avgTicket': round(float(summary_row['avg_ticket']), 2),
                'refundsCount': int(refunds_row['refunds_count']),
                'refundsSum': float(refunds_row['refunds_sum']),
            },
            'timeline': timeline,
            'byRoute': by_route,
            'byCarrier': by_carrier,
            'byPaymentStatus': by_payment_status,
            'topPromocodes': top_promocodes,
        }

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(result),
        }
    finally:
        cur.close()
        conn.close()
