import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { AdminReviewItem } from '@/lib/adminApi';

const TRANSPORT_LABELS: Record<string, string> = {
  bus: 'Автобус',
  tram: 'Трамвай',
  trolley: 'Троллейбус',
};

const TRUST_BADGE: Record<'high' | 'medium' | 'low', { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: string }> = {
  high: { label: 'Проверено', variant: 'default', icon: 'ShieldCheck' },
  medium: { label: 'Есть отклонения', variant: 'secondary', icon: 'ShieldAlert' },
  low: { label: 'Антифрод ICQR', variant: 'destructive', icon: 'ShieldX' },
};

const TRUST_FLAG_LABELS: Record<string, string> = {
  possibly_not_passenger: 'ICQR: похоже, не пассажир (автоантифрод)',
  anti_fraud_reason: 'ICQR: сработал антифрод',
  far_from_vehicle_open: 'Далеко от транспорта при открытии страницы',
  far_from_vehicle_submit: 'Далеко от транспорта при отправке оценки',
  excessive_movement: 'Слишком большое перемещение между открытием и отправкой',
};

const NOT_COUNTED_LABELS: Record<string, string> = {
  inpad_success_without_rating: 'Черновик: переход из ИНПАДА без итоговой оценки',
};

function notCountedLabel(reason: string) {
  return NOT_COUNTED_LABELS[reason] ?? `Не учтено в рейтинге: ${reason}`;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ReviewDetailDialog({
  item,
  onClose,
}: {
  item: AdminReviewItem | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!item} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Отзыв {item ? `№${item.id}` : ''}</DialogTitle>
        </DialogHeader>

        {item && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Оценка</span>
              <span className="flex items-center gap-1 font-mono-num font-semibold">
                {item.rating} <Icon name="Star" size={14} className="text-amber-500" />
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Дата</span>
              <span>{formatDate(item.ratedAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Транспорт</span>
              <span>{item.transportType ? (TRANSPORT_LABELS[item.transportType] ?? item.transportType) : '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Маршрут</span>
              <span>{item.routeNumber ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Транспортное средство</span>
              <span>{item.vehicleNumber ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Остановки</span>
              <span className="text-right">
                {item.nearestStopName || item.stopToName
                  ? `${item.nearestStopName ?? ''}${item.nearestStopName && item.stopToName ? ' → ' : ''}${item.stopToName ?? ''}`
                  : '—'}
              </span>
            </div>

            {!!item.comment && (
              <div>
                <p className="mb-1 text-muted-foreground">Комментарий</p>
                <p className="rounded-lg bg-secondary p-3">{item.comment}</p>
              </div>
            )}

            {item.isObserver && (
              <div className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                <Icon name="Eye" size={13} className="shrink-0" />
                Пассажир указал в форме, что оценивает со стороны («наблюдатель вне транспорта»)
              </div>
            )}

            {item.notCountedReason && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                <Icon name="Info" size={13} className="shrink-0" />
                {notCountedLabel(item.notCountedReason)}
              </div>
            )}

            <div className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium">Проверка подлинности</p>
                <Badge variant={TRUST_BADGE[item.trustLevel].variant} className="gap-1">
                  <Icon name={TRUST_BADGE[item.trustLevel].icon} size={12} />
                  {TRUST_BADGE[item.trustLevel].label}
                </Badge>
              </div>

              {item.trustFlags.length > 0 && (
                <ul className="mb-2 space-y-1 text-xs text-muted-foreground">
                  {item.trustFlags.map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <Icon name="AlertTriangle" size={12} className="mt-0.5 shrink-0 text-amber-500" />
                      {TRUST_FLAG_LABELS[f] ?? f}
                    </li>
                  ))}
                </ul>
              )}

              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <span className="text-muted-foreground">Роль (декларация пассажира)</span>
                <span className="text-right">
                  {item.isPassenger === null ? '—' : item.isPassenger ? 'Пассажир' : 'Наблюдатель'}
                </span>
                <span className="text-muted-foreground">До ближайшей остановки</span>
                <span className="text-right">{item.nearestStopDistanceM != null ? `${item.nearestStopDistanceM} м` : '—'}</span>
                <span className="text-muted-foreground">До ТС при открытии</span>
                <span className="text-right">{item.transportOpenedDist != null ? `${item.transportOpenedDist} м` : '—'}</span>
                <span className="text-muted-foreground">До ТС при отправке</span>
                <span className="text-right">{item.transportSubmitDist != null ? `${item.transportSubmitDist} м` : '—'}</span>
                <span className="text-muted-foreground">Перемещение пассажира</span>
                <span className="text-right">{item.movementDistanceM != null ? `${Math.round(item.movementDistanceM)} м` : '—'}</span>
                <span className="text-muted-foreground">Оператор парка</span>
                <span className="text-right">{item.operatorTitle || '—'}</span>
                <span className="text-muted-foreground">IP пассажира</span>
                <span className="text-right font-mono-num">{item.ip || '—'}</span>
                {item.locationCode && (
                  <>
                    <span className="text-muted-foreground">Локация</span>
                    <span className="text-right">{item.locationCode}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}