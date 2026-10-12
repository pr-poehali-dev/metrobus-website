import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { QualityReport, QualityReasonCounts } from '@/lib/adminApi';
import { REASONS, BUCKETS, pct } from '@/components/admin/quality/qualityShared';
import { StatCard, Bar } from '@/components/admin/quality/QualityCharts';

interface QualitySummaryProps {
  r: QualityReport;
  rc: QualityReasonCounts;
  withDistance: number;
  farOver1k: number;
  load: () => void;
  loading: boolean;
}

export default function QualitySummary({ r, rc, withDistance, farOver1k, load, loading }: QualitySummaryProps) {
  return (
    <>
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
    </>
  );
}
