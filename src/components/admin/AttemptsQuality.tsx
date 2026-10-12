import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { fetchQualityReport, QualityReport, QualityReason, QualityBreakdown } from '@/lib/adminApi';

const REASONS: { key: QualityReason; label: string; hint: string; color: string; bad: boolean }[] = [
  { key: 'ok', label: 'Оценка принята', hint: 'Ошибок нет, оценка поставлена', color: 'bg-transport-tram', bad: false },
  { key: 'draft', label: 'Открыл, но не оценил', hint: 'Переход из ИНПАДА без итоговой оценки', color: 'bg-muted-foreground', bad: false },
  { key: 'far', label: 'Далеко от маршрута', hint: 'Геопозиция есть, но дальше 300 м от маршрута', color: 'bg-destructive', bad: true },
  { key: 'no_geo', label: 'Геопозиция не получена', hint: 'Не дал доступ к геопозиции или она не определилась', color: 'bg-orange-500', bad: true },
  { key: 'not_found', label: 'Транспорт не найден', hint: 'Введён несуществующий или неактивный бортовой номер', color: 'bg-amber-400', bad: true },
  { key: 'other', label: 'Другое', hint: 'Прочие причины (например, маршрут не найден)', color: 'bg-purple-400', bad: true },
];
const REASON_BY_KEY = Object.fromEntries(REASONS.map((r) => [r.key, r]));

const BUCKETS: { key: string; label: string }[] = [
  { key: 'near', label: 'До 300 м (рядом с маршрутом)' },
  { key: 'm300_1k', label: '300 м – 1 км' },
  { key: 'k1_5', label: '1 – 5 км' },
  { key: 'k5_20', label: '5 – 20 км' },
  { key: 'k20_plus', label: 'Более 20 км' },
];

