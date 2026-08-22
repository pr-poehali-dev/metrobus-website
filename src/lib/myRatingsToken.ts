const TOKEN_KEY = 'mb_my_ratings_token';
const URL_PARAM = 'my_token';
const HASH_PARAM = 'client_id';
const DASHBOARD_HASH = 'dashboard';

export interface CaptureTokenResult {
  /** Нужно проскроллить к секции #dashboard (переход по ссылке вида #dashboard?client_id=...) */
  scrollToDashboard: boolean;
  /** В этой ссылке найден идентификатор пользователя ICQR.RU (my_token или client_id) */
  tokenCaptured: boolean;
}

/**
 * Разбирает идентификатор пользователя ICQR.RU из ссылки и сохраняет его в localStorage.
 * Поддерживает два формата:
 *  - обычный query-параметр: ?my_token=...
 *  - ссылка из интерфейса ICQR.RU с параметром внутри hash-фрагмента: #dashboard?client_id=...
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