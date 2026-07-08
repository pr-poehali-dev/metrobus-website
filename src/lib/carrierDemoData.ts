// Демонстрационные данные для дашборда перевозчика.
// Полностью вымышлены и не отражают реальные показатели парка.
// ГУП «Горэлектротранс» эксплуатирует только трамваи и троллейбусы.

import { MultiPoint } from '@/components/metrobus/RatingChart';

export const carrierDemoSummary = {
  fleetName: 'ГУП «Горэлектротранс»',
  average: 4.28,
  prevAverage: 4.14,
  monthCount: 3478,
  vehiclesCount: 96,
  cityRank: 2,
  cityRankTotal: 6,
};

export const carrierDemoByType = [
  { type: 'tram' as const, label: 'Трамвай', average: 4.46, count: 1975 },
  { type: 'trolley' as const, label: 'Троллейбус', average: 4.09, count: 1503 },
];

export function carrierDemoTimeline(): MultiPoint[] {
  const days = 30;
  return Array.from({ length: days }, (_, i) => {
    const tram = 4.4 + Math.sin((i / days) * Math.PI * 2 + 1) * 0.12 + ((i * 5) % 7) / 100;
    const trolley = 4.0 + Math.sin((i / days) * Math.PI * 2 + 2) * 0.14 + ((i * 3) % 8) / 100;
    return {
      day: i + 1,
      bus: null,
      tram: Math.round(Math.max(3.6, Math.min(4.9, tram)) * 100) / 100,
      trolley: Math.round(Math.max(3.6, Math.min(4.9, trolley)) * 100) / 100,
      busCount: 0,
      tramCount: 55 + ((i * 9) % 30),
      trolleyCount: 40 + ((i * 13) % 25),
    };
  });
}

export interface CarrierRouteRow {
  route: string;
  type: 'tram' | 'trolley';
  average: number;
  count: number;
  trend: number;
}

export const carrierDemoRoutes: CarrierRouteRow[] = [
  { route: '12', type: 'trolley', average: 3.71, count: 288, trend: -0.14 },
  { route: '8', type: 'trolley', average: 3.84, count: 231, trend: -0.09 },
  { route: '3', type: 'tram', average: 4.58, count: 501, trend: 0.18 },
  { route: '17', type: 'trolley', average: 4.52, count: 198, trend: 0.09 },
  { route: '9', type: 'tram', average: 4.33, count: 316, trend: 0.06 },
];

export const carrierDemoClusters = [
  {
    key: 'delays', label: 'Опоздания', icon: 'Clock', share: 34, positive: false,
    examples: [
      'Троллейбус 12 не пришёл по расписанию два раза за неделю',
      'На маршруте 8 бывают долгие интервалы между рейсами',
    ],
  },
  {
    key: 'crowded', label: 'Переполненность', icon: 'Users', share: 21, positive: false,
    examples: [
      'В трамвае 9 вечером не хватает мест',
      'На маршруте 12 давка в час пик',
    ],
  },
  {
    key: 'clean', label: 'Чистота', icon: 'Sparkles', share: 18, positive: true,
    examples: [
      'Трамвай 3 всегда чистый и опрятный',
      'Новые троллейбусы на 17 маршруте радуют',
    ],
  },
  {
    key: 'positive', label: 'Позитив', icon: 'Smile', share: 27, positive: true,
    examples: [
      'Водитель трамвая 3 очень вежливый',
      'Трамвай 3 — лучший маршрут по комфорту',
    ],
  },
];