import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { fetchQualityReport, QualityReport, QualityRow } from '@/lib/adminApi';

const DEFAULT_FROM = '';

const REASON_LABELS: Record<string, string> = {
  too_far_from_route: 'Далеко от маршрута',
  vehicle_not_active: 'Номер ТС не активен',
  vehicle_not_found: 'Номер ТС не найден',
  already_rated_today: 'Уже оценивал сегодня',
  no_geolocation: 'Нет геопозиции',
  inpad_success_without_rating: 'Черновик без оценки',
};

const BUCKETS: { key: string; label: string }[] = [
  { key: 'near', label: 'До 300 м (рядом)' },
  { key: 'm300_1k', label: '300 м – 1 км' },
  { key: 'k1_5', label: '1 – 5 км' },
  { key: 'k5_20', label: '5 – 20 км' },
  { key: 'k20_plus', label: 'Более 20 км' },
  { key: 'unknown', label: 'Не рассчитано' },
];

const GEO_LABEL: Record<QualityRow['geo'], string> = {
  full: 'Есть',
  partial: 'Частично',
  none: 'Нет',
};

function pct(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}

function formatDist(m: number | null) {
  if (m === null || m === undefined) return '—';
  return m >= 1000 ? `${(m / 1000).toFixed(1)} км` : `${Math.round(m)} м`;
}

