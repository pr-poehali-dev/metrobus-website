import json
import os
import smtplib
import ssl
import time
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime, timedelta
from email.mime.text import MIMEText
import psycopg2


ICQR_BASE_URL = os.environ.get('ICQR_API_BASE_URL', 'https://api.icqr.ru')
ADMIN_ALERT_EMAIL = 'support@icqr.ru'
ALERT_THROTTLE_SECONDS = 3600

MOSCOW_OFFSET_HOURS = 3
MODERATION_DIGEST_SENT_KEY = 'moderation_digest_sent_date'
ADMIN_CONSOLE_URL = 'https://xn--90aivcdt6a.xn--p1ai/service/mb-console'
TRANSPORT_LABELS = {'bus': 'Автобус', 'tram': 'Трамвай', 'trolley': 'Троллейбус'}


def fetch_page(page: int, per_page: int = 100):
    token = os.environ['ICQR_API_TOKEN']
    params = {'page': page, 'per_page': per_page}
    url = f"{ICQR_BASE_URL}/json/ratings-published?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json',
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode('utf-8'))


def fetch_routes_page(location: str, page: int, per_page: int = 200):
    token = os.environ['ICQR_API_ADMIN_TOKEN']
    body = json.dumps({
        'Command': 'get_all_routes',
        'Command_params': {'location': location, 'page': page, 'per_page': per_page},
    }).encode('utf-8')
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
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode('utf-8'))


ROUTES_LOCATIONS = ('8-812', 'SPB')


def get_routes_sync_progress(cur):
    '''Читает сохранённый прогресс постраничной синхронизации справочника маршрутов
    (app_settings.routes_sync_progress, JSON) — locationIdx, page, upserted. Отсутствие записи
    означает, что сейчас не идёт незавершённый цикл синхронизации.'''
    cur.execute("SELECT value FROM app_settings WHERE key = 'routes_sync_progress'")
    row = cur.fetchone()
    if not row or not row[0]:
        return None
    try:
        return json.loads(row[0])
    except (TypeError, ValueError):
        return None


def save_routes_sync_progress(cur, progress: dict):
    cur.execute(
        """
        INSERT INTO app_settings (key, value, updated_at) VALUES ('routes_sync_progress', %s, now())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
        """,
        (json.dumps(progress),),
    )


def clear_routes_sync_progress(cur):
    cur.execute("DELETE FROM app_settings WHERE key = 'routes_sync_progress'")


def upsert_routes_page(cur, items: list):
    '''Записывает элементы одной страницы get_all_routes в transport_routes (upsert по route_number
    + transport_type).'''
    for item in items:
        route_number = str(item.get('route_number') or item.get('number') or '').strip()
        if not route_number:
            continue
        transport_type = (item.get('transport_type') or item.get('type') or '').strip().lower()
        cur.execute(
            """
            INSERT INTO transport_routes (icqr_route_id, route_number, title, transport_type, synced_at)
            VALUES (%s, %s, %s, %s, now())
            ON CONFLICT (route_number, transport_type) DO UPDATE SET
                icqr_route_id = EXCLUDED.icqr_route_id,
                title = EXCLUDED.title,
                synced_at = now()
            """,
            (item.get('id'), route_number, item.get('title'), transport_type),
        )


