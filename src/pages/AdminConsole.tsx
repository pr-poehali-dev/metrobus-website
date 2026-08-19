import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import ModerationQueue from '@/components/admin/ModerationQueue';
import SalesStats from '@/components/admin/SalesStats';
import IcqrSyncStatus from '@/components/admin/IcqrSyncStatus';
import ReviewDetailDialog from '@/components/admin/ReviewDetailDialog';
import {
  loginWithPin,
  verifySession,
  clearAdminToken,
  fetchAdminReviews,
  setCommentVerified,
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
  const [role, setRole] = useState('all');
  const [ratingMin, setRatingMin] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [commentStatus, setCommentStatus] = useState<'all' | 'unverified'>('all');
  const [sort, setSort] = useState('rated_at');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [selectedItem, setSelectedItem] = useState<AdminReviewItem | null>(null);

  useEffect(() => {
    verifySession().then((ok) => setAuthed(ok));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const query: AdminReviewsQuery = {
      search: search || undefined,
      transportType: transportType !== 'all' ? transportType : undefined,
      role: role !== 'all' ? (role as 'passenger' | 'observer') : undefined,
      ratingMin: ratingMin !== 'all' ? ratingMin : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      commentStatus: commentStatus === 'unverified' ? 'unverified' : undefined,
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
  }, [search, transportType, role, ratingMin, dateFrom, dateTo, commentStatus, sort, order, page]);

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

  const toggleVerified = async (item: AdminReviewItem) => {
    const next = !item.commentVerified;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, commentVerified: next } : i)));
    const ok = await setCommentVerified(item.id, next);
    if (!ok) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, commentVerified: !next } : i)));
    }
  };

  const hasActiveFilters = Boolean(search || transportType !== 'all' || role !== 'all' || dateFrom || dateTo || commentStatus !== 'all');

  const resetFilters = () => {
    setSearch('');
    setTransportType('all');
    setRole('all');
    setDateFrom('');
    setDateTo('');
    setCommentStatus('all');
    setPage(1);
  };

  const toggleUnverifiedFilter = () => {
    setCommentStatus((prev) => (prev === 'unverified' ? 'all' : 'unverified'));
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
            <TabsTrigger value="sales" className="gap-1.5">
              <Icon name="Wallet" size={14} />
              Касса и продажи
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

          <Select value={role} onValueChange={(v) => { setRole(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Роль" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Пассажир и наблюдатель</SelectItem>
              <SelectItem value="passenger">Пассажир</SelectItem>
              <SelectItem value="observer">Наблюдатель</SelectItem>
            </SelectContent>
          </Select>

          <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
          <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <Button
            variant={commentStatus === 'unverified' ? 'default' : 'outline'}
            size="sm"
            onClick={toggleUnverifiedFilter}
            className="gap-1.5"
          >
            <Icon name="Circle" size={14} />
            Только непроверенные комментарии
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="gap-1.5"
          >
            <Icon name="X" size={14} />
            Сбросить фильтры
          </Button>
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
                <TableHead>Роль</TableHead>
                <TableHead>Комментарий</TableHead>
                <TableHead>Доверие</TableHead>
                <TableHead>Проверено</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Загрузка…</TableCell></TableRow>
              )}
              {!loading && items.length === 0 && (
                <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Ничего не найдено</TableCell></TableRow>
              )}
              {!loading && items.map((item, idx) => {
                const prevDay = idx > 0 ? (items[idx - 1].ratedAt ? new Date(items[idx - 1].ratedAt!).toDateString() : null) : null;
                const currDay = item.ratedAt ? new Date(item.ratedAt).toDateString() : null;
                const isNewDay = idx > 0 && currDay !== prevDay;
                return (
                <TableRow
                  key={item.id}
                  className={`cursor-pointer ${sentimentRowClass(item.sentiment)} ${isNewDay ? 'border-t-4 border-t-border' : ''}`}
                  onClick={() => setSelectedItem(item)}
                >
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
                  <TableCell className="text-sm">
                    {item.isPassenger === true && 'Пассажир'}
                    {item.isPassenger === false && 'Наблюдатель'}
                    {item.isPassenger === null && '—'}
                  </TableCell>
                  <TableCell className="max-w-[320px] text-sm text-muted-foreground">{item.comment || '—'}</TableCell>
                  <TableCell>
                    {item.trustLevel === 'low' && (
                      <Badge variant="destructive" className="gap-1 whitespace-nowrap">
                        <Icon name="ShieldX" size={12} />
                        Антифрод ICQR
                      </Badge>
                    )}
                    {item.trustLevel === 'medium' && (
                      <Badge variant="secondary" className="gap-1 whitespace-nowrap">
                        <Icon name="ShieldAlert" size={12} />
                        Есть отклонения
                      </Badge>
                    )}
                    {item.trustLevel === 'high' && (
                      <Badge variant="default" className="gap-1 whitespace-nowrap">
                        <Icon name="ShieldCheck" size={12} />
                        Проверено
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {item.comment ? (
                      <Button
                        variant={item.commentVerified ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 gap-1.5 whitespace-nowrap"
                        onClick={() => toggleVerified(item)}
                      >
                        <Icon name={item.commentVerified ? 'CheckCircle2' : 'Circle'} size={13} />
                        {item.commentVerified ? 'Проверено' : 'Проверить'}
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
                );
              })}
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

        <ReviewDetailDialog item={selectedItem} onClose={() => setSelectedItem(null)} />
          </TabsContent>

          <TabsContent value="moderation">
            <ModerationQueue />
          </TabsContent>

          <TabsContent value="sales">
            <SalesStats />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}