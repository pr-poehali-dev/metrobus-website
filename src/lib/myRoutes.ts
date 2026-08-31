const MY_ROUTES_KEY = 'mb_my_routes';

/**
 * Список номеров маршрутов, которые пользователь выбрал как "свои" — сохраняется в localStorage
 * и используется для фильтрации дашборда по конкретным маршрутам без учёта города в целом.
 */
export function getMyRoutes(): string[] {
  try {
    const raw = localStorage.getItem(MY_ROUTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((r) => typeof r === 'string') : [];
  } catch {
    return [];
  }
}

export function setMyRoutes(routes: string[]): void {
  try {
    localStorage.setItem(MY_ROUTES_KEY, JSON.stringify(routes));
  } catch {
    // no-op: недоступен localStorage
  }
}