def sync_routes_page(cur, force: bool = False):
    '''Догружает ОДНУ страницу справочника маршрутов ICQR Admin API (get_all_routes) за один вызов —
    так справочник из ~624 маршрутов на нескольких страницах (по 200) синхронизируется без обрыва
    по таймауту облачной функции (5 сек), которым упирался прежний вариант, скачивавший весь
    справочник за один вызов. Прогресс (текущая локация, номер страницы) хранится в
    app_settings.routes_sync_progress и переживает между вызовами — каждый следующий вызов
    (плановый, при обычном триггере синхронизации отзывов с фронтенда, либо ручной — кнопкой
    "Обновить маршруты" в админ-консоли) продолжает с той страницы, где остановились, вместо
    повторного скачивания с начала. Перебирает известные коды локаций Санкт-Петербурга ("8-812",
    "SPB"), пока одна из них не вернёт непустой список. Новый цикл синхронизации стартует не чаще
    раза в сутки (app_settings.routes_last_full_sync_at) — если force=True (ручной запуск), суточное
    ограничение игнорируется только для СТАРТА нового цикла; уже начатый цикл всегда продолжается
    независимо от force.
    Возвращает dict {done, syncedTotal, page, totalPages} — done=True, когда справочник полностью
    пересинхронизирован (тогда также обновлены total_active_routes_count и routes_last_full_sync_at);
    либо строку 'skipped', если новый цикл не стартовал (недавно завершался и force=False); либо
    None, если запрос к ICQR Admin API не удался на всех локациях.'''
    progress = get_routes_sync_progress(cur)
    if progress is None:
        if not force:
            cur.execute("SELECT value FROM app_settings WHERE key = 'routes_last_full_sync_at'")
            row = cur.fetchone()
            if row and row[0]:
                try:
                    last_full = datetime.fromisoformat(row[0])
                    if (datetime.now() - last_full).total_seconds() < 86400:
                        return 'skipped'
                except ValueError:
                    pass
        progress = {'locationIdx': 0, 'page': 1}

    loc = ROUTES_LOCATIONS[progress['locationIdx']]
    try:
        payload = fetch_routes_page(loc, progress['page'], 200)
    except Exception:
        payload = None

    def try_next_location():
        if progress['locationIdx'] < len(ROUTES_LOCATIONS) - 1:
            progress['locationIdx'] += 1
            progress['page'] = 1
            save_routes_sync_progress(cur, progress)
            cur.execute("SELECT COUNT(DISTINCT (route_number, transport_type)) FROM transport_routes")
            return {'done': False, 'syncedTotal': int(cur.fetchone()[0]), 'page': None, 'totalPages': None}
        clear_routes_sync_progress(cur)
        return None

    if not payload or payload.get('Request_status', {}).get('Code') != 'Ok':
        return try_next_location()

    data = payload.get('Data') or {}
    items = data.get('items') or []
    pagination = data.get('pagination') or {}
    total_pages = pagination.get('total_pages') or 1

    if not items and progress['page'] == 1:
        return try_next_location()

    upsert_routes_page(cur, items)

    if not items or progress['page'] >= total_pages:
        cur.execute("SELECT COUNT(DISTINCT (route_number, transport_type)) FROM transport_routes")
        synced_total = int(cur.fetchone()[0])
        cur.execute(
            """
            INSERT INTO app_settings (key, value, updated_at) VALUES ('total_active_routes_count', %s, now())
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
            """,
            (str(synced_total),),
        )
        cur.execute(
            """
            INSERT INTO app_settings (key, value, updated_at) VALUES ('routes_last_full_sync_at', %s, now())
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
            """,
            (datetime.now().isoformat(),),
        )
        clear_routes_sync_progress(cur)
        return {'done': True, 'syncedTotal': synced_total, 'page': progress['page'], 'totalPages': total_pages}

    progress['page'] += 1
    save_routes_sync_progress(cur, progress)
    cur.execute("SELECT COUNT(DISTINCT (route_number, transport_type)) FROM transport_routes")
    synced_total = int(cur.fetchone()[0])
    return {'done': False, 'syncedTotal': synced_total, 'page': progress['page'], 'totalPages': total_pages}


def fetch_rating_details(rating_id: int):
    '''Запрашивает у ICQR Admin API карточку отзыва с геоданными (page_opened_*, submit_*), vehicle_number и т.д.'''
    token = os.environ['ICQR_API_ADMIN_TOKEN']
    body = json.dumps({'Command': 'get_rating', 'Command_params': {'rating_id': rating_id}}).encode('utf-8')
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
    with urllib.request.urlopen(req, timeout=15) as resp:
        payload = json.loads(resp.read().decode('utf-8'))
    if payload.get('Request_status', {}).get('Code') != 'Ok':
        return None
    return payload.get('Data')


