const TOKEN_KEY = 'mb_my_ratings_token';
const URL_PARAM = 'my_token';
const HASH_PARAM = 'client_id';
const DASHBOARD_HASH = 'dashboard';
// Дополнительные имена параметра, которыми ICQR.RU может передать идентификатор пользователя
// в обычной query-строке (не в hash) — например ?rating_client_id=... с кнопки "Дашборд".
const EXTRA_QUERY_PARAMS = ['rating_client_id', 'client_id'];

export interface CaptureTokenResult {
  /** Нужно проскроллить к секции #dashboard (переход по ссылке вида #dashboard?client_id=...) */
  scrollToDashboard: boolean;
  /** В этой ссылке найден идентификатор пользователя ICQR.RU (my_token или client_id) */
  tokenCaptured: boolean;
}

/**
 * Разбирает идентификатор пользователя ICQR.RU из ссылки и сохраняет его в localStorage.
 * Поддерживает несколько форматов:
 *  - обычный query-параметр: ?my_token=...
 *  - query-параметры, которыми реально передаёт кнопка "Дашборд" на ICQR.RU: ?rating_client_id=... или ?client_id=...
 *  - ссылка с параметром внутри hash-фрагмента: #dashboard?client_id=...
 * После разбора очищает найденные параметры из адресной строки (оставляя якорь #dashboard, если он был).
 */
export function captureMyRatingsTokenFromUrl(): CaptureTokenResult {
  let scrollToDashboard = false;
  let tokenCaptured = false;
  try {
    const url = new URL(window.location.href);

    const queryToken = url.searchParams.get(URL_PARAM);
    if (queryToken) {
      localStorage.setItem(TOKEN_KEY, queryToken);
      tokenCaptured = true;
      url.searchParams.delete(URL_PARAM);
    } else {
      for (const paramName of EXTRA_QUERY_PARAMS) {
        const extraToken = url.searchParams.get(paramName);
        if (extraToken) {
          localStorage.setItem(TOKEN_KEY, extraToken);
          tokenCaptured = true;
          url.searchParams.delete(paramName);
          break;
        }
      }
    }

    const rawHash = url.hash.replace(/^#/, '');
    const [hashAnchor, hashQuery] = rawHash.split('?');
    if (hashQuery) {
      const hashParams = new URLSearchParams(hashQuery);
      const clientId = hashParams.get(HASH_PARAM) || hashParams.get(URL_PARAM);
      if (clientId) {
        localStorage.setItem(TOKEN_KEY, clientId);
        tokenCaptured = true;
      }
    }
    if (hashAnchor === DASHBOARD_HASH) {
      scrollToDashboard = true;
      url.hash = `#${DASHBOARD_HASH}`;
    }

    window.history.replaceState({}, '', url.toString());
  } catch {
    // no-op: недоступен localStorage/URL API
  }
  return { scrollToDashboard, tokenCaptured };
}

export function getMyRatingsToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Формирует персональную ссылку на дашборд "Мои оценки" с токеном пользователя.
 * Открыв её в любом браузере (например на компьютере), пользователь сразу увидит свои оценки —
 * токен подхватывается функцией captureMyRatingsTokenFromUrl(). Использует параметр
 * rating_client_id — тот же формат, которым реально делится кнопка "Дашборд" на ICQR.RU.
 */
export function buildMyRatingsShareUrl(token: string): string {
  const url = new URL(window.location.origin + '/');
  url.searchParams.set(EXTRA_QUERY_PARAMS[0], token);
  url.hash = DASHBOARD_HASH;
  return url.toString();
}