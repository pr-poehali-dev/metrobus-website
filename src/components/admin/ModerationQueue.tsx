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

function toBoolLike(v: unknown): boolean | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  return null;
}

interface TrustCheck {
  level: 'high' | 'medium' | 'low';
  reasons: string[];
}

const NOT_COUNTED_LABELS: Record<string, string> = {
  inpad_success_without_rating: 'Черновик: переход из ИНПАДА без итоговой оценки',
};

function notCountedLabel(reason: string) {
  return NOT_COUNTED_LABELS[reason] ?? `Не учтено в рейтинге: ${reason}`;
}

function computeTrust(item: Record<string, unknown>): TrustCheck {
  const reasons: string[] = [];
  // possibly_not_passenger и anti_fraud_reason — официальные антифрод-поля ICQR (пока не заполняются их кодом,
  // но это правильное место для будущей логики). result_false / is_passanger=0 — это НЕ признаки накрутки:
  // result_false объясняет, почему оценка не пошла в рейтинг (далеко от маршрута и т.п.), а is_passanger=0 —
  // легитимный выбор пассажира «Я наблюдатель вне транспорта».
  const possiblyNotPassenger = toBoolLike(item.possibly_not_passenger);
  const antiFraudReason = item.anti_fraud_reason as string | null;
  const openedDist = item.transport_opened_dist as number | null;
  const submitDist = item.transport_submit_dist as number | null;

  if (antiFraudReason) reasons.push(`ICQR: сработал антифрод (${antiFraudReason})`);
  if (possiblyNotPassenger) reasons.push('ICQR: похоже, не пассажир (автоантифрод)');
  if (typeof openedDist === 'number' && openedDist > 300) reasons.push(`Далеко от ТС при открытии (${openedDist} м)`);
  if (typeof submitDist === 'number' && submitDist > 300) reasons.push(`Далеко от ТС при отправке (${submitDist} м)`);

  if (possiblyNotPassenger || antiFraudReason) return { level: 'low', reasons };
  if (reasons.length === 0) return { level: 'high', reasons: [] };
  return { level: 'medium', reasons };
}

const TRUST_BADGE: Record<TrustCheck['level'], { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: string }> = {
  high: { label: 'Проверено', variant: 'default', icon: 'ShieldCheck' },
  medium: { label: 'Есть отклонения', variant: 'secondary', icon: 'ShieldAlert' },
  low: { label: 'Антифрод ICQR', variant: 'destructive', icon: 'ShieldX' },
};

