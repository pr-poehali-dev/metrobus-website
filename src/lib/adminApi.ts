import func2url from '../../backend/func2url.json';

const TOKEN_KEY = 'mb_admin_token';

export function getAdminToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function loginWithPin(pin: string): Promise<boolean> {
  const res = await fetch(func2url['admin-auth'], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  if (data.token) {
    setAdminToken(data.token);
    return true;
  }
  return false;
}

export async function verifySession(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;
  const res = await fetch(func2url['admin-auth'], {
    headers: { 'X-Admin-Token': token },
  });
  return res.ok;
}

export interface AdminReviewItem {
  id: number;
  icqrId: number;
  rating: number;
  comment: string | null;
  routeNumber: string | null;
  transportType: string | null;
  directionName: string | null;
  nearestStopName: string | null;
  stopToName: string | null;
  ratedAt: string | null;
  syncedAt: string | null;
  sentiment: 'positive' | 'negative' | 'neutral' | 'anomaly';
  isAnomaly: boolean;
}

export interface AdminReviewsResponse {
  items: AdminReviewItem[];
  total: number;
  anomalyTotal: number;
  page: number;
  perPage: number;
}

export interface AdminReviewsQuery {
  search?: string;
  transportType?: string;
  ratingMin?: string;
  ratingMax?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
  page?: number;
  perPage?: number;
}

export async function fetchAdminReviews(query: AdminReviewsQuery): Promise<AdminReviewsResponse | null> {
  const token = getAdminToken();
  if (!token) return null;

  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.transportType) params.set('transport_type', query.transportType);
  if (query.ratingMin) params.set('rating_min', query.ratingMin);
  if (query.ratingMax) params.set('rating_max', query.ratingMax);
  if (query.dateFrom) params.set('date_from', query.dateFrom);
  if (query.dateTo) params.set('date_to', query.dateTo);
  if (query.sort) params.set('sort', query.sort);
  if (query.order) params.set('order', query.order);
  params.set('page', String(query.page ?? 1));
  params.set('per_page', String(query.perPage ?? 50));

  const res = await fetch(`${func2url['admin-reviews']}?${params.toString()}`, {
    headers: { 'X-Admin-Token': token },
  });

  if (res.status === 401) {
    clearAdminToken();
    return null;
  }
  if (!res.ok) throw new Error('admin_reviews_failed');
  return res.json();
}
