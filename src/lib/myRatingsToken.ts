const TOKEN_KEY = 'mb_my_ratings_token';
const URL_PARAM = 'my_token';

export function captureMyRatingsTokenFromUrl(): void {
  try {
    const url = new URL(window.location.href);
    const token = url.searchParams.get(URL_PARAM);
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      url.searchParams.delete(URL_PARAM);
      window.history.replaceState({}, '', url.toString());
    }
  } catch {
    // no-op: недоступен localStorage/URL API
  }
}

export function getMyRatingsToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
