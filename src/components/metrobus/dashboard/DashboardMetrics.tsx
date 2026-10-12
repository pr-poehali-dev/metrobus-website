import Icon from '@/components/ui/icon';
import { ViewMode, DataScope } from '@/components/metrobus/ViewModeToggle';
import { DashboardSummary, DashboardMetric, DashboardRecord } from '@/lib/dashboardApi';
import {
  STATUS_LABELS,
  formatRecordDate,
  formatSyncDate,
  transportClass,
  transportBg,
  transportImg,
} from '@/components/metrobus/dashboard/dashboardShared';
import ModeBadge from '@/components/metrobus/dashboard/ModeBadge';

interface DashboardMetricsProps {
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  dataScope: DataScope;
  loading: boolean;
  summary: DashboardSummary;
  metric1: DashboardMetric;
  metric2: DashboardMetric;
  metric3: DashboardMetric | null;
  records: DashboardRecord[];
}

export default function DashboardMetrics({
  viewMode,
  setViewMode,
  dataScope,
  loading,
  summary,
  metric1,
  metric2,
  metric3,
  records,
}: DashboardMetricsProps) {
  return (
    <>
      {/* KPI: метрика 1 + метрика 2 (зависят от Мои/Все) */}
      <div className={`mt-6 grid gap-4 sm:grid-cols-2 ${metric3 ? 'lg:grid-cols-3' : ''}`}>
        <div className="rounded-xl border border-border p-5">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Icon name="CheckCircle2" size={15} />
            {metric1.label}
            {dataScope === 'all' && summary.ratingsSync && (
              <span
                className={`ml-0.5 h-2 w-2 shrink-0 rounded-full ${
                  summary.ratingsSync.status === 'ok'
                    ? 'bg-emerald-500'
                    : summary.ratingsSync.status === 'error'
                      ? 'bg-destructive'
                      : 'bg-amber-500'
                }`}
                title={
                  summary.ratingsSync.status === 'ok'
                    ? `Синхронизация отзывов в порядке: ${formatSyncDate(summary.ratingsSync.lastSyncAt)}`
                    : summary.ratingsSync.status === 'error'
                      ? `Синхронизация отзывов завершилась ошибкой: ${summary.ratingsSync.errorMessage ?? 'неизвестно'}`
                      : 'Синхронизация отзывов ещё не запускалась'
                }
              />
            )}
          </p>
          <div className="mt-2 font-mono-num text-4xl font-bold leading-none">
            {metric1.value.toLocaleString('ru-RU')}
          </div>
        </div>
        <div className="rounded-xl border border-border p-5">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Icon name={dataScope === 'mine' ? 'TrendingUp' : 'Route'} size={15} />
            {metric2.label}
            {dataScope === 'all' && summary.routesDirectory && (
              <span
                className={`ml-0.5 h-2 w-2 shrink-0 rounded-full ${
                  summary.routesDirectory.synced === 0
                    ? 'bg-destructive'
                    : summary.routesDirectory.incomplete
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`}
                title={
                  summary.routesDirectory.synced === 0
                    ? 'Справочник маршрутов не синхронизирован'
                    : summary.routesDirectory.incomplete
                      ? `Справочник маршрутов синхронизирован не полностью: ${summary.routesDirectory.synced} из ${summary.routesDirectory.total}`
                      : 'Справочник маршрутов синхронизирован полностью'
                }
              />
            )}
          </p>
          {dataScope === 'mine' ? (
            <div className={`mt-2 flex items-center gap-1.5 font-mono-num text-4xl font-bold leading-none ${metric2.value > 0 ? 'text-transport-tram' : ''}`}>
              <Icon name="TrendingUp" size={22} className={metric2.value > 0 ? 'text-transport-tram' : 'text-muted-foreground'} />
              {metric2.value > 0 ? '+' : ''}{metric2.value.toLocaleString('ru-RU')}
            </div>
          ) : (
            <>
              <div className="mt-2 flex items-end gap-1.5">
                <span className="font-mono-num text-4xl font-bold leading-none">{metric2.value}</span>
                {typeof metric2.total === 'number' && (
                  <span className="text-lg text-muted-foreground">из {metric2.total}</span>
                )}
              </div>
              {typeof metric2.total === 'number' && metric2.total > 0 && (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, (metric2.value / metric2.total) * 100)}%` }}
                  />
                </div>
              )}
            </>
          )}
        </div>
        {metric3 && dataScope === 'all' && (
          <div className="rounded-xl border border-border p-5">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Icon name="Bus" size={15} />
              {metric3.label}
            </p>
            <div className="mt-2 flex items-end gap-1.5">
              <span className="font-mono-num text-4xl font-bold leading-none">{metric3.value.toLocaleString('ru-RU')}</span>
              {typeof metric3.total === 'number' && (
                <span className="text-lg text-muted-foreground">из {metric3.total.toLocaleString('ru-RU')}</span>
              )}
            </div>
            {typeof metric3.total === 'number' && metric3.total > 0 && (
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, (metric3.value / metric3.total) * 100)}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Разбивка по типам */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {summary.byType.map((t) => (
          <div key={t.type} className="rounded-xl border border-border p-5">
            <div className="flex items-center gap-2.5">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${transportBg[t.type]}`}>
                <img
                  src={transportImg[t.type]}
                  alt={t.label}
                  className="h-[22px] w-[15px] object-contain"
                />
              </span>
              <span className="font-semibold">{t.label}</span>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <span className="font-mono-num text-3xl font-bold leading-none">{t.average.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground">{t.count.toLocaleString('ru-RU')} оценок</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full ${transportClass[t.type].replace('text-', 'bg-')}`}
                style={{ width: `${(t.average / 5) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Список последних записей */}
      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">
            {dataScope === 'mine' ? 'Мои последние оценки' : 'Последние оценки'}
          </h3>
          <ModeBadge viewMode={viewMode} setViewMode={setViewMode} />
        </div>
        {records.length === 0 && !loading && (
          <p className="mt-3 text-sm text-muted-foreground">
            {dataScope === 'mine' ? 'Пока нет записей.' : 'Пока нет опубликованных записей.'}
          </p>
        )}
        <div className="mt-3 space-y-2">
          {records.map((r) => (
            <div key={r.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${transportBg[r.transportType]}`}>
                    <img
                      src={transportImg[r.transportType]}
                      alt={r.transportType}
                      className="h-[18px] w-[12px] object-contain"
                    />
                  </span>
                  {viewMode === 'passengers' && r.vehicleNumber ? (
                    <span className="font-semibold">Борт {r.vehicleNumber}</span>
                  ) : (
                    <span className="font-semibold">
                      Маршрут №{r.routeNumber ?? '—'}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{formatRecordDate(r.ratedAt)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Icon
                        key={i}
                        name="Star"
                        size={14}
                        className={i < r.rating ? 'fill-amber-500 text-amber-500' : 'text-border'}
                      />
                    ))}
                  </div>
                  {viewMode === 'passengers' && r.vehicleNumber && (
                    <span className="text-xs text-muted-foreground">Маршрут №{r.routeNumber ?? '—'}</span>
                  )}
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_LABELS[r.status].className}`}>
                  {STATUS_LABELS[r.status].text}
                </span>
              </div>
              {r.comment && (
                <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Хронология по дням */}
      <div className="mt-4 hidden rounded-xl border border-border p-5 sm:block">
        <h3 className="font-semibold">Оценки по дням</h3>
        <div className="mt-4 flex h-[180px] items-center justify-center rounded-lg bg-secondary">
          <p className="text-sm text-muted-foreground">Идёт сбор и накопление информации</p>
        </div>
      </div>
    </>
  );
}