def to_float(v):
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None


def to_bool(v):
    if v is None:
        return None
    if isinstance(v, bool):
        return v
    try:
        return bool(int(v))
    except (TypeError, ValueError):
        return None


def haversine_m(lat1, lng1, lat2, lng2):
    '''Расстояние между двумя точками в метрах по формуле гаверсинуса.'''
    if None in (lat1, lng1, lat2, lng2):
        return None
    from math import radians, sin, cos, sqrt, atan2
    r = 6371000
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return r * 2 * atan2(sqrt(a), sqrt(1 - a))


def enrich_geo(cur, limit: int = 30):
    '''Дозагружает геоданные (координаты открытия формы и отправки оценки) для ещё не обогащённых записей.'''
    cur.execute(
        "SELECT id, icqr_id FROM transport_passenger_ratings WHERE geo_enriched_at IS NULL ORDER BY id DESC LIMIT %s",
        (limit,),
    )
    rows = cur.fetchall()
    enriched = 0
    for row_id, icqr_id in rows:
        try:
            details = fetch_rating_details(icqr_id)
        except (urllib.error.URLError, TimeoutError):
            continue
        if not details:
            continue

        page_lat = to_float(details.get('page_opened_lat'))
        page_lng = to_float(details.get('page_opened_lng'))
        submit_lat = to_float(details.get('submit_clicked_lat'))
        submit_lng = to_float(details.get('submit_clicked_lng'))
        movement_m = haversine_m(page_lat, page_lng, submit_lat, submit_lng)

        transport_opened_lat = to_float(details.get('transport_opened_lat'))
        transport_opened_lng = to_float(details.get('transport_opened_lng'))
        transport_submit_lat = to_float(details.get('transport_submit_lat'))
        transport_submit_lng = to_float(details.get('transport_submit_lng'))

        result_false = details.get('result_false')
        is_draft = result_false == 'inpad_success_without_rating'

        cur.execute(
            """
            UPDATE transport_passenger_ratings SET
                vehicle_number = %s,
                nearest_stop_distance_m = %s,
                distance_to_route_m = %s,
                page_opened_lat = %s,
                page_opened_lng = %s,
                page_opened_accuracy_m = %s,
                submit_lat = %s,
                submit_lng = %s,
                submit_accuracy_m = %s,
                movement_distance_m = %s,
                uuid = %s,
                result_false = %s,
                ip = %s,
                is_passenger = %s,
                operator_id = %s,
                operator_title = %s,
                transport_opened_lat = %s,
                transport_opened_lng = %s,
                transport_opened_dist = %s,
                transport_submit_lat = %s,
                transport_submit_lng = %s,
                transport_submit_dist = %s,
                possibly_not_passenger = %s,
                anti_fraud_reason = %s,
                rating_client_id = %s,
                location_id = %s,
                location_code = %s,
                is_draft = %s,
                geo_enriched_at = now()
            WHERE id = %s
            """,
            (
                details.get('vehicle_number'),
                details.get('nearest_stop_distance_m'),
                details.get('distance_to_route_m'),
                page_lat,
                page_lng,
                details.get('page_opened_accuracy_m'),
                submit_lat,
                submit_lng,
                details.get('submit_clicked_accuracy_m'),
                movement_m,
                details.get('uuid'),
                result_false,
                details.get('ip'),
                to_bool(details.get('is_passanger')),
                details.get('operator_id'),
                details.get('operator_title'),
                transport_opened_lat,
                transport_opened_lng,
                details.get('transport_opened_dist'),
                transport_submit_lat,
                transport_submit_lng,
                details.get('transport_submit_dist'),
                to_bool(details.get('possibly_not_passenger')),
                details.get('anti_fraud_reason'),
                details.get('rating_client_id'),
                details.get('location_id'),
                details.get('location_code'),
                is_draft,
                row_id,
            ),
        )
        enriched += 1
    return enriched


