import func2url from '../../backend/func2url.json';
import type { TransportType } from '@/lib/mockData';

export interface DashboardSummary {
  average: number;
  prevAverage: number;
  monthCount: number;
  byType: { type: TransportType; label: string; average: number; count: number }[];
}

export interface TimelinePoint {
  day: number;
  value: number;
  count: number;
}

export interface Cluster {
  key: string;
  label: string;
  icon: string;
  share: number;
  positive: boolean;
  examples: string[];
}

export interface DashboardData {
  summary: DashboardSummary;
  timeline: TimelinePoint[];
  month: string;
  clusters: Cluster[];
}

export async function fetchDashboardStats(monthOffset: number): Promise<DashboardData> {
  const url = `${func2url['dashboard-stats']}?monthOffset=${monthOffset}`;
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
