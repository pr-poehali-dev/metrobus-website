import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import ModerationQueue from '@/components/admin/ModerationQueue';
import IcqrSyncStatus from '@/components/admin/IcqrSyncStatus';
import {
  loginWithPin,
  verifySession,
  clearAdminToken,
  fetchAdminReviews,
  AdminReviewItem,
  AdminReviewsQuery,
} from '@/lib/adminApi';

const TRANSPORT_LABELS: Record<string, string> = {
  bus: 'Автобус',
  tram: 'Трамвай',
  trolley: 'Троллейбус',
};

function sentimentRowClass(sentiment: AdminReviewItem['sentiment']) {
  switch (sentiment) {
    case 'positive':
      return 'bg-transport-tram/5 hover:bg-transport-tram/10';
    case 'negative':
      return 'bg-destructive/5 hover:bg-destructive/10';
    case 'anomaly':
      return 'bg-amber-500/10 hover:bg-amber-500/15';
    default:
      return '';
  }
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function PinScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(false);
    const ok = await loginWithPin(pin);
    setLoading(false);
    if (ok) {
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-xs rounded-xl border border-border p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Icon name="Lock" size={18} className="text-primary-foreground" />
          </span>
          <span className="font-semibold">Консоль модерации</span>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">Введите ПИН-код доступа</p>
        <Input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="••••"
          className="mb-3 text-center text-lg tracking-widest"
          autoFocus
        />
        {error && <p className="mb-3 text-sm text-destructive">Неверный ПИН-код</p>}
        <Button className="w-full" onClick={submit} disabled={loading || !pin}>
          {loading ? 'Проверка…' : 'Войти'}
        </Button>
      </div>
    </div>
  );
}

export default function AdminConsole() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [items, setItems] = useState<AdminReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [anomalyTotal, setAnomalyTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 50;

  const [search, setSearch] = useState('');
  const [transportType, setTransportType] = useState('all');
  const [ratingMin, setRatingMin] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState('rated_at');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');

  useEffect(() => {
    verifySession().then((ok) => setAuthed(ok));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const query: AdminReviewsQuery = {
      search: search || undefined,
      transportType: transportType !== 'all' ? transportType : undefined,
      ratingMin: ratingMin !== 'all' ? ratingMin : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sort,
      order,
      page,
      perPage,
    };
    const res = await fetchAdminReviews(query);
    if (res === null) {
      setAuthed(false);
    } else {
      setItems(res.items);
      setTotal(res.total);
      setAnomalyTotal(res.anomalyTotal);
    }
    setLoading(false);
  }, [search, transportType, ratingMin, dateFrom, dateTo, sort, order, page]);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  const toggleSort = (field: string) => {
    if (sort === field) {
      setOrder(order === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSort(field);
      setOrder('DESC');
    }
    setPage(1);
  };

  const logout = () => {
    clearAdminToken();
    setAuthed(false);
  };

  const hasActiveFilters = Boolean(search || transportType !== 'all' || dateFrom || dateTo);

  const resetFilters = () => {
    setSearch('');
    setTransportType('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  if (authed === null) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Загрузка…</div>;
  }

  if (!authed) {
    return <PinScreen onSuccess={() => setAuthed(true)} />;
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Icon name="ShieldCheck" size={16} className="text-primary-foreground" />
            </span>
            <span className="font-semibold">Реестр отзывов</span>
            <Badge variant="secondary">{total.toLocaleString('ru-RU')}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <IcqrSyncStatus />
            <Button variant="outline" size="sm" onClick={logout} className="gap-1.5">
              <Icon name="LogOut" size={14} />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Tabs
          defaultValue="registry"
          onValueChange={(value) => {
            if (value === 'registry') load();
          }}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="registry" className="gap-1.5">
              <Icon name="List" size={14} />
              Реестр отзывов
            </TabsTrigger>
            <TabsTrigger value="moderation" className="gap-1.5">
              <Icon name="ShieldQuestion" size={14} />
              Модерация ICQR
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registry">
        {anomalyTotal > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
            <Icon name="TriangleAlert" size={16} className="text-amber-600 shrink-0" />
            <span>
              Обнаружено аномальных/неполных записей: <strong>{anomalyTotal}</strong>. Они не подсвечены цветом сентимента, но отмечены значком.
            </span>
          </div>
        )}

        {/* Фильтры */}
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Поиск по комментарию, маршруту, остановке…"
              className="pl-9"
            />
          </div>

          <Select value={transportType} onValueChange={(v) => { setTransportType(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Вид транспорта" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все виды транспорта</SelectItem>
              <SelectItem value="bus">Автобус</SelectItem>
              <SelectItem value="tram">Трамвай</SelectItem>
              <SelectItem value="trolley">Троллейбус</SelectItem>
            </SelectContent>
          </Select>

          <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
          <div className="flex gap-2">
            <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
            {hasActiveFilters && (
              <Button variant="outline" size="icon" onClick={resetFilters} className="shrink-0" aria-label="Сбросить фильтры">
                <Icon name="X" size={15} />
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('rated_at')}>
                  <span className="flex items-center gap-1">Дата {sort === 'rated_at' && <Icon name={order === 'DESC' ? 'ChevronDown' : 'ChevronUp'} size={14} />}</span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('rating')}>
                  <span className="flex items-center gap-1">Оценка {sort === 'rating' && <Icon name={order === 'DESC' ? 'ChevronDown' : 'ChevronUp'} size={14} />}</span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('transport_type')}>
                  <span className="flex items-center gap-1">Транспорт {sort === 'transport_type' && <Icon name={order === 'DESC' ? 'ChevronDown' : 'ChevronUp'} size={14} />}</span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('route_number')}>
                  <span className="flex items-center gap-1">Маршрут {sort === 'route_number' && <Icon name={order === 'DESC' ? 'ChevronDown' : 'ChevronUp'} size={14} />}</span>
                </TableHead>
                <TableHead>Остановки</TableHead>
                <TableHead>Комментарий</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Загрузка…</TableCell></TableRow>
              )}
              {!loading && items.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Ничего не найдено</TableCell></TableRow>
              )}
              {!loading && items.map((item) => (
                <TableRow key={item.id} className={sentimentRowClass(item.sentiment)}>
                  <TableCell className="whitespace-nowrap text-sm">{formatDate(item.ratedAt)}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 font-mono-num font-semibold">
                      {item.rating}
                      <Icon name="Star" size={13} className="text-amber-500" />
                      {item.isAnomaly && <Icon name="TriangleAlert" size={14} className="ml-1 text-amber-600" />}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{item.transportType ? (TRANSPORT_LABELS[item.transportType] ?? item.transportType) : '—'}</TableCell>
                  <TableCell className="text-sm">{item.routeNumber ?? '—'}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {item.nearestStopName || item.stopToName
                      ? `${item.nearestStopName ?? ''}${item.nearestStopName && item.stopToName ? ' → ' : ''}${item.stopToName ?? ''}`
                      : '—'}
                  </TableCell>
                  <TableCell className="max-w-[320px] text-sm text-muted-foreground">{item.comment || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Страница {page} из {totalPages}</span>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <Icon name="ChevronLeft" size={15} />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <Icon name="ChevronRight" size={15} />
            </Button>
          </div>
        </div>
          </TabsContent>

          <TabsContent value="moderation">
            <ModerationQueue />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}