const SOURCE_LABELS: Record<string, string> = {
  inpad: 'ИНПАД (ввод номера ТС)',
  'transport-card': 'Карточка транспорта',
  unknown: 'Неизвестно',
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

function Bar({ label, hint, value, total, color }: { label: string; hint?: string; value: number; total: number; color: string }) {
  const p = pct(value, total);
  return (
    <div>
      <div className="flex justify-between gap-2 text-sm">
        <span>{label}</span>
        <span className="shrink-0 font-mono-num text-muted-foreground">{value} · {p}%</span>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-1 h-2 rounded-full bg-secondary">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

function StackedBar({ row }: { row: QualityBreakdown }) {
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary">
      {REASONS.map((r) =>
        row[r.key] ? <div key={r.key} className={r.color} style={{ width: `${pct(row[r.key], row.total)}%` }} title={`${r.label}: ${row[r.key]}`} /> : null,
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {REASONS.map((r) => (
        <span key={r.key} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-sm ${r.color}`} />
          {r.label}
        </span>
      ))}
    </div>
  );
}

export default function AttemptsQuality({ dateFrom, dateTo }: { dateFrom?: string; dateTo?: string }) {
  const [report, setReport] = useState<QualityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<QualityReason | 'all' | 'rejected'>('all');

  const load = useCallback(() => {
    setLoading(true);
    fetchQualityReport(dateFrom || undefined, dateTo || undefined)
      .then(setReport)
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

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
        Собираю все попытки из ICQR…
      </div>
    );
  }

  if (!report) return <p className="py-12 text-sm text-muted-foreground">Не удалось получить данные.</p>;
  if (report.error) return <p className="py-12 text-sm text-destructive">Ошибка ICQR: {report.error}</p>;

  const r = report;
  const rc = r.reasonCounts;
  const withDistance = BUCKETS.reduce((s, b) => s + (r.distanceBuckets[b.key] ?? 0), 0);
  const farOver1k = (r.rejectedDistanceBuckets.k1_5 ?? 0) + (r.rejectedDistanceBuckets.k5_20 ?? 0) + (r.rejectedDistanceBuckets.k20_plus ?? 0);
  const rows = r.rows.filter((x) =>
    filter === 'all' ? true : filter === 'rejected' ? ['far', 'no_geo', 'not_found', 'other'].includes(x.reason) : x.reason === filter,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Качество попыток оценки</h2>
          <p className="text-sm text-muted-foreground">
            Все обращения к ICQR {r.period.dateFrom ? `с ${r.period.dateFrom}` : 'за всё время'}
            {r.period.dateTo ? ` по ${r.period.dateTo}` : ''} — по полю «Причина ошибки».
            {r.truncated && ' Догружаю записи из ICQR…'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
          <Icon name={loading ? 'Loader2' : 'RefreshCw'} size={14} className={loading ? 'animate-spin' : ''} />
          Обновить
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Всего попыток" value={r.total} hint={`${r.uniqueClients} устройств · ${r.uniqueVehicles} номеров ТС`} />
        <StatCard label="Оценка принята" value={rc.ok} hint={`${pct(rc.ok, r.total)}% · ещё ${rc.draft} открыли без оценки`} tone="good" />
        <StatCard label="Отказ системы" value={r.rejected} hint={`${pct(r.rejected, r.total)}% всех попыток`} tone={r.rejected ? 'bad' : undefined} />
        <StatCard label="Без геопозиции" value={rc.no_geo} hint={`${pct(rc.no_geo, r.total)}% попыток — доступ не дан`} tone={rc.no_geo ? 'bad' : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-5">
          <h3 className="font-semibold">Причины (поле «Причина ошибки»)</h3>
          <div className="mt-4 space-y-3">
            {REASONS.filter((x) => rc[x.key] > 0).map((x) => (
              <Bar key={x.key} label={x.label} hint={x.hint} value={rc[x.key]} total={r.total} color={x.color} />
            ))}
          </div>
          {Object.keys(r.otherReasons).length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              «Другое»: {Object.entries(r.otherReasons).map(([k, v]) => `${k} — ${v}`).join(', ')}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border p-5">
          <h3 className="font-semibold">Где находился человек относительно маршрута</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Только попытки, где геопозиция получена и номер ТС распознан ({withDistance}). Порог системы — 300 м.
          </p>
          <div className="mt-4 space-y-3">
            {BUCKETS.map((b) => (
              <Bar key={b.key} label={b.label} value={r.distanceBuckets[b.key] ?? 0} total={withDistance} color={b.key === 'near' ? 'bg-transport-tram' : 'bg-destructive'} />
            ))}
          </div>
          {farOver1k > 0 && (
            <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm">
              {farOver1k} из {rc.far} отказов «далеко от маршрута» — дальше 1 км: человек точно не был в этом транспорте.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border p-5">
        <h3 className="font-semibold">Выводы</h3>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex gap-2">
            <Icon name="MapPinOff" size={16} className="mt-0.5 shrink-0 text-destructive" />
            <span>
              <b>{rc.no_geo}</b> попыток ({pct(rc.no_geo, r.total)}%) — без доступа к геопозиции. Ещё у <b>{r.notFoundNoGeo}</b> из {rc.not_found} попыток
              «транспорт не найден» вместо реальной геопозиции стоит стандартная точка.
            </span>
          </li>
          <li className="flex gap-2">
            <Icon name="Hash" size={16} className="mt-0.5 shrink-0 text-amber-500" />
            <span>
              <b>{rc.not_found}</b> попыток ({pct(rc.not_found, r.total)}%) — несуществующий бортовой номер (ошибка или случайный ввод).
            </span>
          </li>
          <li className="flex gap-2">
            <Icon name="Sofa" size={16} className="mt-0.5 shrink-0 text-destructive" fallback="Home" />
            <span>
              <b>{rc.far}</b> попыток ({pct(rc.far, r.total)}%) — далеко от маршрута, из них <b>{farOver1k}</b> дальше 1 км («с дивана»).
            </span>
          </li>
          <li className="flex gap-2">
            <Icon name="CheckCircle2" size={16} className="mt-0.5 shrink-0 text-transport-tram" />
            <span>
              Принято <b>{rc.ok}</b> оценок ({pct(rc.ok, r.total)}%), ещё <b>{rc.draft}</b> раз человек был рядом, открыл форму, но не поставил оценку.
            </span>
          </li>
        </ul>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-5">
          <h3 className="font-semibold">По источнику</h3>
          <div className="mt-4 space-y-4">
            {r.bySource.map((s) => (
              <div key={s.source}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{SOURCE_LABELS[s.source ?? 'unknown'] ?? s.source}</span>
                  <span className="font-mono-num text-muted-foreground">{s.total} · принято {pct(s.ok, s.total)}%</span>
                </div>
                <StackedBar row={s} />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Legend />
          </div>
        </div>

        <div className="rounded-xl border border-border p-5">
          <h3 className="font-semibold">По дням</h3>
          <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
            {r.byDay.map((d) => (
              <div key={d.day} className="grid grid-cols-[84px_1fr_40px] items-center gap-3 text-sm">
                <span className="font-mono-num text-xs text-muted-foreground">{d.day}</span>
                <StackedBar row={d} />
                <span className="text-right font-mono-num text-xs">{d.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-5">
          <h3 className="font-semibold">Места, откуда много попыток</h3>
          <p className="mt-1 text-xs text-muted-foreground">Одна точка (±100 м) и много разных маршрутов — признак ввода номеров не из транспорта.</p>
          <Table className="mt-3">
            <TableHeader>
              <TableRow>
                <TableHead>Точка</TableHead>
                <TableHead>Попыток</TableHead>
                <TableHead>Принято</TableHead>
                <TableHead>Далеко</TableHead>
                <TableHead>Маршрутов</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.topPlaces.map((p) => (
                <TableRow key={`${p.lat},${p.lng}`}>
                  <TableCell>
                    <a href={`https://yandex.ru/maps/?pt=${p.lng},${p.lat}&z=15`} target="_blank" rel="noreferrer" className="font-mono-num text-xs text-primary underline">
                      {p.lat}, {p.lng}
                    </a>
                  </TableCell>
                  <TableCell>{p.attempts}</TableCell>
                  <TableCell>{p.ok}</TableCell>
                  <TableCell className={p.far ? 'text-destructive' : ''}>{p.far}</TableCell>
                  <TableCell title={p.routes.join(', ')}>{p.routes.length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-xl border border-border p-5">
          <h3 className="font-semibold">Номера ТС: признаки случайного ввода</h3>
          <p className="mt-1 text-xs text-muted-foreground">Один бортовой номер на разных маршрутах или у многих устройств.</p>
          {r.suspiciousVehicles.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Подозрительных номеров не найдено.</p>
          ) : (
            <Table className="mt-3">
              <TableHeader>
                <TableRow>
                  <TableHead>Номер ТС</TableHead>
                  <TableHead>Попыток</TableHead>
                  <TableHead>Отказов</TableHead>
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
      </div>

      <div className="rounded-xl border border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Все попытки ({rows.length})</h3>
          <div className="flex flex-wrap gap-1.5">
            {([['all', 'Все'], ['rejected', 'Все отказы']] as const).map(([k, label]) => (
              <Button key={k} variant={filter === k ? 'default' : 'outline'} size="sm" onClick={() => setFilter(k)}>
                {label}
              </Button>
            ))}
            {REASONS.filter((x) => rc[x.key] > 0).map((x) => (
              <Button key={x.key} variant={filter === x.key ? 'default' : 'outline'} size="sm" onClick={() => setFilter(x.key)}>
                {x.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="mt-3 max-h-[600px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Источник</TableHead>
                <TableHead>Маршрут</TableHead>
                <TableHead>ТС</TableHead>
                <TableHead>Геопозиция</TableHead>
                <TableHead>До маршрута</TableHead>
                <TableHead>Устройство</TableHead>
                <TableHead>Причина</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((x) => {
                const info = REASON_BY_KEY[x.reason];
                return (
                  <TableRow key={x.id}>
                    <TableCell className="font-mono-num text-xs">{x.id}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{x.created_at?.slice(0, 16) ?? '—'}</TableCell>
                    <TableCell className="text-xs">{x.source_screen === 'inpad' ? 'ИНПАД' : x.source_screen === 'transport-card' ? 'Карточка' : x.source_screen ?? '—'}</TableCell>
                    <TableCell>{x.route_number ?? '—'}</TableCell>
                    <TableCell className="font-mono-num">{x.vehicle_number ?? '—'}</TableCell>
                    <TableCell>
                      {x.geo === 'real' && x.lat !== null ? (
                        <a href={`https://yandex.ru/maps/?pt=${x.lng},${x.lat}&z=16`} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                          На карте
                        </a>
                      ) : (
                        <Badge variant="destructive">{x.geo === 'fallback' ? 'Стандартная точка' : 'Нет'}</Badge>
                      )}
                    </TableCell>
                    <TableCell className={(x.distance_to_route_m ?? 0) > 300 ? 'font-semibold text-destructive' : ''}>{formatDist(x.distance_to_route_m)}</TableCell>
                    <TableCell className="font-mono-num text-xs">{x.client ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={info?.bad ? 'destructive' : x.reason === 'ok' ? 'default' : 'secondary'}>
                        {x.reason === 'other' ? x.result_false : info?.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                    Попыток нет.
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
