import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { fetchIcqrSyncStatus, triggerRoutesSync, IcqrSyncStatus as IcqrSyncStatusType } from '@/lib/dashboardApi';

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function IcqrSyncStatus() {
  const [data, setData] = useState<IcqrSyncStatusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingRoutes, setSyncingRoutes] = useState(false);
  const [routesResult, setRoutesResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetchIcqrSyncStatus().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  const handleSyncRoutes = async () => {
    setSyncingRoutes(true);
    setRoutesResult(null);
    let steps = 0;
    let last = null as Awaited<ReturnType<typeof triggerRoutesSync>>;
    while (steps < 20) {
      steps += 1;
      last = await triggerRoutesSync();
      if (!last || last.done) break;
      setRoutesResult({
        ok: true,
        text: `Синхронизация… страница ${last.page ?? '?'} из ${last.totalPages ?? '?'} (${last.directorySynced})`,
      });
    }
    setSyncingRoutes(false);
    if (last) {
      setRoutesResult({ ok: true, text: `Готово: ${last.directorySynced} маршрутов` });
    } else {
      setRoutesResult({ ok: false, text: 'Не удалось синхронизировать' });
    }
  };

  const routesSyncButton = (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSyncRoutes}
      disabled={syncingRoutes}
      className="h-7 gap-1.5 px-2 text-xs"
      title="Принудительно пересинхронизировать справочник маршрутов из ICQR"
    >
      <Icon name={syncingRoutes ? 'Loader2' : 'RefreshCw'} size={12} className={syncingRoutes ? 'animate-spin' : ''} />
      {syncingRoutes ? 'Синхронизация…' : 'Обновить маршруты'}
    </Button>
  );

  const resultBadge = routesResult && (
    <span className={`inline-flex items-center gap-1 text-xs ${routesResult.ok ? 'text-transport-tram' : 'text-destructive'}`}>
      <Icon name={routesResult.ok ? 'CircleCheck' : 'CircleAlert'} size={12} />
      {routesResult.text}
    </span>
  );

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
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon name="CircleDashed" size={13} />
          Синхронизация ICQR ещё не запускалась
        </span>
        {routesSyncButton}
        {resultBadge}
      </div>
    );
  }

  if (data.status === 'error') {
    return (
      <div className="flex items-center gap-3">
        <span
          className="inline-flex items-center gap-1.5 text-xs text-destructive"
          title={data.errorMessage ?? undefined}
        >
          <Icon name="CircleAlert" size={13} />
          Синхронизация ICQR: ошибка ({formatDate(data.lastSyncAt)})
        </span>
        {routesSyncButton}
        {resultBadge}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon name="CircleCheck" size={13} className="text-transport-tram" />
        Синхронизация ICQR: {formatDate(data.lastSyncAt)} · {data.syncedCount} отзывов
      </span>
      {routesSyncButton}
      {resultBadge}
    </div>
  );
}