def log_sync_result(cur, status: str, synced_count: int, error_message: str = None):
    cur.execute(
        "INSERT INTO icqr_sync_log (status, synced_count, error_message) VALUES (%s, %s, %s)",
        (status, synced_count, error_message),
    )


def send_admin_email(subject: str, body: str) -> bool:
    '''Отправляет письмо администратору (ADMIN_ALERT_EMAIL) через SMTP, используя реквизиты из
    секретов SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS. Возвращает True при успехе, False при любой
    ошибке (сеть, авторизация, отсутствие секретов) — вызывающий код не должен падать из-за письма.'''
    host = os.environ.get('SMTP_HOST')
    port = os.environ.get('SMTP_PORT')
    user = os.environ.get('SMTP_USER')
    password = os.environ.get('SMTP_PASS')
    if not all((host, port, user, password)):
        return False
    try:
        msg = MIMEText(body, 'plain', 'utf-8')
        msg['Subject'] = subject
        msg['From'] = user
        msg['To'] = ADMIN_ALERT_EMAIL
        context = ssl.create_default_context()
        if int(port) == 465:
            with smtplib.SMTP_SSL(host, int(port), timeout=10, context=context) as server:
                server.login(user, password)
                server.sendmail(user, [ADMIN_ALERT_EMAIL], msg.as_string())
        else:
            with smtplib.SMTP(host, int(port), timeout=10) as server:
                server.starttls(context=context)
                server.login(user, password)
                server.sendmail(user, [ADMIN_ALERT_EMAIL], msg.as_string())
        return True
    except Exception:
        return False


def maybe_alert_routes_directory(cur, status: str, synced: int, total: int = None, error_message: str = None):
    '''Отправляет email администратору, если синхронизация справочника маршрутов провалилась
    (status='error') или завершилась неполной (status='incomplete', synced < total). Троттлится
    через app_settings.routes_alert_last_sent_at — не чаще раза в час, чтобы не заспамить админа
    при частых вызовах icqr-sync. При status='ok' (полная синхронизация) сбрасывает троттлинг,
    чтобы следующая проблема снова прислала письмо сразу.'''
    if status == 'ok':
        cur.execute("DELETE FROM app_settings WHERE key = 'routes_alert_last_sent_at'")
        return

    cur.execute("SELECT value FROM app_settings WHERE key = 'routes_alert_last_sent_at'")
    row = cur.fetchone()
    if row and row[0]:
        try:
            last_sent = datetime.fromisoformat(row[0])
            if (datetime.now() - last_sent).total_seconds() < ALERT_THROTTLE_SECONDS:
                return
        except ValueError:
            pass

    if status == 'error':
        subject = '[МЕТРОБУС] Синхронизация справочника маршрутов не удалась'
        body = (
            f"Синхронизация справочника маршрутов ICQR завершилась ошибкой.\n\n"
            f"Причина: {error_message or 'неизвестна'}\n"
            f"Время: {datetime.now().isoformat(timespec='seconds')}\n\n"
            f"Проверьте доступность ICQR Admin API и токен ICQR_API_ADMIN_TOKEN."
        )
    else:
        subject = '[МЕТРОБУС] Справочник маршрутов синхронизирован не полностью'
        body = (
            f"Справочник маршрутов ICQR синхронизирован не полностью.\n\n"
            f"Загружено: {synced} из {total}\n"
            f"Время: {datetime.now().isoformat(timespec='seconds')}\n\n"
            f"Часть маршрутов может отсутствовать в подсказках 'Мои маршруты' и в метрике 'Покрытие'.\n"
            f"Запустите повторную синхронизацию вручную из админ-консоли (кнопка 'Обновить маршруты')."
        )

    if send_admin_email(subject, body):
        cur.execute(
            """
            INSERT INTO app_settings (key, value, updated_at) VALUES ('routes_alert_last_sent_at', %s, now())
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
            """,
            (datetime.now().isoformat(),),
        )


