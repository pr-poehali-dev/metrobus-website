import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { ModerationListItem } from '@/lib/adminApi';
import {
  TRANSPORT_LABELS,
  STATUS_LABELS,
  STATUS_VARIANTS,
  TRUST_BADGE,
  formatDate,
  toBoolLike,
  computeTrust,
} from './moderationUtils';

interface ModerationPagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

interface ModerationTableProps {
  items: ModerationListItem[];
  loading: boolean;
  errorMsg: string | null;
  onOpenItem: (id: number) => void;
  pagination: ModerationPagination;
  totalPages: number;
  page: number;
  setPage: (updater: (p: number) => number) => void;
}

export default function ModerationTable({
  items,
  loading,
  errorMsg,
  onOpenItem,
  pagination,
  totalPages,
  page,
  setPage,
}: ModerationTableProps) {
  return (
    <>
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
            {!loading && items.length === 0 && !errorMsg && (
              <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">Ничего не найдено</TableCell></TableRow>
            )}
            {!loading && items.map((item, idx) => {
              const trust = computeTrust(item as unknown as Record<string, unknown>);
              const trustBadge = TRUST_BADGE[trust.level];
              const isPassenger = toBoolLike(item.is_passanger);
              const prevDay = idx > 0 ? new Date(items[idx - 1].created_at).toDateString() : null;
              const currDay = new Date(item.created_at).toDateString();
              const isNewDay = idx > 0 && currDay !== prevDay;
              return (
              <TableRow
                key={item.id}
                className={`cursor-pointer hover:bg-secondary/50 ${isNewDay ? 'border-t-4 border-t-border' : ''}`}
                onClick={() => onOpenItem(item.id)}
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
                  {isPassenger === false && 'Пользователь'}
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
    </>
  );
}
