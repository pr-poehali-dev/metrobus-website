import func2url from '../../backend/func2url.json';
import type { TransportType } from '@/lib/mockData';

export interface DashboardSummary {
  average: number;
  prevAverage: number;
  monthCount: number;
  routesCount: number;
  byType: { type: TransportType; label: string; average: number; count: number }[];
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

export type DashboardViewMode = 'passengers' | 'observers';

export interface DashboardData {
  summary: DashboardSummary;
  timeline: TimelinePoint[];
  month: string;
  clusters: Cluster[];
  viewMode: DashboardViewMode;
}

export async function fetchDashboardStats(monthOffset: number, viewMode: DashboardViewMode = 'passengers'): Promise<DashboardData> {
  const url = `${func2url['dashboard-stats']}?monthOffset=${monthOffset}&viewMode=${viewMode}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('dashboard_stats_failed');
  return res.json();
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