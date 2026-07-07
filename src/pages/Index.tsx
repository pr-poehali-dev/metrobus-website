import { useState, useEffect, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useIsMobile } from '@/hooks/use-mobile';
import AccessForm from '@/components/metrobus/AccessForm';
import { TransportType } from '@/lib/mockData';
import { fetchDashboardStats, triggerIcqrSync, DashboardData } from '@/lib/dashboardApi';

const RatingChart = lazy(() => import('@/components/metrobus/RatingChart'));

const ICQR_URL = 'https://icqr.ru';

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

const Index = () => {
  const isMobile = useIsMobile();
  const [monthOffset, setMonthOffset] = useState(0);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    triggerIcqrSync();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDashboardStats(monthOffset)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [monthOffset]);

  const summary = data?.summary ?? { average: 0, prevAverage: 0, monthCount: 0, routesCount: 0, byType: [
    { type: 'bus' as TransportType, label: 'Автобус', average: 0, count: 0 },
    { type: 'tram' as TransportType, label: 'Трамвай', average: 0, count: 0 },
    { type: 'trolley' as TransportType, label: 'Троллейбус', average: 0, count: 0 },
  ] };
  const timeline = data?.timeline ?? [];
  const clusters = data?.clusters ?? [];
  const currentMonthLabel = data?.month ?? '';

  const trend = summary.average - summary.prevAverage;
  const trendUp = trend >= 0;

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <a href="#top" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Icon name="Bus" size={18} className="text-primary-foreground" />
            </span>
            <span className="text-[15px] font-bold tracking-tight">МЕТРОБУС<span>.РФ</span></span>
          </a>
          <a href={ICQR_URL} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="h-9 gap-1.5 px-3">
              <Icon name="Star" size={15} />
              <span className="hidden sm:inline">Оценить поездку</span>
              <span className="inline sm:hidden">Оценить</span>
            </Button>
          </a>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-5xl px-4">
        {/* HERO */}
        <section className="pt-10 pb-8 sm:pt-16 sm:pb-12">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Наземный городской пассажирский транспорт Санкт-Петербурга</p>
          <h1 className="text-xl font-bold leading-tight sm:text-4xl">
            Оценивай свои поездки.<br />Без приложения, без регистрации и без... QR-кодов.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">Твои оценки увидят перевозчики и организатор перевозок. Это изменит общественный транспорт Санкт-Петербурга к лучшему.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href={ICQR_URL} target="_blank" rel="noopener noreferrer" className="sm:w-auto">
              <Button size="lg" className="h-12 w-full gap-2 text-base sm:w-auto">
                <Icon name="Star" size={18} />
                Оценить поездку
              </Button>
            </a>
            <a href="#dashboard" className="sm:w-auto">
              <Button size="lg" variant="outline" className="h-12 w-full gap-2 text-base sm:w-auto">
                <Icon name="ChartLine" size={18} />
                Смотреть дашборд
              </Button>
            </a>
          </div>
        </section>

        {/* NAV TABS */}
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
                  { icon: 'Timer', title: 'Новый способ', text: 'Без приложения и без QR-кодов. Ввёл на сайте номер — поставил оценку.' },
                  { icon: 'UserX', title: 'Не переживай', text: 'Без аккаунта и пароля. Сообщаешь свое мнение анонимно.' },
                  { icon: 'Megaphone', title: 'Твой голос услышат', text: 'Оценки увидят перевозчики и город. Это повлияет на их решения.' },
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
                  { n: 2, icon: 'Map', title: 'Вводишь его в QR-поиск на ICQR.RU', text: 'Получаешь трассу маршрута в связке с транспортом.' },
                  { n: 3, icon: 'MessageSquare', title: 'Проверяешь данные и ставишь оценку', text: 'При желании пишешь короткий комментарий.' },
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
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold sm:text-3xl">Дашборд</h2>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  обновляется ежедневно
                </span>
              </div>

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
                        <Icon name={transportIcon[t.type]} size={18} className={transportClass[t.type]} />
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
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                  <Icon name="Bus" size={16} className="text-primary-foreground" />
                </span>
                <span className="font-bold">МЕТРОБУС.РФ</span>
              </div>
              <p className="mt-3 max-w-md text-sm text-muted-foreground">Цифровые сервисы пассажира.<br />Оплата проезда. Смарт-информирование. Обратная связь.</p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <a href="mailto:support@icqr.ru" className="flex items-center gap-2 hover:text-foreground">
                <Icon name="Mail" size={15} />
                support@icqr.ru
              </a>
              <p className="flex items-center gap-2">
                <Icon name="ShieldCheck" size={15} />
                Патент №0000000 (заглушка)
              </p>
              <p className="flex items-center gap-2">
                <Icon name="BadgeCheck" size={15} />
                Реестр Минцифры (заглушка)
              </p>
            </div>
          </div>
          <p className="mt-8 text-xs text-muted-foreground">
            © {new Date().getFullYear()} МЕТРОБУС.РФ. Правовая информация носит предварительный характер.
          </p>
        </div>
      </footer>
    </div>
  );
};

function RoleSection({
  icon, title, value, bullets, role,
}: {
  icon: string;
  title: string;
  value: string;
  bullets: string[];
  role: 'carrier' | 'regulator';
}) {
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
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h3 className="font-semibold">Заявка на подключение</h3>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">
          Оставьте контакты — мы расскажем о доступе к данным.
        </p>
        <AccessForm role={role} />
      </div>
    </div>
  );
}

export default Index;