import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { fetchIcqrSyncStatus, IcqrSyncStatus as IcqrSyncStatusType } from '@/lib/dashboardApi';

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function IcqrSyncStatus() {
  const [data, setData] = useState<IcqrSyncStatusType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIcqrSyncStatus().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon name="Loader2" size={13} className="animate-spin" />
        Проверка синхронизации…
      </span>
    );
  }

  if (!data || data.status === null) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon name="CircleDashed" size={13} />
        Синхронизация ICQR ещё не запускалась
      </span>
    );
  }

  if (data.status === 'error') {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs text-destructive"
        title={data.errorMessage ?? undefined}
      >
        <Icon name="CircleAlert" size={13} />
        Синхронизация ICQR: ошибка ({formatDate(data.lastSyncAt)})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon name="CircleCheck" size={13} className="text-transport-tram" />
      Синхронизация ICQR: {formatDate(data.lastSyncAt)} · {data.syncedCount} отзывов
    </span>
  );
}
