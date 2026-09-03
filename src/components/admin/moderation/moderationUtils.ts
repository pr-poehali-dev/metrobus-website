export const TRANSPORT_LABELS: Record<string, string> = {
  bus: 'Автобус',
  tram: 'Трамвай',
  trolley: 'Троллейбус',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'На модерации',
  approved: 'Одобрено',
  rejected: 'Отклонено',
};

export const STATUS_VARIANTS: Record<string, 'secondary' | 'default' | 'destructive'> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
};

export function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function toBoolLike(v: unknown): boolean | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  return null;
}

export interface TrustCheck {
  level: 'high' | 'medium' | 'low';
  reasons: string[];
}

const NOT_COUNTED_LABELS: Record<string, string> = {
  inpad_success_without_rating: 'Черновик: переход из ИНПАДА без итоговой оценки',
};

export function notCountedLabel(reason: string) {
  return NOT_COUNTED_LABELS[reason] ?? `Не учтено в рейтинге: ${reason}`;
}

export function computeTrust(item: Record<string, unknown>): TrustCheck {
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

export const TRUST_BADGE: Record<TrustCheck['level'], { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: string }> = {
  high: { label: 'Проверено', variant: 'default', icon: 'ShieldCheck' },
  medium: { label: 'Есть отклонения', variant: 'secondary', icon: 'ShieldAlert' },
  low: { label: 'Антифрод ICQR', variant: 'destructive', icon: 'ShieldX' },
};
