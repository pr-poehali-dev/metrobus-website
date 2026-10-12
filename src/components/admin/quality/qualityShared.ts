import { QualityReason } from '@/lib/adminApi';

export const REASONS: { key: QualityReason; label: string; hint: string; color: string; bad: boolean }[] = [
  { key: 'ok', label: 'Оценка принята', hint: 'Ошибок нет, оценка поставлена', color: 'bg-transport-tram', bad: false },
  { key: 'draft', label: 'Открыл, но не оценил', hint: 'Переход из ИНПАДА без итоговой оценки', color: 'bg-muted-foreground', bad: false },
  { key: 'far', label: 'Далеко от маршрута', hint: 'Геопозиция есть, но дальше 300 м от маршрута', color: 'bg-destructive', bad: true },
  { key: 'no_geo', label: 'Геопозиция не получена', hint: 'Не дал доступ к геопозиции или она не определилась', color: 'bg-orange-500', bad: true },
  { key: 'not_found', label: 'Транспорт не найден', hint: 'Введён несуществующий или неактивный бортовой номер', color: 'bg-amber-400', bad: true },
  { key: 'other', label: 'Другое', hint: 'Прочие причины (например, маршрут не найден)', color: 'bg-purple-400', bad: true },
];
export const REASON_BY_KEY = Object.fromEntries(REASONS.map((r) => [r.key, r]));

export const BUCKETS: { key: string; label: string }[] = [
  { key: 'near', label: 'До 300 м (рядом с маршрутом)' },
  { key: 'm300_1k', label: '300 м – 1 км' },
  { key: 'k1_5', label: '1 – 5 км' },
  { key: 'k5_20', label: '5 – 20 км' },
  { key: 'k20_plus', label: 'Более 20 км' },
];

export const SOURCE_LABELS: Record<string, string> = {
  inpad: 'ИНПАД (ввод номера ТС)',
  'transport-card': 'Карточка транспорта',
  unknown: 'Неизвестно',
};

export function pct(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}

export function formatDist(m: number | null) {
  if (m === null || m === undefined) return '—';
  return m >= 1000 ? `${(m / 1000).toFixed(1)} км` : `${Math.round(m)} м`;
}
