import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import {
  fetchModerationList,
  fetchModerationItem,
  moderateRating,
  ModerationListItem,
} from '@/lib/adminApi';

const TRANSPORT_LABELS: Record<string, string> = {
  bus: 'Автобус',
  tram: 'Трамвай',
  trolley: 'Троллейбус',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'На модерации',
  approved: 'Одобрено',
  rejected: 'Отклонено',
};

const STATUS_VARIANTS: Record<string, 'secondary' | 'default' | 'destructive'> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ModerationQueue() {
  const { toast } = useToast();
  const [items, setItems] = useState<ModerationListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [routeNumber, setRouteNumber] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [note, setNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    const res = await fetchModerationList({
      status,
      routeNumber: routeNumber || undefined,
      page,
      perPage,
    });
    if (res === null) {
      setErrorMsg('unauthorized');
    } else if ('error' in res) {
      setErrorMsg(res.message || res.error);
    } else {
      setItems(res.items);
      setPagination(res.pagination);
    }
    setLoading(false);
  }, [status, routeNumber, page]);

  useEffect(() => {
    load();
  }, [load]);

  const openItem = async (id: number) => {
    setDetailLoading(true);
    setNote('');
    const res = await fetchModerationItem(id);
    setDetailLoading(false);
    if (res === null) {
      setErrorMsg('unauthorized');
      return;
    }
    if ('error' in res) {
      toast({ variant: 'destructive', title: 'Ошибка', description: res.message || res.error });
      return;
    }
    setSelected(res.item);
  };

  const runAction = async (action: 'approve' | 'reject' | 'reset') => {
    if (!selected) return;
    const id = selected.id as number;
    setActionLoading(true);
    const res = await moderateRating(id, action, note || undefined);
    setActionLoading(false);
    if (res === null) {
      setErrorMsg('unauthorized');
      return;
    }
    if ('error' in res) {
      toast({ variant: 'destructive', title: 'Ошибка', description: res.message || res.error });
      return;
    }
    toast({
      title: action === 'approve' ? 'Отзыв одобрен' : action === 'reject' ? 'Отзыв отклонён' : 'Отзыв возвращён в очередь',
    });
    setSelected(null);
    setItems((prev) => prev.filter((it) => it.id !== id));
    load();
  };

  const totalPages = Math.max(1, pagination.total_pages);

  if (errorMsg === 'unauthorized') {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Сессия истекла. Обновите страницу и войдите заново.
      </div>
    );
  }

  return (
    <div>
      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <Icon name="TriangleAlert" size={16} className="shrink-0" />
          <span>Ошибка ICQR API: {errorMsg}</span>
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Select value={status} onValueChange={(v) => { setStatus(v as typeof status); setPage(1); }}>
          <SelectTrigger><SelectValue placeholder="Статус" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">На модерации</SelectItem>
            <SelectItem value="approved">Одобренные</SelectItem>
            <SelectItem value="rejected">Отклонённые</SelectItem>
            <SelectItem value="all">Все</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative">
          <Icon name="Route" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={routeNumber}
            onChange={(e) => { setRouteNumber(e.target.value); setPage(1); }}
            placeholder="Фильтр по маршруту…"
            className="pl-9"
          />
        </div>

        <Button variant="outline" onClick={() => load()} className="gap-1.5">
          <Icon name="RefreshCw" size={14} />
          Обновить
        </Button>
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Оценка</TableHead>
              <TableHead>Транспорт</TableHead>
              <TableHead>Маршрут</TableHead>
              <TableHead>Остановки</TableHead>
              <TableHead>Комментарий</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Загрузка…</TableCell></TableRow>
            )}
            {!loading && items.length === 0 && !errorMsg && (
              <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Ничего не найдено</TableCell></TableRow>
            )}
            {!loading && items.map((item) => (
              <TableRow key={item.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => openItem(item.id)}>
                <TableCell className="whitespace-nowrap text-sm">{formatDate(item.created_at)}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1 font-mono-num font-semibold">
                    {item.rating}
                    <Icon name="Star" size={13} className="text-amber-500" />
                  </span>
                </TableCell>
                <TableCell className="text-sm">{item.transport_type ? (TRANSPORT_LABELS[item.transport_type] ?? item.transport_type) : '—'}</TableCell>
                <TableCell className="text-sm">{item.route_number ?? '—'}</TableCell>
                <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                  {item.nearest_stop_name || item.stop_to_name
                    ? `${item.nearest_stop_name ?? ''}${item.nearest_stop_name && item.stop_to_name ? ' → ' : ''}${item.stop_to_name ?? ''}`
                    : '—'}
                </TableCell>
                <TableCell className="max-w-[260px] truncate text-sm text-muted-foreground">{item.comment || '—'}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[item.moderation_status] ?? 'secondary'}>
                    {STATUS_LABELS[item.moderation_status] ?? item.moderation_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Страница {pagination.page} из {totalPages} · всего {pagination.total.toLocaleString('ru-RU')}</span>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <Icon name="ChevronLeft" size={15} />
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <Icon name="ChevronRight" size={15} />
          </Button>
        </div>
      </div>

      <Dialog open={!!selected || detailLoading} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Отзыв {selected ? `№${String(selected.id)}` : ''}</DialogTitle>
          </DialogHeader>

          {detailLoading && <div className="py-8 text-center text-muted-foreground">Загрузка…</div>}

          {selected && !detailLoading && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Оценка</span>
                <span className="flex items-center gap-1 font-mono-num font-semibold">
                  {String(selected.rating)} <Icon name="Star" size={14} className="text-amber-500" />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Статус</span>
                <Badge variant={STATUS_VARIANTS[String(selected.moderation_status)] ?? 'secondary'}>
                  {STATUS_LABELS[String(selected.moderation_status)] ?? String(selected.moderation_status)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Дата</span>
                <span>{formatDate(String(selected.created_at ?? ''))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Транспорт</span>
                <span>{selected.transport_type ? (TRANSPORT_LABELS[String(selected.transport_type)] ?? String(selected.transport_type)) : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Маршрут</span>
                <span>{String(selected.route_number ?? '—')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Транспортное средство</span>
                <span>{String(selected.vehicle_number ?? '—')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Направление</span>
                <span>{String(selected.direction ?? '—')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Остановки</span>
                <span className="text-right">
                  {selected.nearest_stop_name || selected.stop_to_name
                    ? `${selected.nearest_stop_name ?? ''}${selected.nearest_stop_name && selected.stop_to_name ? ' → ' : ''}${selected.stop_to_name ?? ''}`
                    : '—'}
                </span>
              </div>
              {!!selected.comment && (
                <div>
                  <p className="mb-1 text-muted-foreground">Комментарий</p>
                  <p className="rounded-lg bg-secondary p-3">{String(selected.comment)}</p>
                </div>
              )}

              <div>
                <p className="mb-1 text-muted-foreground">Заметка модератора (необязательно)</p>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Причина решения…" />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              disabled={actionLoading || !selected}
              onClick={() => runAction('reset')}
              className="gap-1.5"
            >
              <Icon name="RotateCcw" size={15} />
              Вернуть в очередь
            </Button>
            <Button
              variant="destructive"
              disabled={actionLoading || !selected}
              onClick={() => runAction('reject')}
              className="gap-1.5"
            >
              <Icon name="X" size={15} />
              Отклонить
            </Button>
            <Button
              disabled={actionLoading || !selected}
              onClick={() => runAction('approve')}
              className="gap-1.5"
            >
              <Icon name="Check" size={15} />
              Одобрить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