def fetch_icqr_pending_count(date_from: str = None, date_to: str = None):
    '''Запрашивает у ICQR Admin API (list_ratings, moderation_status=pending) только количество отзывов
    в очереди на модерацию (per_page=1, читается только pagination.total) — без выгрузки самих записей.
    Если указаны date_from/date_to (даты в формате YYYY-MM-DD), считает только отзывы за этот период.
    Возвращает None при любой ошибке связи с ICQR Admin API.'''
    try:
        token = os.environ['ICQR_API_ADMIN_TOKEN']
        command_params = {'moderation_status': 'pending', 'page': 1, 'per_page': 1}
        if date_from:
            command_params['date_from'] = date_from
        if date_to:
            command_params['date_to'] = date_to
        body = json.dumps({'Command': 'list_ratings', 'Command_params': command_params}).encode('utf-8')
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
        with urllib.request.urlopen(req, timeout=10) as resp:
            payload = json.loads(resp.read().decode('utf-8'))
        if payload.get('Request_status', {}).get('Code') != 'Ok':
            return None
        return payload.get('Data', {}).get('pagination', {}).get('total')
    except Exception:
        return None


def maybe_send_moderation_digest(cur):
    '''Раз в сутки (не чаще) отправляет администратору (support@icqr.ru) email с коротким отчётом о том,
    что требует модерации: новые оценки, полученные за предыдущий календарный день по московскому времени
    (разбивка по видам транспорта), непроверенные вручную комментарии за этот день и общий остаток, а также
    размер очереди на модерацию ICQR (approve/reject). Запускается при обычном автоматическом триггере
    синхронизации (при заходе на сайт) — выделенного планировщика задач (cron) в проекте нет, поэтому проверка
    "наступил ли новый день" выполняется на каждом вызове, а фактическая отправка — не чаще одного раза за
    календарный день по МСК, отслеживается через app_settings.moderation_digest_sent_date. Если отправка письма
    не удалась (нет SMTP-секретов, сбой сети), дата не запоминается — попытка повторится при следующем визите
    в тот же день.'''
    moscow_now = datetime.utcnow() + timedelta(hours=MOSCOW_OFFSET_HOURS)
    today_msk = moscow_now.date()

    cur.execute("SELECT value FROM app_settings WHERE key = %s", (MODERATION_DIGEST_SENT_KEY,))
    row = cur.fetchone()
    if row and row[0] == today_msk.isoformat():
        return

    yesterday_msk = today_msk - timedelta(days=1)
    yesterday_start_utc = datetime(yesterday_msk.year, yesterday_msk.month, yesterday_msk.day) - timedelta(hours=MOSCOW_OFFSET_HOURS)
    today_start_utc = yesterday_start_utc + timedelta(days=1)

    cur.execute(
        """
        SELECT transport_type, COUNT(*), ROUND(AVG(rating)::numeric, 2)
        FROM transport_passenger_ratings
        WHERE synced_at >= %s AND synced_at < %s AND is_draft = false
        GROUP BY transport_type
        ORDER BY transport_type
        """,
        (yesterday_start_utc, today_start_utc),
    )
    by_type_rows = cur.fetchall()
    total_new = sum(r[1] for r in by_type_rows)

    cur.execute(
        """
        SELECT COUNT(*) FROM transport_passenger_ratings
        WHERE synced_at >= %s AND synced_at < %s AND is_draft = false
          AND comment IS NOT NULL AND comment != '' AND comment_verified = false
        """,
        (yesterday_start_utc, today_start_utc),
    )
    unverified_yesterday = cur.fetchone()[0]

    cur.execute(
        """
        SELECT COUNT(*) FROM transport_passenger_ratings
        WHERE is_draft = false AND comment IS NOT NULL AND comment != '' AND comment_verified = false
        """
    )
    unverified_total = cur.fetchone()[0]

    date_str = yesterday_msk.isoformat()
    pending_new = fetch_icqr_pending_count(date_str, date_str)
    pending_total = fetch_icqr_pending_count()

    day_label = yesterday_msk.strftime('%d.%m.%Y')
    lines = [
        f"Ежедневный отчёт по модерации отзывов — МЕТРОБУС.РФ",
        f"Отчётный день: {day_label}",
        "",
        "НОВЫЕ ОЦЕНКИ ЗА ДЕНЬ",
        f"Получено новых оценок: {total_new}",
    ]
    if by_type_rows:
        for transport_type, count, avg_rating in by_type_rows:
            label = TRANSPORT_LABELS.get(transport_type, transport_type or 'без типа')
            lines.append(f"  {label}: {count} (средний балл {avg_rating})")
    lines.append("")
    lines.append("ТРЕБУЕТ ВНИМАНИЯ МОДЕРАТОРА")
    lines.append(f"Непроверенные комментарии за день: {unverified_yesterday}")
    lines.append(f"Всего непроверенных комментариев (остаток): {unverified_total}")
    if pending_new is not None:
        lines.append(f"Новых отзывов в очереди ICQR за день: {pending_new}")
    if pending_total is not None:
        lines.append(f"Всего в очереди ICQR ожидает решения: {pending_total}")
    else:
        lines.append("Не удалось получить размер очереди ICQR (сбой ICQR Admin API)")
    lines.append("")
    lines.append(f"Перейти к модерации: {ADMIN_CONSOLE_URL}")
    lines.append("")
    lines.append("Письмо сформировано автоматически, отправляется не чаще раза в сутки.")
    body = "\n".join(lines)

    subject = f"[МЕТРОБУС] Отчёт по модерации за {day_label}"
    if send_admin_email(subject, body):
        cur.execute(
            """
            INSERT INTO app_settings (key, value, updated_at) VALUES (%s, %s, now())
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
            """,
            (MODERATION_DIGEST_SENT_KEY, today_msk.isoformat()),
        )


