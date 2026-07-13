import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { fetchSalesStats, SalesStatsResponse } from '@/lib/adminApi';

function formatMoney(kopecks: number) {
  return (kopecks / 100).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });
}

const STATUS_LABELS: Record<string, string> = {
  PAID: 'Оплачен',
  NEW: 'Новый',
  CANCELED: 'Отменён',
  REFUNDED: 'Возвращён',
  UNKNOWN: 'Неизвестно',
};

export default function SalesStats() {
  const [data, setData] = useState<SalesStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchSalesStats(dateFrom || undefined, dateTo || undefined);
    setData(res);
    setLoading(false);
  }, [dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const noData = !loading && data && data.summary.ticketsCount === 0;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-auto" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-auto" />
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
          <Icon name="RefreshCw" size={14} />
          Обновить
        </Button>
      </div>

      {noData && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Icon name="Info" size={16} className="shrink-0" />
          <span>
            Данные по продажам пока не синхронизированы. Раздел готов к подключению источника данных ICQR (билеты, транзакции, скидки).
          </span>
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Выручка</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono-num">{data ? formatMoney(data.summary.revenue) : '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Комиссия ICQR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono-num">{data ? formatMoney(data.summary.commission) : '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Билетов продано</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono-num">{data ? data.summary.ticketsCount.toLocaleString('ru-RU') : '—'}</div>
            <div className="text-xs text-muted-foreground">
              средний чек {data ? formatMoney(data.summary.avgTicket) : '—'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Возвраты</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono-num">{data ? data.summary.refundsCount.toLocaleString('ru-RU') : '—'}</div>
            <div className="text-xs text-muted-foreground">
              на сумму {data ? formatMoney(data.summary.refundsSum) : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">По маршрутам</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Маршрут</TableHead>
                  <TableHead className="text-right">Билетов</TableHead>
                  <TableHead className="text-right">Выручка</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!data || data.byRoute.length === 0) && (
                  <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">Нет данных</TableCell></TableRow>
                )}
                {data?.byRoute.map((r) => (
                  <TableRow key={r.routeNumber}>
                    <TableCell>{r.routeNumber}</TableCell>
                    <TableCell className="text-right font-mono-num">{r.count}</TableCell>
                    <TableCell className="text-right font-mono-num">{formatMoney(r.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">По перевозчикам</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Перевозчик</TableHead>
                  <TableHead className="text-right">Билетов</TableHead>
                  <TableHead className="text-right">Выручка</TableHead>
                  <TableHead className="text-right">Комиссия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!data || data.byCarrier.length === 0) && (
                  <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">Нет данных</TableCell></TableRow>
                )}
                {data?.byCarrier.map((c) => (
                  <TableRow key={c.carrierName}>
                    <TableCell>{c.carrierName}</TableCell>
                    <TableCell className="text-right font-mono-num">{c.count}</TableCell>
                    <TableCell className="text-right font-mono-num">{formatMoney(c.revenue)}</TableCell>
                    <TableCell className="text-right font-mono-num">{formatMoney(c.commission)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Статусы платежей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(!data || data.byPaymentStatus.length === 0) && (
                <span className="text-sm text-muted-foreground">Нет данных</span>
              )}
              {data?.byPaymentStatus.map((s) => (
                <Badge key={s.status} variant={s.status === 'PAID' ? 'default' : 'secondary'} className="gap-1.5">
                  {STATUS_LABELS[s.status] ?? s.status}
                  <span className="font-mono-num">{s.count}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Топ промокодов</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Промокод</TableHead>
                  <TableHead className="text-right">Применений</TableHead>
                  <TableHead className="text-right">Выручка</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!data || data.topPromocodes.length === 0) && (
                  <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">Нет данных</TableCell></TableRow>
                )}
                {data?.topPromocodes.map((p) => (
                  <TableRow key={p.promokod}>
                    <TableCell>{p.promokod}</TableCell>
                    <TableCell className="text-right font-mono-num">{p.count}</TableCell>
                    <TableCell className="text-right font-mono-num">{formatMoney(p.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