function StatCard({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: 'bad' | 'good' }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-mono-num text-2xl font-bold ${tone === 'bad' ? 'text-destructive' : tone === 'good' ? 'text-transport-tram' : ''}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Bar({ label, value, total, tone }: { label: string; value: number; total: number; tone?: 'bad' }) {
  const p = pct(value, total);
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-mono-num text-muted-foreground">{value} · {p}%</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-secondary">
        <div className={`h-2 rounded-full ${tone === 'bad' ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

export default function AttemptsQuality({ dateFrom, dateTo }: { dateFrom?: string; dateTo?: string }) {
  const [report, setReport] = useState<QualityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [onlyRejected, setOnlyRejected] = useState(false);

  const from = dateFrom || DEFAULT_FROM;

  const load = useCallback(() => {
    setLoading(true);
    fetchQualityReport(from || undefined, dateTo || undefined)
      .then(setReport)
      .finally(() => setLoading(false));
  }, [from, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!report || loading || !report.truncated) return;
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [report, loading, load]);

  if (loading && !report) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
        <Icon name="Loader2" size={16} className="animate-spin" />
        Собираю данные из ICQR — запрашиваю каждую попытку отдельно, это может занять несколько секунд…
      </div>
    );
  }

  if (!report) return <p className="py-12 text-sm text-muted-foreground">Не удалось получить данные.</p>;
  if (report.error) return <p className="py-12 text-sm text-destructive">Ошибка ICQR: {report.error}</p>;

  const r = report;
  const rows = onlyRejected ? r.rows.filter((x) => x.result_false) : r.rows;
  const farRejected = (r.rejectedDistanceBuckets.k1_5 ?? 0) + (r.rejectedDistanceBuckets.k5_20 ?? 0) + (r.rejectedDistanceBuckets.k20_plus ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Качество попыток оценки</h2>
          <p className="text-sm text-muted-foreground">
            Все попытки из ICQR {from ? `с ${from}` : 'за всё время'}{dateTo ? ` по ${dateTo}` : ''}, включая отклонённые системой.
            {r.truncated && ` Догружаю подробности из ICQR: разобрано ${r.analyzed} из ${r.total}…`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
          <Icon name={loading ? 'Loader2' : 'RefreshCw'} size={14} className={loading ? 'animate-spin' : ''} />
          Обновить
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Всего попыток" value={r.total} hint={`${r.uniqueClients} уник. устройств · ${r.uniqueVehicles} ТС`} />
        <StatCard label="Принято" value={r.accepted} hint={`${pct(r.accepted, r.analyzed)}% попыток`} tone="good" />
        <StatCard label="Отклонено системой" value={r.rejected} hint={`${pct(r.rejected, r.analyzed)}% попыток`} tone={r.rejected ? 'bad' : undefined} />
        <StatCard
          label="Без доступа к геопозиции"
          value={r.noGeo}
          hint={`${pct(r.noGeo, r.analyzed)}% попыток · из них отклонено ${r.noGeoRejected}`}
          tone={r.noGeo ? 'bad' : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-5">
          <h3 className="font-semibold">Где находился человек относительно маршрута</h3>
          <p className="mt-1 text-xs text-muted-foreground">По геопозиции в момент оценки. Порог системы — 300 м.</p>
          <div className="mt-4 space-y-3">
            {BUCKETS.map((b) => (
              <Bar key={b.key} label={b.label} value={r.distanceBuckets[b.key] ?? 0} total={r.analyzed} tone={b.key !== 'near' && b.key !== 'unknown' ? 'bad' : undefined} />
            ))}
          </div>
          {farRejected > 0 && (
            <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm">
              {farRejected} отклонённых попыток сделаны дальше 1 км от маршрута — человек явно не был в этом транспорте или рядом с ним.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border p-5">
          <h3 className="font-semibold">Причины отклонения</h3>
          <div className="mt-4 space-y-3">
            {Object.keys(r.reasons).length === 0 && <p className="text-sm text-muted-foreground">Отклонённых попыток нет.</p>}
            {Object.entries(r.reasons).map(([k, v]) => (
              <Bar key={k} label={REASON_LABELS[k] ?? k} value={v} total={r.rejected} tone="bad" />
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Пассажир / наблюдатель</p>
              <p className="mt-1 font-mono-num font-semibold">{r.passengers} / {r.observers}</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Неточная геопозиция (&gt;100 м)</p>
              <p className="mt-1 font-mono-num font-semibold">{r.poorAccuracy}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-5">
          <h3 className="font-semibold">Номера ТС: признаки случайного ввода</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Один и тот же бортовой номер на разных маршрутах или у многих устройств — похоже на подбор номера, а не на реальную поездку.
          </p>
          {r.suspiciousVehicles.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Подозрительных номеров не найдено.</p>
          ) : (
            <Table className="mt-3">
              <TableHeader>
                <TableRow>
                  <TableHead>Номер ТС</TableHead>
                  <TableHead>Попыток</TableHead>
                  <TableHead>Отклонено</TableHead>
                  <TableHead>Устройств</TableHead>
                  <TableHead>Маршруты</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.suspiciousVehicles.map((v) => (
                  <TableRow key={v.vehicle}>
                    <TableCell className="font-mono-num font-semibold">{v.vehicle}</TableCell>
                    <TableCell>{v.attempts}</TableCell>
                    <TableCell>{v.rejected}</TableCell>
                    <TableCell>{v.clients}</TableCell>
                    <TableCell className="text-xs">{v.routes.join(', ')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-xl border border-border p-5">
          <h3 className="font-semibold">Самые активные устройства</h3>
          <p className="mt-1 text-xs text-muted-foreground">Много отклонённых попыток с одного устройства — признак тестирования «с дивана».</p>
          <Table className="mt-3">
            <TableHeader>
              <TableRow>
                <TableHead>Устройство</TableHead>
                <TableHead>Попыток</TableHead>
                <TableHead>Отклонено</TableHead>
                <TableHead>Без гео</TableHead>
                <TableHead>Маршруты</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.topClients.map((c) => (
                <TableRow key={c.client}>
                  <TableCell className="font-mono-num text-xs">{c.client}</TableCell>
                  <TableCell>{c.attempts}</TableCell>
                  <TableCell className={c.rejected ? 'text-destructive' : ''}>{c.rejected}</TableCell>
                  <TableCell>{c.noGeo}</TableCell>
                  <TableCell className="text-xs">{c.routes.join(', ')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="rounded-xl border border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Все попытки</h3>
          <Button variant={onlyRejected ? 'default' : 'outline'} size="sm" onClick={() => setOnlyRejected((v) => !v)} className="gap-1.5">
            <Icon name="Filter" size={14} />
            Только отклонённые
          </Button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Маршрут</TableHead>
                <TableHead>ТС</TableHead>
                <TableHead>Оценка</TableHead>
                <TableHead>Геопозиция</TableHead>
                <TableHead>До маршрута</TableHead>
                <TableHead>Точность</TableHead>
                <TableHead>Устройство</TableHead>
                <TableHead>Результат</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((x) => {
                const acc = x.submit_clicked_accuracy_m ?? x.page_opened_accuracy_m;
                return (
                  <TableRow key={x.id}>
                    <TableCell className="font-mono-num text-xs">{x.id}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{x.created_at?.slice(0, 16) ?? '—'}</TableCell>
                    <TableCell>{x.route_number ?? '—'}</TableCell>
                    <TableCell className="font-mono-num">{x.vehicle_number ?? '—'}</TableCell>
                    <TableCell>{x.rating ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={x.geo === 'none' ? 'destructive' : x.geo === 'partial' ? 'secondary' : 'outline'}>{GEO_LABEL[x.geo]}</Badge>
                    </TableCell>
                    <TableCell className={(x.distance_to_route_m ?? 0) > 300 ? 'font-semibold text-destructive' : ''}>
                      {formatDist(x.distance_to_route_m)}
                    </TableCell>
                    <TableCell className="text-xs">{acc ? `±${acc} м` : '—'}</TableCell>
                    <TableCell className="font-mono-num text-xs">{x.client ?? '—'}</TableCell>
                    <TableCell>
                      {x.result_false ? (
                        <Badge variant="destructive">{REASON_LABELS[x.result_false] ?? x.result_false}</Badge>
                      ) : (
                        <Badge variant="default">Принято</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
                    Попыток за период нет.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
