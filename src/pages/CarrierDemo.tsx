import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import {
  carrierDemoSummary,
  carrierDemoByType,
  carrierDemoTimeline,
  carrierDemoRoutes,
  carrierDemoClusters,
} from '@/lib/carrierDemoData';

const RatingChart = lazy(() => import('@/components/metrobus/RatingChart'));

const transportIcon: Record<string, string> = { bus: 'Bus', tram: 'TramFront', trolley: 'BusFront' };
const transportClass: Record<string, string> = {
  bus: 'text-transport-bus', tram: 'text-transport-tram', trolley: 'text-transport-trolley',
};
const transportBg: Record<string, string> = {
  bus: 'bg-transport-bus/10', tram: 'bg-transport-tram/10', trolley: 'bg-transport-trolley/10',
};

export default function CarrierDemo() {
  const summary = carrierDemoSummary;
  const timeline = carrierDemoTimeline();
  const trend = summary.average - summary.prevAverage;
  const trendUp = trend >= 0;
  const worstRoutes = [...carrierDemoRoutes].sort((a, b) => a.average - b.average).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Icon name="Bus" size={18} className="text-primary-foreground" />
            </span>
            <span className="text-[15px] font-bold tracking-tight">МЕТРОБУС<span>.РФ</span></span>
          </Link>
          <Link to="/">
            <Button variant="outline" size="sm" className="h-9 gap-1.5 px-3">
              <Icon name="ArrowLeft" size={15} />
              На главную
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16">
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <Icon name="FlaskConical" size={16} className="shrink-0 text-amber-600" />
          <span>
            Демо-режим. Все данные ниже — вымышленный пример, показывающий возможности личного кабинета перевозчика.
          </span>
        </div>

        <section className="pt-6 pb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold sm:text-2xl">{summary.fleetName}</h1>
            <Badge variant="secondary">демо</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Личный кабинет перевозчика — обратная связь пассажиров по вашему транспорту.
          </p>
        </section>

        {/* KPI */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border p-5">
            <p className="text-sm text-muted-foreground">Средняя оценка парка</p>
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
            <p className="mt-2 text-sm text-muted-foreground">от пассажиров парка</p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <p className="text-sm text-muted-foreground">Транспорта в парке</p>
            <div className="mt-2 font-mono-num text-4xl font-bold leading-none">{summary.vehiclesCount}</div>
            <p className="mt-2 text-sm text-muted-foreground">единиц техники</p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <p className="text-sm text-muted-foreground">Место среди перевозчиков</p>
            <div className="mt-2 font-mono-num text-4xl font-bold leading-none">
              {summary.cityRank}<span className="text-lg text-muted-foreground">/{summary.cityRankTotal}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">по городу</p>
          </div>
        </div>

        {/* Разбивка по типам */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {carrierDemoByType.map((t) => (
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

        {/* Хронология */}
        <div className="mt-4 rounded-xl border border-border p-5">
          <h3 className="font-semibold">Оценки по дням</h3>
          <p className="text-sm text-muted-foreground">Текущий месяц (демо)</p>
          <div className="mt-4">
            <Suspense fallback={<div className="h-[180px] animate-pulse rounded-lg bg-secondary" />}>
              <RatingChart data={timeline} detailed series={['tram', 'trolley']} />
            </Suspense>
          </div>
        </div>

        {/* Проблемные маршруты */}
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <Icon name="TriangleAlert" size={18} className="text-muted-foreground" />
            <h3 className="text-lg font-semibold">Маршруты, требующие внимания</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Три маршрута с самой низкой средней оценкой за месяц.</p>
          <div className="mt-4 rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Маршрут</TableHead>
                  <TableHead>Транспорт</TableHead>
                  <TableHead>Оценка</TableHead>
                  <TableHead>Отзывов</TableHead>
                  <TableHead>Динамика</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {worstRoutes.map((r) => (
                  <TableRow key={r.route}>
                    <TableCell className="font-mono-num font-semibold">№ {r.route}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5">
                        <Icon name={transportIcon[r.type]} size={15} className={transportClass[r.type]} />
                        {r.type === 'tram' ? 'Трамвай' : 'Троллейбус'}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono-num">{r.average.toFixed(2)}</TableCell>
                    <TableCell className="font-mono-num text-muted-foreground">{r.count}</TableCell>
                    <TableCell>
                      <span className={`flex items-center gap-1 text-sm font-medium ${r.trend >= 0 ? 'text-transport-tram' : 'text-destructive'}`}>
                        <Icon name={r.trend >= 0 ? 'TrendingUp' : 'TrendingDown'} size={14} />
                        {r.trend >= 0 ? '+' : ''}{r.trend.toFixed(2)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Кластеры комментариев */}
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <Icon name="Sparkles" size={18} className="text-muted-foreground" />
            <h3 className="text-lg font-semibold">О чём пишут пассажиры</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Комментарии сгруппированы автоматически. Примеры демонстрационные.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {carrierDemoClusters.map((c) => (
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

        <div className="mt-10 rounded-xl border border-border bg-secondary/30 p-5 text-center">
          <p className="font-semibold">Понравился демо-режим?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Оставьте заявку на подключение — и такой дашборд будет работать с реальными данными вашего парка.
          </p>
          <Link to="/#carrier-form">
            <Button className="mt-4 gap-2">
              <Icon name="Send" size={16} />
              Оставить заявку
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}