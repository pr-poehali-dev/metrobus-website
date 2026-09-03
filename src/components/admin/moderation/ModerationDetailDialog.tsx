import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import {
  TRANSPORT_LABELS,
  STATUS_LABELS,
  STATUS_VARIANTS,
  TRUST_BADGE,
  formatDate,
  toBoolLike,
  computeTrust,
  notCountedLabel,
} from './moderationUtils';

interface ModerationDetailDialogProps {
  selected: Record<string, unknown> | null;
  detailLoading: boolean;
  note: string;
  setNote: (v: string) => void;
  actionLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onRunAction: (action: 'approve' | 'reject' | 'reset') => void;
}

export default function ModerationDetailDialog({
  selected,
  detailLoading,
  note,
  setNote,
  actionLoading,
  onOpenChange,
  onRunAction,
}: ModerationDetailDialogProps) {
  return (
    <Dialog open={!!selected || detailLoading} onOpenChange={onOpenChange}>
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
                        {isPassenger === null ? '—' : isPassenger ? 'Пассажир' : 'Пользователь'}
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
            onClick={() => onRunAction('reset')}
            className="gap-1.5"
          >
            <Icon name="RotateCcw" size={15} />
            Вернуть в очередь
          </Button>
          <Button
            variant="destructive"
            disabled={actionLoading || !selected}
            onClick={() => onRunAction('reject')}
            className="gap-1.5"
          >
            <Icon name="X" size={15} />
            Отклонить
          </Button>
          <Button
            disabled={actionLoading || !selected}
            onClick={() => onRunAction('approve')}
            className="gap-1.5"
          >
            <Icon name="Check" size={15} />
            Одобрить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