export default function ModerationQueue() {
  const { toast } = useToast();
  const [items, setItems] = useState<ModerationListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [routeNumber, setRouteNumber] = useState('');
  const [role, setRole] = useState<'all' | 'passenger' | 'observer'>('all');
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

  const filteredItems = items.filter((item) => {
    if (role === 'all') return true;
    const isPassenger = toBoolLike(item.is_passanger);
    if (role === 'passenger') return isPassenger === true;
    return isPassenger === false;
  });

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

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={status} onValueChange={(v) => { setStatus(v as typeof status); setPage(1); }}>
          <SelectTrigger><SelectValue placeholder="Статус" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">На модерации</SelectItem>
            <SelectItem value="approved">Одобренные</SelectItem>
            <SelectItem value="rejected">Отклонённые</SelectItem>
            <SelectItem value="all">Все</SelectItem>
          </SelectContent>
        </Select>

        <Select value={role} onValueChange={(v) => { setRole(v as typeof role); setPage(1); }}>
          <SelectTrigger><SelectValue placeholder="Роль" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Пассажир и наблюдатель</SelectItem>
            <SelectItem value="passenger">Пассажир</SelectItem>
            <SelectItem value="observer">Наблюдатель</SelectItem>
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
              <TableHead>Роль</TableHead>
              <TableHead>Комментарий</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Доверие</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">Загрузка…</TableCell></TableRow>
            )}
            {!loading && filteredItems.length === 0 && !errorMsg && (
              <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">Ничего не найдено</TableCell></TableRow>
            )}
            {!loading && filteredItems.map((item, idx) => {
              const trust = computeTrust(item as unknown as Record<string, unknown>);
              const trustBadge = TRUST_BADGE[trust.level];
              const isPassenger = toBoolLike(item.is_passanger);
              const prevDay = idx > 0 ? new Date(filteredItems[idx - 1].created_at).toDateString() : null;
              const currDay = new Date(item.created_at).toDateString();
              const isNewDay = idx > 0 && currDay !== prevDay;
              return (
              <TableRow
                key={item.id}
                className={`cursor-pointer hover:bg-secondary/50 ${isNewDay ? 'border-t-4 border-t-border' : ''}`}
                onClick={() => openItem(item.id)}
              >
                <TableCell className="whitespace-nowrap text-sm">{formatDate(item.created_at)}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1 font-mono-num font-semibold">
                    {item.rating}
                    <Icon name="Star" size={13} className="text-amber-500" />
                  </span>
                </TableCell>
                <TableCell className="text-sm">{item.transport_type ? (TRANSPORT_LABELS[item.transport_type] ?? item.transport_type) : '—'}</TableCell>
                <TableCell className="text-sm">{item.route_number ?? '—'}</TableCell>
                <TableCell className="text-sm">
                  {isPassenger === true && 'Пассажир'}
                  {isPassenger === false && 'Наблюдатель'}
                  {isPassenger === null && '—'}
                </TableCell>
                <TableCell className="max-w-[260px] truncate text-sm text-muted-foreground">{item.comment || '—'}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[item.moderation_status] ?? 'secondary'}>
                    {STATUS_LABELS[item.moderation_status] ?? item.moderation_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={trustBadge.variant} className="gap-1 whitespace-nowrap">
                    <Icon name={trustBadge.icon} size={12} />
                    {trustBadge.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                </TableCell>
              </TableRow>
              );
            })}
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

              {(() => {
                const trust = computeTrust(selected);
                const trustBadge = TRUST_BADGE[trust.level];
                const isPassenger = toBoolLike(selected.is_passanger);
                const resultFalse = selected.result_false as string | null;
                const openedDist = selected.transport_opened_dist as number | null;
                const submitDist = selected.transport_submit_dist as number | null;
                const operatorTitle = selected.operator_title as string | null;
                const ip = selected.ip as string | null;
                const isModerated = String(selected.moderation_status) !== 'pending';

                return (
                  <>
                    {isPassenger === false && (
                      <div className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                        <Icon name="Eye" size={13} className="shrink-0" />
                        Пассажир указал в форме, что оценивает со стороны («наблюдатель вне транспорта»)
                      </div>
                    )}
                    {!!resultFalse && (
                      <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                        <Icon name="Info" size={13} className="shrink-0" />
                        {notCountedLabel(resultFalse)}
                      </div>
                    )}

                    <div className="rounded-lg border border-border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-medium">Проверка подлинности</p>
                        <Badge variant={trustBadge.variant} className="gap-1">
                          <Icon name={trustBadge.icon} size={12} />
                          {trustBadge.label}
                        </Badge>
                      </div>

                      {trust.reasons.length > 0 && (
                        <ul className="mb-2 space-y-1 text-xs text-muted-foreground">
                          {trust.reasons.map((r, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <Icon name="AlertTriangle" size={12} className="mt-0.5 shrink-0 text-amber-500" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                        <span className="text-muted-foreground">Роль (декларация пассажира)</span>
                        <span className="text-right">
                          {isPassenger === null ? '—' : isPassenger ? 'Пассажир' : 'Наблюдатель'}
                        </span>
                        <span className="text-muted-foreground">До ТС при открытии</span>
                        <span className="text-right">{typeof openedDist === 'number' ? `${openedDist} м` : '—'}</span>
                        <span className="text-muted-foreground">До ТС при отправке</span>
                        <span className="text-right">{typeof submitDist === 'number' ? `${submitDist} м` : '—'}</span>
                        {isModerated && (
                          <>
                            <span className="text-muted-foreground">Оператор парка</span>
                            <span className="text-right">{operatorTitle || '—'}</span>
                            <span className="text-muted-foreground">IP пассажира</span>
                            <span className="text-right font-mono-num">{ip || '—'}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}

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