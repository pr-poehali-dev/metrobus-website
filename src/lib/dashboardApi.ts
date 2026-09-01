import func2url from '../../backend/func2url.json';
import type { TransportType } from '@/lib/mockData';

export interface RoutesDirectoryStatus {
  synced: number;
  total: number | null;
  incomplete: boolean;
}

export interface RatingsSyncStatus {
  status: 'ok' | 'error' | null;
  errorMessage: string | null;
  lastSyncAt: string | null;
}

export interface DashboardSummary {
  average: number;
  prevAverage: number;
  monthCount: number;
  routesCount: number;
  byType: { type: TransportType; label: string; average: number; count: number }[];
  routesDirectory?: RoutesDirectoryStatus;
  ratingsSync?: RatingsSyncStatus;
}

export interface DashboardMetric {
  value: number;
  label: string;
  total?: number;
}

export interface DashboardRecord {
  id: number;
  routeNumber: string | null;
  transportType: TransportType;
  vehicleNumber: number | null;
  rating: number;
  comment: string | null;
  status: 'draft' | 'published';
  ratedAt: string | null;
}

export interface TimelinePoint {
  day: number;
  bus: number | null;
  tram: number | null;
  trolley: number | null;
  busCount: number;
  tramCount: number;
  trolleyCount: number;
}

export interface Cluster {
  key: string;
  label: string;
  icon: string;
  share: number;
  positive: boolean;
  examples: string[];
}

export interface TopActiveUser {
  rank: number;
  label: string;
  count: number;
  isMe: boolean;
}

export interface MyRank {
  rank: number;
  count: number;
  totalUsers: number;
}

export type DashboardViewMode = 'passengers' | 'observers';
export type DashboardDataScope = 'mine' | 'all';

export interface DashboardData {
  summary: DashboardSummary;
  timeline: TimelinePoint[];
  month: string;
  clusters: Cluster[];
  viewMode: DashboardViewMode;
  dataScope: DashboardDataScope;
  metric1: DashboardMetric;
  metric2: DashboardMetric;
  metric3: DashboardMetric | null;
  records: DashboardRecord[];
  topActiveUsers: TopActiveUser[];
  myRank: MyRank | null;
}

export async function fetchDashboardStats(
  monthOffset: number,
  viewMode: DashboardViewMode = 'passengers',
  dataScope: DashboardDataScope = 'all',
  myToken?: string | null,
  myRoutes?: string[] | null,
): Promise<DashboardData> {
  const params = new URLSearchParams({ monthOffset: String(monthOffset), viewMode, dataScope });
  if (dataScope === 'mine' && myToken) {
    params.set('myToken', myToken);
  }
  if (myRoutes && myRoutes.length > 0) {
    params.set('routes', myRoutes.join(','));
  }
  const url = `${func2url['dashboard-stats']}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('dashboard_stats_failed');
  return res.json();
}

export interface RouteInfo {
  number: string;
  types: TransportType[];
}

export async function fetchRoutesList(): Promise<RouteInfo[]> {
  try {
    const res = await fetch(func2url['routes-list']);
    if (!res.ok) return [];
    const data = await res.json();
    return data.routes ?? [];
  } catch {
    return [];
  }
}

export async function triggerIcqrSync(): Promise<void> {
  try {
    await fetch(func2url['icqr-sync']);
  } catch {
    // best-effort, ошибки синхронизации не должны ломать отображение дашборда
  }
}

export interface IcqrSyncStatus {
  status: 'ok' | 'error' | null;
  syncedCount: number;
  errorMessage: string | null;
  lastSyncAt: string | null;
}

export async function fetchIcqrSyncStatus(): Promise<IcqrSyncStatus | null> {
  try {
    const res = await fetch(`${func2url['icqr-sync']}?status=1`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export interface RoutesSyncResult {
  done: boolean;
  skipped?: boolean;
  directorySynced: number;
  page?: number | null;
  totalPages?: number | null;
}

export async function triggerRoutesSync(): Promise<RoutesSyncResult | null> {
  try {
    const res = await fetch(`${func2url['icqr-sync']}?syncRoutes=1`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export interface CityGeo {
  city: string | null;
  region: string | null;
}

export async function fetchCityByIp(): Promise<CityGeo | null> {
  try {
    const res = await fetch(func2url['city-vote']);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function submitCityVote(city: string, region?: string): Promise<{ success: boolean; votes: number } | null> {
  try {
    const res = await fetch(func2url['city-vote'], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, region }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}