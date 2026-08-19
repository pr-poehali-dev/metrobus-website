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
  vehicleNumber: number | null;
  nearestStopDistanceM: number | null;
  distanceToRouteM: number | null;
  pageOpenedLat: number | null;
  pageOpenedLng: number | null;
  submitLat: number | null;
  submitLng: number | null;
  movementDistanceM: number | null;
  uuid: string | null;
  resultFalse: string | null;
  ip: string | null;
  isPassenger: boolean | null;
  operatorId: number | null;
  operatorTitle: string | null;
  transportOpenedLat: number | null;
  transportOpenedLng: number | null;
  transportOpenedDist: number | null;
  transportSubmitLat: number | null;
  transportSubmitLng: number | null;
  transportSubmitDist: number | null;
  trustLevel: 'high' | 'medium' | 'low';
  trustFlags: string[];
  isObserver: boolean;
  notCountedReason: string | null;
  possiblyNotPassenger: boolean | null;
  antiFraudReason: string | null;
  locationCode: string | null;
  commentVerified: boolean;
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
  role?: 'passenger' | 'observer';
  ratingMin?: string;
  ratingMax?: string;
  dateFrom?: string;
  dateTo?: string;
  commentStatus?: 'verified' | 'unverified';
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
  if (query.role) params.set('role', query.role);
  if (query.ratingMin) params.set('rating_min', query.ratingMin);
  if (query.ratingMax) params.set('rating_max', query.ratingMax);
  if (query.dateFrom) params.set('date_from', query.dateFrom);
  if (query.dateTo) params.set('date_to', query.dateTo);
  if (query.commentStatus) params.set('comment_status', query.commentStatus);
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

export async function setCommentVerified(id: number, verified: boolean): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;

  const res = await fetch(func2url['admin-reviews'], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify({ id, verified }),
  });

  if (res.status === 401) {
    clearAdminToken();
    return false;
  }
  return res.ok;
}

export interface ModerationListItem {
  id: number;
  created_at: string;
  rating: number;
  comment: string | null;
  moderation_status: 'pending' | 'approved' | 'rejected';
  moderation_passed: boolean | null;
  route_number: string | null;
  vehicle_number: string | null;
  transport_type: string | null;
  direction: string | null;
  nearest_stop_name: string | null;
  stop_to_name: string | null;
  result_false: string | null;
  is_passanger?: boolean | number | null;
  transport_opened_dist?: number | null;
  transport_submit_dist?: number | null;
  possibly_not_passenger?: boolean | number | null;
  anti_fraud_reason?: string | null;
}

export interface ModerationPagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ModerationListResponse {
  items: ModerationListItem[];
  pagination: ModerationPagination;
}

export interface ModerationListQuery {
  status?: 'pending' | 'approved' | 'rejected' | 'all';
  routeNumber?: string;
  dateFrom?: string;
  dateTo?: string;
  hasComment?: boolean;
  page?: number;
  perPage?: number;
}

export type ModerationApiError = { error: string; message?: string };

export async function fetchModerationList(query: ModerationListQuery): Promise<ModerationListResponse | ModerationApiError | null> {
  const token = getAdminToken();
  if (!token) return null;

  const params = new URLSearchParams();
  params.set('status', query.status ?? 'pending');
  if (query.routeNumber) params.set('route_number', query.routeNumber);
  if (query.dateFrom) params.set('date_from', query.dateFrom);
  if (query.dateTo) params.set('date_to', query.dateTo);
  if (query.hasComment !== undefined) params.set('has_comment', String(query.hasComment));
  params.set('page', String(query.page ?? 1));
  params.set('per_page', String(query.perPage ?? 20));

  const res = await fetch(`${func2url['icqr-moderation']}?${params.toString()}`, {
    headers: { 'X-Admin-Token': token },
  });

  if (res.status === 401) {
    clearAdminToken();
    return null;
  }
  return res.json();
}

export async function fetchModerationItem(ratingId: number): Promise<{ item: Record<string, unknown> } | ModerationApiError | null> {
  const token = getAdminToken();
  if (!token) return null;

  const params = new URLSearchParams({ action: 'get', rating_id: String(ratingId) });
  const res = await fetch(`${func2url['icqr-moderation']}?${params.toString()}`, {
    headers: { 'X-Admin-Token': token },
  });

  if (res.status === 401) {
    clearAdminToken();
    return null;
  }
  return res.json();
}

export interface SalesSummary {
  revenue: number;
  commission: number;
  ticketsCount: number;
  avgTicket: number;
  refundsCount: number;
  refundsSum: number;
}

export interface SalesTimelinePoint {
  day: string;
  revenue: number;
  count: number;
}

export interface SalesByRoute {
  routeNumber: string;
  revenue: number;
  count: number;
}

export interface SalesByCarrier {
  carrierName: string;
  revenue: number;
  commission: number;
  count: number;
}

export interface SalesByPaymentStatus {
  status: string;
  count: number;
}

export interface SalesPromocode {
  promokod: string;
  count: number;
  revenue: number;
}

export interface SalesStatsResponse {
  summary: SalesSummary;
  timeline: SalesTimelinePoint[];
  byRoute: SalesByRoute[];
  byCarrier: SalesByCarrier[];
  byPaymentStatus: SalesByPaymentStatus[];
  topPromocodes: SalesPromocode[];
}

export async function fetchSalesStats(dateFrom?: string, dateTo?: string): Promise<SalesStatsResponse | null> {
  const token = getAdminToken();
  if (!token) return null;

  const params = new URLSearchParams();
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);

  const res = await fetch(`${func2url['sales-stats']}?${params.toString()}`, {
    headers: { 'X-Admin-Token': token },
  });

  if (res.status === 401) {
    clearAdminToken();
    return null;
  }
  if (!res.ok) throw new Error('sales_stats_failed');
  return res.json();
}

export async function moderateRating(
  ratingId: number,
  action: 'approve' | 'reject' | 'reset',
  moderationNote?: string,
): Promise<{ item: Record<string, unknown> } | ModerationApiError | null> {
  const token = getAdminToken();
  if (!token) return null;

  const res = await fetch(func2url['icqr-moderation'], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
    body: JSON.stringify({
      rating_id: ratingId,
      action,
      moderation_note: moderationNote,
      moderator_id: 'mb-console',
    }),
  });

  if (res.status === 401) {
    clearAdminToken();
    return null;
  }
  return res.json();
}