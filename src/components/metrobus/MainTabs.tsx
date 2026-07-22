import { useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import AccessForm from '@/components/metrobus/AccessForm';
import CarrierLoginDialog from '@/components/metrobus/CarrierLoginDialog';
import ViewModeToggle, { ViewMode } from '@/components/metrobus/ViewModeToggle';
import { TransportType } from '@/lib/mockData';
import { DashboardSummary, TimelinePoint, Cluster } from '@/lib/dashboardApi';

const RatingChart = lazy(() => import('@/components/metrobus/RatingChart'));

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
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  monthOffset: number;
  setMonthOffset: (fn: (m: number) => number) => void;
  loading: boolean;
  isMobile: boolean;
  summary: DashboardSummary;
  timeline: TimelinePoint[];
  clusters: Cluster[];
  currentMonthLabel: string;
  trend: number;
  trendUp: boolean;
  onCityDialogOpen: () => void;
}

export default function MainTabs({
  viewMode,
  setViewMode,
  monthOffset,
  setMonthOffset,
  loading,
  isMobile,
  summary,
  timeline,
  clusters,
  currentMonthLabel,
  trend,
  trendUp,
  onCityDialogOpen,
}: MainTabsProps) {
  return (
    <Tabs defaultValue="passengers" className="pb-16">
      <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
        <TabsTrigger value="passengers" className="h-10 gap-1.5 text-[13px] sm:text-sm">
          <Icon name="Users" size={15} />Пассажирам
        </TabsTrigger>
        <TabsTrigger value="carrier" className="h-10 gap-1.5 text-[13px] sm:text-sm">
          <Icon name="Building2" size={15} />Перевозчику
        </TabsTrigger>
        <TabsTrigger value="regulator" className="h-10 gap-1.5 text-[13px] sm:text-sm">
          <Icon name="Landmark" size={15} />Регулятору
        </TabsTrigger>
      </TabsList>

      {/* ===== ПАССАЖИРЫ ===== */}
      <TabsContent value="passengers" className="mt-8 space-y-16">
        {/* С.1 — Что это */}
        <section>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: 'Timer', title: 'Быстро (10 секунд)', text: 'Ввели короткий номер с борта — поставили оценку. Пассажир ли вы или наблюдатель — способ один и тот же.' },
              { icon: 'UserX', title: 'Анонимно', text: 'Никто не узнает, кто вы. Пишите прямо — честная оценка помогает городу.' },
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
              <button
                type="button"
                onClick={onCityDialogOpen}
                className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
              >
                <Icon name="MapPin" size={12} />
                Санкт-Петербург
              </button>
            </div>
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {viewMode === 'passengers'
              ? 'Оценки от людей, которые ехали в наземном общественном транспорте.'
              : 'Оценки от людей, наблюдавших за работой наземного общественного транспорта со стороны.'}
          </p>

          {/* KPI: средняя + счётчик */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border p-5 sm:col-span-1">
              <p className="text-sm text-muted-foreground">Средняя оценка по городу</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="font-mono-num text-4xl font-bold leading-none">{summary.average.toFixed(2)}</span>
                <span className="text-lg text-muted-foreground">/5</span>
              </div>
              <div className={`mt-2 flex items-center gap-1 text-sm font-medium ${trendUp ? 'text-transport-tram' : 'text-destructive'}`}>
                <Icon name={trendUp ? 'TrendingUp' : 'TrendingDown'} size={16} />
                {trendUp ? '+' : ''}{trend.toFixed(2)} к прошлому месяцу
              </div>
            </div>
            <div className="rounded-xl border border-border p-5">
              <p className="text-sm text-muted-foreground">Оценок за месяц</p>
              <div className="mt-2 font-mono-num text-4xl font-bold leading-none">
                {summary.monthCount.toLocaleString('ru-RU')}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">от пассажиров города</p>
            </div>
            <div className="rounded-xl border border-border p-5">
              <p className="text-sm text-muted-foreground">Оценено маршрутов</p>
              <div className="mt-2 font-mono-num text-4xl font-bold leading-none">{summary.routesCount}</div>
              <p className="mt-2 text-sm text-muted-foreground">разных маршрутов города</p>
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

          {/* Хронология по дням */}
          <div className="mt-4 rounded-xl border border-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Оценки по дням</h3>
                <p className="text-sm text-muted-foreground">{currentMonthLabel}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="icon" className="h-9 w-9"
                  onClick={() => setMonthOffset((m) => m - 1)}
                  aria-label="Предыдущий месяц"
                >
                  <Icon name="ChevronLeft" size={18} />
                </Button>
                <Button
                  variant="outline" size="icon" className="h-9 w-9"
                  onClick={() => setMonthOffset((m) => Math.min(0, m + 1))}
                  disabled={monthOffset >= 0}
                  aria-label="Следующий месяц"
                >
                  <Icon name="ChevronRight" size={18} />
                </Button>
              </div>
            </div>
            <div className="mt-4">
              {loading || timeline.length === 0 ? (
                <div className="h-[180px] animate-pulse rounded-lg bg-secondary" />
              ) : (
                <Suspense fallback={<div className="h-[180px] animate-pulse rounded-lg bg-secondary" />}>
                  <RatingChart data={timeline} detailed={!isMobile} />
                </Suspense>
              )}
            </div>
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
          title="Информация для перевозчика"
          value="Получайте обратную связь от пассажиров в реальном времени — по видам транспорта и дням, без ручного сбора жалоб. Работайте на опережение и повышайте оценку своего парка."
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