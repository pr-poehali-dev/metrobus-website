import { TransportType } from '@/lib/mockData';
import { DashboardRecord } from '@/lib/dashboardApi';

export const STATUS_LABELS: Record<DashboardRecord['status'], { text: string; className: string }> = {
  published: { text: 'Опубликовано', className: 'bg-transport-tram/10 text-transport-tram' },
  draft: { text: 'Черновик', className: 'bg-secondary text-muted-foreground' },
};

export function formatRecordDate(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function formatSyncDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export const transportClass: Record<TransportType, string> = {
  bus: 'text-transport-bus',
  tram: 'text-transport-tram',
  trolley: 'text-transport-trolley',
};
export const transportBg: Record<TransportType, string> = {
  bus: 'bg-transport-bus/10',
  tram: 'bg-transport-tram/10',
  trolley: 'bg-transport-trolley/10',
};
export const transportImg: Record<TransportType, string> = {
  bus: '/icons/bus-transport.png',
  tram: '/icons/tram-transport.png',
  trolley: '/icons/trolley-transport.png',
};
