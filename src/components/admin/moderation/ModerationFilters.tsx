import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface ModerationFiltersProps {
  status: 'pending' | 'approved' | 'rejected' | 'all';
  setStatus: (v: 'pending' | 'approved' | 'rejected' | 'all') => void;
  role: 'all' | 'passenger' | 'observer';
  setRole: (v: 'all' | 'passenger' | 'observer') => void;
  routeNumber: string;
  setRouteNumber: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  onReload: () => void;
  onShowToday: () => void;
  onClearDateFilter: () => void;
  loading: boolean;
  totalPages: number;
  onGoToLastPage: () => void;
}

export default function ModerationFilters({
  status,
  setStatus,
  role,
  setRole,
  routeNumber,
  setRouteNumber,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  onReload,
  onShowToday,
  onClearDateFilter,
  loading,
  totalPages,
  onGoToLastPage,
}: ModerationFiltersProps) {
  return (
    <>
      <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger><SelectValue placeholder="Статус" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">На модерации</SelectItem>
            <SelectItem value="approved">Одобренные</SelectItem>
            <SelectItem value="rejected">Отклонённые</SelectItem>
            <SelectItem value="all">Все</SelectItem>
          </SelectContent>
        </Select>

        <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
          <SelectTrigger><SelectValue placeholder="Роль" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Пассажир и пользователь</SelectItem>
            <SelectItem value="passenger">Пассажир</SelectItem>
            <SelectItem value="observer">Пользователь</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative">
          <Icon name="Route" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={routeNumber}
            onChange={(e) => setRouteNumber(e.target.value)}
            placeholder="Фильтр по маршруту…"
            className="pl-9"
          />
        </div>

        <Button variant="outline" onClick={onReload} className="gap-1.5">
          <Icon name="RefreshCw" size={14} />
          Обновить
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-auto"
        />
        <span className="text-sm text-muted-foreground">—</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-auto"
        />
        <Button variant="secondary" size="sm" onClick={onShowToday} className="gap-1.5">
          <Icon name="CalendarDays" size={14} />
          Сегодня
        </Button>
        {(dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={onClearDateFilter} className="gap-1.5 text-muted-foreground">
            <Icon name="X" size={14} />
            Сбросить даты
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          Очередь ICQR отсортирована от старых к новым — новые записи на последних страницах
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={loading || totalPages <= 1}
          onClick={onGoToLastPage}
          className="gap-1.5"
        >
          <Icon name="ChevronsRight" size={14} />
          В конец (новые)
        </Button>
      </div>
    </>
  );
}