def check_routes_directory_health(cur, sync_failed: bool = False, error_message: str = None):
    '''Проверяет фактическое состояние справочника маршрутов после попытки синхронизации и при
    необходимости отправляет email-уведомление администратору (через maybe_alert_routes_directory).
    Сравнивает реальное кол-во синхронизированных маршрутов (transport_routes) с ожидаемым
    (app_settings.total_active_routes_count) — это покрывает не только явный сбой запроса к ICQR
    Admin API, но и случай, когда синхронизация была прервана таймаутом облачной функции
    посреди записи в БД (в этом случае total_active_routes_count ещё хранит старое полное число,
    а транзакция успела дописать только часть маршрутов).'''
    if sync_failed:
        maybe_alert_routes_directory(cur, 'error', 0, error_message=error_message)
        return

    cur.execute("SELECT COUNT(DISTINCT (route_number, transport_type)) FROM transport_routes")
    synced = int(cur.fetchone()[0])
    cur.execute("SELECT value FROM app_settings WHERE key = 'total_active_routes_count'")
    row = cur.fetchone()
    try:
        total = int(row[0]) if row and row[0] else None
    except (TypeError, ValueError):
        total = None

    if not total:
        return
    if synced < total:
        maybe_alert_routes_directory(cur, 'incomplete', synced, total)
    else:
        maybe_alert_routes_directory(cur, 'ok', synced, total)


