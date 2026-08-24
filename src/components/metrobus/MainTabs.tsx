import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import AccessForm from '@/components/metrobus/AccessForm';
import CarrierLoginDialog from '@/components/metrobus/CarrierLoginDialog';
import ViewModeToggle, { ViewMode, DataScope } from '@/components/metrobus/ViewModeToggle';
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

const transportIcon: Record<TransportType, string> = {
  bus: 'Bus',
  tram: 'TramFront',
  trolley: 'BusFront',
};
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

interface MainTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  dataScope: DataScope;
  setDataScope: (v: DataScope) => void;
  hasMyToken: boolean;
  loading: boolean;
  summary: DashboardSummary;
  clusters: Cluster[];
  metric1: DashboardMetric;
  metric2: DashboardMetric;
  records: DashboardRecord[];
  topActiveUsers: TopActiveUser[];
  myRank: MyRank | null;
}

export default function MainTabs({
  activeTab,
  onTabChange,
  viewMode,
  setViewMode,
  dataScope,
  setDataScope,
  hasMyToken,
  loading,
  summary,
  clusters,
  metric1,
  metric2,
  records,
  topActiveUsers,
  myRank,
}: MainTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="pb-16">
      <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
        <TabsTrigger value="passengers" className="h-10 gap-1.5 text-[13px] sm:text-sm">
          <Icon name="Users" size={15} />Пассажирам
        </TabsTrigger>
        <TabsTrigger value="carrier" className="h-10 gap-1.5 text-[13px] sm:text-sm">
          <Icon name="Building2" size={15} />Перевозчикам
        </TabsTrigger>
        <TabsTrigger value="regulator" className="h-10 gap-1.5 text-[13px] sm:text-sm">
          <Icon name="Landmark" size={15} />Заказчикам
        </TabsTrigger>
      </TabsList>

      {/* ===== ПАССАЖИРЫ ===== */}
      <TabsContent value="passengers" className="mt-8 space-y-16">
        {/* С.1 — Что это */}
        <section>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: 'Timer', title: 'Быстро (10 секунд)', text: 'Ввели короткий номер с борта — поставили оценку. Пассажир ли вы или наблюдатель — способ один и тот же.' },
              { icon: 'UserX', title: 'Анонимно', text: 'Укажите свой статус (пассажир / наблюдатель) и пишите как есть. Ваша правдивая оценка помогает городу.' },
              { icon: 'Megaphone', title: 'Эффективно', text: 'Оценки увидят и перевозчики, и организатор перевозок. Найти их можно будет позже — они не потеряются.' },
            ].map((b) => (
              <div key={b.title} className="rounded-xl border border-border p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <Icon name={b.icon} size={20} className="text-foreground" />
                </div>
                <h3 className="font-semibold">{b.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{b.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* С.2 — Как работает */}
        <section>
          <h2 className="text-2xl font-bold sm:text-3xl">Как это работает</h2>
          <div className="mt-6 space-y-3">
            {[
              { n: 1, icon: 'Hash', title: 'Видишь короткий бортовой номер', text: 'Он нанесён на кузов и внутри салона транспорта (4 - 6 цифр).' },
              { n: 2, icon: 'Grid3x3', title: 'Вводишь его в QR-поиск на ICQR.RU', text: 'Получаешь трассу маршрута в связке с транспортом.' },
              { n: 3, icon: 'Star', title: 'Проверяешь данные и ставишь оценку', text: 'При желании пишешь короткий комментарий.' },
            ].map((s) => (
              <div key={s.n} className="flex items-start gap-4 rounded-xl border border-border p-4 sm:p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary font-mono text-sm font-semibold text-primary-foreground">
                  {s.n}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon name={s.icon} size={16} className="text-muted-foreground" />
                    <h3 className="font-semibold">{s.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* С.3 — Дашборд */}
        <section id="dashboard" className="scroll-mt-20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold sm:text-3xl">
                {viewMode === 'passengers' ? 'Дашборд пассажира' : 'Дашборд наблюдателя'}
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
              ? 'Оценки от людей, которые ехали в наземном общественном транспорте.'
              : 'Оценки от людей, наблюдавших за работой наземного общественного транспорта со стороны.'}
          </p>

          {dataScope === 'mine' && !hasMyToken && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
              <Icon name="Fingerprint" size={16} className="shrink-0 text-amber-600" />
              <span>
                Этот браузер ещё не привязан к вашему профилю. Перейдите в раздел «Мои оценки» на ICQR.RU и оттуда откройте ссылку на дашборд — после этого ваши оценки и место в рейтинге будут отображаться здесь автоматически.
              </span>
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
                  ? myRank.count === 1 ? 'оценка' : 'оценок'
                  : myRank.count === 1 ? 'наблюдение' : 'наблюдений'})
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
                ? viewMode === 'passengers' ? 'Мои последние оценки' : 'Мои последние наблюдения'
                : viewMode === 'passengers' ? 'Последние оценки по городу' : 'Последние наблюдения по городу'}
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
                        <Icon name={transportIcon[r.transportType]} size={15} className={transportClass[r.transportType]} />
                      </span>
                      <span className="font-semibold">
                        {viewMode === 'passengers' ? 'Маршрут' : 'Наблюдаемый маршрут'} №{r.routeNumber ?? '—'}
                      </span>
                      {r.vehicleNumber && (
                        <span className="text-xs text-muted-foreground">борт {r.vehicleNumber}</span>
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
          <div className="mt-4 rounded-xl border border-border p-5">
            <h3 className="font-semibold">Оценки по дням</h3>
            <div className="mt-4 flex h-[180px] items-center justify-center rounded-lg bg-secondary">
              <p className="text-sm text-muted-foreground">Идёт сбор и накопление информации</p>
            </div>
          </div>

          {/* Рейтинг самых активных пассажиров/наблюдателей */}
          <div className="mt-8">
            <div className="flex items-center gap-2">
              <Icon name="Trophy" size={18} className="text-muted-foreground" />
              <h3 className="text-lg font-semibold">
                {viewMode === 'passengers' ? 'Самые активные пассажиры города' : 'Самые активные наблюдатели города'}
              </h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {viewMode === 'passengers'
                ? 'Топ-10 по количеству оставленных оценок. Имена не раскрываются — только анонимный идентификатор.'
                : 'Топ-10 по количеству отправленных наблюдений. Имена не раскрываются — только анонимный идентификатор.'}
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
          <div className="mt-8">
            <div className="flex items-center gap-2">
              <Icon name="Sparkles" size={18} className="text-muted-foreground" />
              <h3 className="text-lg font-semibold">О чём пишут пассажиры</h3>
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
        </section>
      </TabsContent>

      {/* ===== ПЕРЕВОЗЧИК ===== */}
      <TabsContent value="carrier" className="mt-8">
        <RoleSection
          icon="Building2"
          title="Обратная связь привязана к конкретному рейсу, а не к общему впечатлению."
          value="Получайте объективную обратную связь в режиме реального времени. Работайте на опережение и повышайте оценку своего парка."
          bullets={[
            'Динамика оценок по вашему транспорту',
            'Автоматическая группировка проблем',
            'Данные для управленческих решений',
          ]}
          role="carrier"
          showCarrierActions
        />
      </TabsContent>

      {/* ===== РЕГУЛЯТОР ===== */}
      <TabsContent value="regulator" className="mt-8">
        <RoleSection
          icon="Landmark"
          title="Информация для регулятора"
          value="Объективная картина качества наземного транспорта города на основе мнений пассажиров. Прозрачная база для контроля перевозчиков и планирования."
          bullets={[
            'Сводная оценка качества по городу',
            'Тренды и проблемные зоны',
            'Независимый источник данных',
          ]}
          role="regulator"
        />
      </TabsContent>
    </Tabs>
  );
}

function RoleSection({
  icon, title, value, bullets, role, showCarrierActions,
}: {
  icon: string;
  title: string;
  value: string;
  bullets: string[];
  role: 'carrier' | 'regulator';
  showCarrierActions?: boolean;
}) {
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
          <Icon name={icon} size={24} className="text-foreground" />
        </div>
        <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
        <p className="mt-3 text-base text-muted-foreground">{value}</p>
        <ul className="mt-5 space-y-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm">
              <Icon name="Check" size={18} className="mt-0.5 shrink-0 text-transport-tram" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        {showCarrierActions && (
          <div className="mt-6 rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 sm:p-5">
            <p className="text-sm font-medium text-foreground">Уже подключены к сервису?</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-12 w-full gap-2 text-base sm:w-auto" onClick={() => setLoginOpen(true)}>
                <Icon name="LogIn" size={18} />
                Вход в кабинет
              </Button>
              <Link to="/carrier-demo" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-full gap-2 border-2 border-primary text-base text-primary hover:bg-primary hover:text-primary-foreground sm:w-auto"
                >
                  <Icon name="FlaskConical" size={18} />
                  Демо-режим
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
      <div id={role === 'carrier' ? 'carrier-form' : undefined} className="scroll-mt-20 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h3 className="font-semibold">Заявка на подключение</h3>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">
          Оставьте контакты — мы расскажем о доступе к данным.
        </p>
        <AccessForm role={role} />
      </div>

      {showCarrierActions && (
        <CarrierLoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      )}
    </div>
  );
}