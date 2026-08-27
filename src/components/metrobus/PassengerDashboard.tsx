import Icon from '@/components/ui/icon';
import ViewModeToggle, { ViewMode, DataScope } from '@/components/metrobus/ViewModeToggle';
import ShareMyRatingsButton from '@/components/metrobus/ShareMyRatingsButton';
import { TransportType } from '@/lib/mockData';
import { DashboardSummary, Cluster, DashboardMetric, DashboardRecord, TopActiveUser, MyRank } from '@/lib/dashboardApi';

const STATUS_LABELS: Record<DashboardRecord['status'], { text: string; className: string }> = {
  published: { text: 'Опубликовано', className: 'bg-transport-tram/10 text-transport-tram' },
  draft: { text: 'Черновик', className: 'bg-secondary text-muted-foreground' },
};

function formatRecordDate(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const transportClass: Record<TransportType, string> = {
  bus: 'text-transport-bus',
  tram: 'text-transport-tram',
  trolley: 'text-transport-trolley',
};
const transportBg: Record<TransportType, string> = {
  bus: 'bg-transport-bus/10',
  tram: 'bg-transport-tram/10',
  trolley: 'bg-transport-trolley/10',
};
const transportImg: Record<TransportType, string> = {
  bus: '/icons/bus-transport.png',
  tram: '/icons/tram-transport.png',
  trolley: '/icons/trolley-transport.png',
};

interface PassengerDashboardProps {
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  dataScope: DataScope;
  setDataScope: (v: DataScope) => void;
  hasMyToken: boolean;
  myToken: string | null;
  loading: boolean;
  summary: DashboardSummary;
  clusters: Cluster[];
  metric1: DashboardMetric;
  metric2: DashboardMetric;
  records: DashboardRecord[];
  topActiveUsers: TopActiveUser[];
  myRank: MyRank | null;
}

export default function PassengerDashboard({
  viewMode,
  setViewMode,
  dataScope,
  setDataScope,
  hasMyToken,
  myToken,
  loading,
  summary,
  clusters,
  metric1,
  metric2,
  records,
  topActiveUsers,
  myRank,
}: PassengerDashboardProps) {
  return (
    <section id="dashboard" className="scroll-mt-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold sm:text-3xl">
            {viewMode === 'passengers' ? 'Дашборд поездок' : 'Дашборд маршрутов'}
          </h2>
        </div>
        <ViewModeToggle
          value={viewMode}
          onChange={setViewMode}
          dataScope={dataScope}
          onDataScopeChange={setDataScope}
        />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {dataScope === 'mine'
          ? 'Показаны только ваши оценки, сохранённые при последнем визите на ICQR.RU в этом браузере.'
          : viewMode === 'passengers'
          ? 'Оценки комфорта поездок в наземном общественном транспорте.'
          : 'Оценки удобства маршрутов наземного общественного транспорта.'}
      </p>

      {dataScope === 'mine' && !hasMyToken && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <Icon name="Fingerprint" size={16} className="shrink-0 text-amber-600" />
          <span>Этот браузер ещё не связан с вашей активностью. Используйте смартфон и кнопку "5*" на карте ICQR.RU для перехода на этот дашборд — после этого ваши оценки и место в рейтинге будут отображаться здесь автоматически.</span>
        </div>
      )}

      {dataScope === 'mine' && hasMyToken && myToken && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Хотите посмотреть свои оценки на компьютере, в комфортной обстановке?</span>
          <ShareMyRatingsButton token={myToken} />
        </div>
      )}

      {dataScope === 'mine' && myRank && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 font-mono-num text-base font-bold text-primary">
            {myRank.rank}
          </span>
          <span>
            Ваше место в общегородском рейтинге активности:{' '}
            <span className="font-semibold">{myRank.rank}</span> из {myRank.totalUsers.toLocaleString('ru-RU')}{' '}
            ({myRank.count.toLocaleString('ru-RU')}{' '}
            {viewMode === 'passengers'
              ? myRank.count === 1 ? 'оценка поездки' : 'оценок поездок'
              : myRank.count === 1 ? 'оценка маршрута' : 'оценок маршрутов'})
          </span>
        </div>
      )}

      {/* KPI: метрика 1 + метрика 2 (зависят от Мои/Все) */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground">{metric1.label}</p>
          <div className="mt-2 font-mono-num text-4xl font-bold leading-none">
            {metric1.value.toLocaleString('ru-RU')}
          </div>
        </div>
        <div className="rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground">{metric2.label}</p>
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
        <h3 className="font-semibold">
          {dataScope === 'mine'
            ? viewMode === 'passengers' ? 'Мои последние оценки поездок' : 'Мои последние оценки маршрутов'
            : viewMode === 'passengers' ? 'Последние оценки поездок по городу' : 'Последние оценки маршрутов по городу'}
        </h3>
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
                    <>
                      <span className="font-semibold">Борт {r.vehicleNumber}</span>
                      <span className="text-xs text-muted-foreground">маршрут №{r.routeNumber ?? '—'}</span>
                    </>
                  ) : (
                    <span className="font-semibold">
                      Маршрут №{r.routeNumber ?? '—'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_LABELS[r.status].className}`}>
                    {STATUS_LABELS[r.status].text}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatRecordDate(r.ratedAt)}</span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon
                    key={i}
                    name="Star"
                    size={14}
                    className={i < r.rating ? 'fill-amber-500 text-amber-500' : 'text-border'}
                  />
                ))}
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

      {/* Рейтинг самых активных пользователей */}
      <div className="mt-8">
        <div className="flex items-center gap-2">
          <Icon name="Trophy" size={18} className="text-muted-foreground" />
          <h3 className="text-lg font-semibold">
            {viewMode === 'passengers' ? 'Топ-10 (поездки)' : 'Топ-10 (маршруты)'}
          </h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Имена не раскрываются — только анонимный идентификатор.
        </p>
        {topActiveUsers.length === 0 && !loading && (
          <p className="mt-4 text-sm text-muted-foreground">Пока недостаточно данных для рейтинга.</p>
        )}
        {topActiveUsers.length > 0 && (
          <div className="mt-4 space-y-2">
            {topActiveUsers.map((u) => (
              <div
                key={u.rank}
                className={`flex items-center gap-3 rounded-xl border p-3 sm:p-4 ${
                  u.isMe ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono-num text-sm font-bold ${
                    u.rank <= 3 ? 'bg-amber-500/15 text-amber-600' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {u.rank}
                </span>
                <span className="flex-1 truncate font-medium">
                  {u.label}
                  {u.isMe && <span className="ml-2 text-xs font-normal text-primary">Это вы</span>}
                </span>
                <span className="flex shrink-0 items-center gap-1.5 font-mono-num text-sm font-semibold">
                  <Icon name="Star" size={14} className="fill-amber-500 text-amber-500" />
                  {u.count.toLocaleString('ru-RU')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI-кластеры */}
      <div className="mt-8 hidden sm:block">
        <div className="flex items-center gap-2">
          <Icon name="Sparkles" size={18} className="text-muted-foreground" />
          <h3 className="text-lg font-semibold">О чём пишут пользователи</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Комментарии сгруппированы автоматически. Примеры обезличены.
        </p>
        {clusters.length === 0 && !loading && (
          <p className="mt-4 text-sm text-muted-foreground">Пока нет отзывов с комментариями.</p>
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {clusters.map((c) => (
            <div key={c.key} className="rounded-xl border border-border p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.positive ? 'bg-transport-tram/10' : 'bg-secondary'}`}>
                    <Icon name={c.icon} size={18} className={c.positive ? 'text-transport-tram' : 'text-foreground'} />
                  </span>
                  <span className="font-semibold">{c.label}</span>
                </div>
                <span className="font-mono-num text-lg font-bold">{c.share}%</span>
              </div>
              <ul className="mt-3 space-y-2">
                {c.examples.map((ex, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                    <Icon name="Quote" size={13} className="mt-1 shrink-0 opacity-40" />
                    <span>{ex}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Заглушка для мобильной версии */}
      <div className="mt-8 flex items-center gap-3 rounded-xl border border-border p-4 sm:hidden">
        <Icon name="Monitor" size={18} className="shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          В версии для компьютера информация представлена более полно и подробно.
        </p>
      </div>
    </section>
  );
}