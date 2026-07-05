// Демо-данные для первой версии дашборда.
// Позже заменяются на ответы API: /api/stats/summary, /api/stats/timeline, /api/stats/clusters

export type TransportType = 'bus' | 'tram' | 'trolley';

export interface Summary {
  average: number;
  prevAverage: number;
  monthCount: number;
  byType: { type: TransportType; label: string; average: number; count: number }[];
}

export const summary: Summary = {
  average: 4.32,
  prevAverage: 4.19,
  monthCount: 18742,
  byType: [
    { type: 'bus', label: 'Автобус', average: 4.28, count: 9640 },
    { type: 'tram', label: 'Трамвай', average: 4.51, count: 4820 },
    { type: 'trolley', label: 'Троллейбус', average: 4.17, count: 4282 },
  ],
};

// Оценки по дням календарного месяца
export function timelineFor(monthOffset: number): { day: number; value: number; count: number }[] {
  const days = 30;
  const base = 4.3 + monthOffset * 0.04;
  return Array.from({ length: days }, (_, i) => {
    const wave = Math.sin((i / days) * Math.PI * 2 + monthOffset) * 0.18;
    const noise = ((i * 7 + monthOffset * 13) % 11) / 100 - 0.05;
    return {
      day: i + 1,
      value: Math.max(3.6, Math.min(4.9, base + wave + noise)),
      count: 480 + ((i * 37 + monthOffset * 91) % 260),
    };
  });
}

export const months = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

export interface Cluster {
  key: string;
  label: string;
  icon: string;
  share: number;
  positive: boolean;
  examples: string[];
}

export const clusters: Cluster[] = [
  {
    key: 'delays', label: 'Опоздания', icon: 'Clock', share: 31, positive: false,
    examples: [
      'Ждал на остановке почти двадцать минут вместо обещанных пяти',
      'Расписание не совпадает с реальностью, транспорт приходит когда хочет',
      'Пришлось опоздать на работу из-за задержки',
    ],
  },
  {
    key: 'crowded', label: 'Переполненность', icon: 'Users', share: 24, positive: false,
    examples: [
      'В час пик невозможно зайти, набивается битком',
      'Ехал зажатым между людьми всю дорогу',
      'Не хватает вместимости на популярных направлениях',
    ],
  },
  {
    key: 'driver', label: 'Водитель', icon: 'UserCog', share: 19, positive: false,
    examples: [
      'Резко тормозил и трогался, чуть не упал',
      'Водитель проехал мимо остановки не притормозив',
      'Грубо ответил на вопрос про маршрут',
    ],
  },
  {
    key: 'clean', label: 'Чистота', icon: 'Sparkles', share: 14, positive: true,
    examples: [
      'Салон чистый, приятно ехать',
      'Новый транспорт, всё аккуратно и опрятно',
      'Видно, что за состоянием следят',
    ],
  },
  {
    key: 'positive', label: 'Позитив', icon: 'Smile', share: 12, positive: true,
    examples: [
      'Всё вовремя, доехал с комфортом',
      'Вежливый водитель, спокойная поездка',
      'Отличный маршрут, всем доволен',
    ],
  },
];