def handler(event: dict, context) -> dict:
    '''Синхронизирует одобренные отзывы пассажиров с ICQR Public API в локальную таблицу transport_passenger_ratings,
    затем дозагружает геоданные (координаты открытия формы и отправки оценки, расстояние между ними) через ICQR Admin API.
    Не чаще раза в сутки также запускает постраничную пересинхронизацию справочника маршрутов ОРГП
    Санкт-Петербурга (таблица transport_routes) через ICQR Admin API (get_all_routes) — список не
    зависит от того, есть ли по маршруту одобренные отзывы, и используется для фильтра "Мои маршруты"
    на дашборде. Справочник (~624 маршрута на нескольких страницах по 200) синхронизируется НЕ за один
    вызов функции (что раньше упиралось в 5-секундный таймаут), а по ОДНОЙ странице за вызов —
    прогресс (локация, номер страницы) хранится в app_settings.routes_sync_progress и продолжается
    при каждом следующем обычном триггере синхронизации с фронтенда, пока весь справочник не будет
    загружен. По завершении цикла обновляется app_settings.total_active_routes_count (знаменатель
    метрики "покрытие маршрутов" на дашборде) и routes_last_full_sync_at.
    При GET с параметром status=1 возвращает статус последней синхронизации без запуска новой.
    При GET с параметром syncRoutes=1 запускает ТОЛЬКО принудительную пересинхронизацию справочника
    маршрутов, игнорируя суточное ограничение на СТАРТ нового цикла — используется кнопкой ручного
    запуска в админ-консоли; в пределах одного вызова догружает подряд столько страниц, сколько
    успевает за ~3.5 сек (с запасом на таймаут функции), и возвращает done=true, когда весь справочник
    полностью синхронизирован, иначе done=false — кнопку можно нажать повторно, чтобы продолжить.
    После каждого вызова (планового или ручного) фактическое состояние таблицы transport_routes
    сверяется с ожидаемым total_active_routes_count; если справочник не синхронизирован вовсе или
    синхронизирован не полностью — администратору (support@icqr.ru) отправляется email через SMTP
    (реквизиты в секретах SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS), не чаще раза в час на один и тот
    же тип проблемы.
    После успешной синхронизации также раз в сутки (по московскому времени) отправляет администратору
    (support@icqr.ru) короткий email-отчёт о том, что требует модерации: кол-во новых оценок за
    предыдущий день (разбивка по видам транспорта), непроверенные вручную комментарии за день и остаток,
    размер очереди ICQR на модерацию — см. maybe_send_moderation_digest. Отправка отслеживается через
    app_settings.moderation_digest_sent_date, фактическое время отправки зависит от того, когда на сайт
    заходит первый посетитель нового дня (выделенного планировщика задач в проекте нет).
    Args: event - dict с httpMethod, queryStringParameters (status, syncRoutes); context - объект с request_id.
    Returns: HTTP response с количеством загруженных/обновлённых отзывов, кол-вом обогащённых геоданными записей,
        и routesSync — результатом текущего шага синхронизации справочника маршрутов (dict с done/syncedTotal/
        page/totalPages, либо 'skipped', либо null при ошибке) или статусом последней синхронизации.
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

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor()

    params = event.get('queryStringParameters') or {}
    if method == 'GET' and params.get('status') == '1':
        try:
            cur.execute(
                "SELECT status, synced_count, error_message, created_at FROM icqr_sync_log ORDER BY created_at DESC LIMIT 1"
            )
            row = cur.fetchone()
            if not row:
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'status': None, 'syncedCount': 0, 'errorMessage': None, 'lastSyncAt': None}),
                }
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'status': row[0],
                    'syncedCount': row[1],
                    'errorMessage': row[2],
                    'lastSyncAt': row[3].isoformat() if row[3] else None,
                }),
            }
        finally:
            cur.close()
            conn.close()

    if method == 'GET' and params.get('syncRoutes') == '1':
        deadline = time.monotonic() + 3.5
        try:
            result = None
            done = False
            while time.monotonic() < deadline:
                result = sync_routes_page(cur, force=True)
                if result is None:
                    check_routes_directory_health(cur, sync_failed=True, error_message='Не удалось получить ответ от ICQR Admin API (get_all_routes)')
                    return {
                        'statusCode': 502,
                        'headers': headers,
                        'body': json.dumps({'error': 'icqr_routes_sync_failed'}),
                    }
                if result == 'skipped':
                    cur.execute("SELECT COUNT(DISTINCT (route_number, transport_type)) FROM transport_routes")
                    synced_total = int(cur.fetchone()[0])
                    check_routes_directory_health(cur)
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'done': True, 'skipped': True, 'directorySynced': synced_total}),
                    }
                if result['done']:
                    done = True
                    break
            check_routes_directory_health(cur, sync_failed=False)
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'done': done,
                    'directorySynced': result['syncedTotal'] if result else 0,
                    'page': result.get('page') if result else None,
                    'totalPages': result.get('totalPages') if result else None,
                }),
            }
        except Exception as e:
            check_routes_directory_health(cur, sync_failed=True, error_message=str(e))
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': 'internal_error', 'message': str(e)}),
            }
        finally:
            cur.close()
            conn.close()

    total_upserted = 0
    page = 1
    total_pages = 1

    try:
        while page <= total_pages:
            try:
                data = fetch_page(page)
            except (urllib.error.URLError, TimeoutError) as e:
                log_sync_result(cur, 'error', total_upserted, f'Ошибка соединения с ICQR API: {e}')
                return {
                    'statusCode': 502,
                    'headers': headers,
                    'body': json.dumps({'error': 'icqr_connection_error'}),
                }

            if data.get('Request_status', {}).get('Code') != 'Ok':
                message = data.get('Request_status', {}).get('Message', 'icqr_upstream_error')
                log_sync_result(cur, 'error', total_upserted, message)
                return {
                    'statusCode': 502,
                    'headers': headers,
                    'body': json.dumps({'error': 'icqr_upstream_error'}),
                }
            payload = data.get('Data', {})
            items = payload.get('items', [])
            pagination = payload.get('pagination', {})
            total_pages = pagination.get('total_pages', 1)

            for item in items:
                cur.execute(
                    """
                    INSERT INTO transport_passenger_ratings
                        (icqr_id, rating, comment, route_number, transport_type,
                         direction_name, nearest_stop_name, stop_to_name, rated_at, synced_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, now())
                    ON CONFLICT (icqr_id) DO UPDATE SET
                        rating = EXCLUDED.rating,
                        comment = EXCLUDED.comment,
                        route_number = EXCLUDED.route_number,
                        transport_type = EXCLUDED.transport_type,
                        direction_name = EXCLUDED.direction_name,
                        nearest_stop_name = EXCLUDED.nearest_stop_name,
                        stop_to_name = EXCLUDED.stop_to_name,
                        rated_at = EXCLUDED.rated_at,
                        synced_at = now()
                    """,
                    (
                        item['id'],
                        item['rating'],
                        item.get('comment'),
                        item.get('route_number'),
                        item.get('transport_type'),
                        item.get('direction_name'),
                        item.get('nearest_stop_name'),
                        item.get('stop_to_name'),
                        item['created_at'],
                    ),
                )
                total_upserted += 1

            page += 1

        geo_enriched = 0
        geo_error = None
        try:
            geo_enriched = enrich_geo(cur)
        except Exception as ge:
            geo_error = str(ge)

        try:
            routes_result = sync_routes_page(cur)
            check_routes_directory_health(cur, sync_failed=(routes_result is None))
        except Exception as re:
            routes_result = None
            check_routes_directory_health(cur, sync_failed=True, error_message=str(re))

        log_sync_result(cur, 'ok', total_upserted, geo_error)

        try:
            maybe_send_moderation_digest(cur)
        except Exception:
            pass

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'synced': total_upserted,
                'geoEnriched': geo_enriched,
                'routesSync': routes_result if isinstance(routes_result, dict) else routes_result,
            }),
        }
    except Exception as e:
        log_sync_result(cur, 'error', total_upserted, str(e))
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'internal_error'}),
        }
    finally:
        cur.close()
        conn.close()