import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import SeoHead from '@/components/metrobus/SeoHead';
import ViewModeToggle, { ViewMode } from '@/components/metrobus/ViewModeToggle';
import {
  regulatorDemoSummary,
  regulatorDemoByType,
  regulatorDemoTimeline,
  regulatorDemoCarriers,
  regulatorDemoClusters,
} from '@/lib/regulatorDemoData';

const RatingChart = lazy(() => import('@/components/metrobus/RatingChart'));

const transportBg: Record<string, string> = {
  bus: 'bg-transport-bus/10', tram: 'bg-transport-tram/10', trolley: 'bg-transport-trolley/10',
};
const transportClass: Record<string, string> = {
  bus: 'text-transport-bus', tram: 'text-transport-tram', trolley: 'text-transport-trolley',
};
const transportImg: Record<string, string> = {
  bus: '/icons/bus-transport.png',
  tram: '/icons/tram-transport.png',
  trolley: '/icons/trolley-transport.png',
};

export default function RegulatorDemo() {
  const [viewMode, setViewMode] = useState<ViewMode>('passengers');
  const summary = regulatorDemoSummary(viewMode);
  const byType = regulatorDemoByType(viewMode);
  const carriers = regulatorDemoCarriers(viewMode);
  const clusters = regulatorDemoClusters(viewMode);
  const timeline = regulatorDemoTimeline(viewMode);
  const trend = summary.average - summary.prevAverage;
  const trendUp = trend >= 0;
  const worstCarriers = [...carriers].sort((a, b) => a.average - b.average).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="Кабинет заказчика перевозок — демо | МЕТРОБУС.РФ"
        description="Демо-кабинет заказчика перевозок: независимый мониторинг качества наземного общественного транспорта города на основе оценок пассажиров, рейтинг перевозчиков."
        path="/regulator-demo"
      />
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary">
              <img src="/logo-icon.png" alt="МЕТРОБУС.РФ" className="h-full w-full object-contain" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[15px] font-bold tracking-tight">МЕТРОБУС<span>.РФ</span></span>
              <span className="text-[11px] font-medium text-muted-foreground">Кабинет заказчика</span>
            </span>
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
            Демо-режим. Все данные ниже — вымышленный пример, показывающий возможности кабинета заказчика.
          </span>
        </div>

        <section className="pt-6 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold sm:text-2xl">{summary.cityName}</h1>
              <Badge variant="secondary">демо</Badge>
            </div>
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {viewMode === 'passengers'
              ? 'Сводная оценка комфорта поездок по всем перевозчикам города.'
              : 'Сводная оценка удобства маршрутов по всем перевозчикам города.'}
          </p>
        </section>

        {/* KPI */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border p-5">
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
            <p className="mt-2 text-sm text-muted-foreground">{viewMode === 'passengers' ? 'оценок поездок' : 'оценок маршрутов'}</p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <p className="text-sm text-muted-foreground">Перевозчиков в городе</p>
            <div className="mt-2 font-mono-num text-4xl font-bold leading-none">{summary.carriersCount}</div>
            <p className="mt-2 text-sm text-muted-foreground">на платформе</p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <p className="text-sm text-muted-foreground">Маршрутов в городе</p>
            <div className="mt-2 font-mono-num text-4xl font-bold leading-none">{summary.routesCount}</div>
            <p className="mt-2 text-sm text-muted-foreground">под мониторингом</p>
          </div>
        </div>

        {/* Разбивка по типам */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {byType.map((t) => (
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

        {/* Хронология */}
        <div className="mt-4 rounded-xl border border-border p-5">
          <h3 className="font-semibold">Оценки по дням</h3>
          <p className="text-sm text-muted-foreground">Текущий месяц (демо)</p>
          <div className="mt-4">
            <Suspense fallback={<div className="h-[180px] animate-pulse rounded-lg bg-secondary" />}>
              <RatingChart data={timeline} detailed />
            </Suspense>
          </div>
        </div>

        {/* Перевозчики, требующие внимания */}
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <Icon name="TriangleAlert" size={18} className="text-muted-foreground" />
            <h3 className="text-lg font-semibold">Перевозчики, требующие внимания</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Три перевозчика с самой низкой средней оценкой за месяц.</p>
          <div className="mt-4 rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Перевозчик</TableHead>
                  <TableHead>Маршрутов</TableHead>
                  <TableHead>Оценка</TableHead>
                  <TableHead>Отзывов</TableHead>
                  <TableHead>Динамика</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {worstCarriers.map((c) => (
                  <TableRow key={c.carrier}>
                    <TableCell className="font-medium">{c.carrier}</TableCell>
                    <TableCell className="font-mono-num text-muted-foreground">{c.routesCount}</TableCell>
                    <TableCell className="font-mono-num">{c.average.toFixed(2)}</TableCell>
                    <TableCell className="font-mono-num text-muted-foreground">{c.count.toLocaleString('ru-RU')}</TableCell>
                    <TableCell>
                      <span className={`flex items-center gap-1 text-sm font-medium ${c.trend >= 0 ? 'text-transport-tram' : 'text-destructive'}`}>
                        <Icon name={c.trend >= 0 ? 'TrendingUp' : 'TrendingDown'} size={14} />
                        {c.trend >= 0 ? '+' : ''}{c.trend.toFixed(2)}
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
            <h3 className="text-lg font-semibold">О чём пишут пользователи</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Комментарии сгруппированы автоматически. Примеры демонстрационные.</p>
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

        <div className="mt-10 rounded-xl border border-border bg-secondary/30 p-5 text-center">
          <p className="font-semibold">Понравился демо-режим?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Оставьте заявку на подключение — и такой кабинет будет работать с реальными данными вашего города.
          </p>
          <Link to="/#regulator-form">
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