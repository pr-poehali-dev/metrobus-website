import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import {
  fetchModerationList,
  fetchModerationItem,
  moderateRating,
  ModerationListItem,
} from '@/lib/adminApi';
import ModerationFilters from './moderation/ModerationFilters';
import ModerationTable from './moderation/ModerationTable';
import ModerationDetailDialog from './moderation/ModerationDetailDialog';
import { toBoolLike } from './moderation/moderationUtils';

export default function ModerationQueue() {
  const { toast } = useToast();
  const [items, setItems] = useState<ModerationListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [routeNumber, setRouteNumber] = useState('');
  const [role, setRole] = useState<'all' | 'passenger' | 'observer'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const todayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const showToday = () => {
    const t = todayStr();
    setDateFrom(t);
    setDateTo(t);
    setPage(1);
  };

  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

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
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
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
  }, [status, routeNumber, dateFrom, dateTo, page]);

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

      <ModerationFilters
        status={status}
        setStatus={(v) => { setStatus(v); setPage(1); }}
        role={role}
        setRole={(v) => { setRole(v); setPage(1); }}
        routeNumber={routeNumber}
        setRouteNumber={(v) => { setRouteNumber(v); setPage(1); }}
        dateFrom={dateFrom}
        setDateFrom={(v) => { setDateFrom(v); setPage(1); }}
        dateTo={dateTo}
        setDateTo={(v) => { setDateTo(v); setPage(1); }}
        onReload={() => load()}
        onShowToday={showToday}
        onClearDateFilter={clearDateFilter}
      />

      <ModerationTable
        items={filteredItems}
        loading={loading}
        errorMsg={errorMsg}
        onOpenItem={openItem}
        pagination={pagination}
        totalPages={totalPages}
        page={page}
        setPage={setPage}
      />

      <ModerationDetailDialog
        selected={selected}
        detailLoading={detailLoading}
        note={note}
        setNote={setNote}
        actionLoading={actionLoading}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
        onRunAction={runAction}
      />
    </div>
  );
}