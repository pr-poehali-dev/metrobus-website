// Демонстрационные данные для дашборда перевозчика.
// Полностью вымышлены и не отражают реальные показатели парка.

import { MultiPoint } from '@/components/metrobus/RatingChart';

export const carrierDemoSummary = {
  fleetName: 'ГУП «Горэлектротранс» (демо-парк)',
  average: 4.24,
  prevAverage: 4.11,
  monthCount: 6318,
  vehiclesCount: 142,
  cityRank: 2,
  cityRankTotal: 6,
};

export const carrierDemoByType = [
  { type: 'bus' as const, label: 'Автобус', average: 4.12, count: 2840 },
  { type: 'tram' as const, label: 'Трамвай', average: 4.46, count: 1975 },
  { type: 'trolley' as const, label: 'Троллейбус', average: 4.09, count: 1503 },
];

export function carrierDemoTimeline(): MultiPoint[] {
  const days = 30;
  return Array.from({ length: days }, (_, i) => {
    const wave = Math.sin((i / days) * Math.PI * 2) * 0.16;
    const bus = 4.05 + wave + ((i * 7) % 9) / 100;
    const tram = 4.4 + Math.sin((i / days) * Math.PI * 2 + 1) * 0.12 + ((i * 5) % 7) / 100;
    const trolley = 4.0 + Math.sin((i / days) * Math.PI * 2 + 2) * 0.14 + ((i * 3) % 8) / 100;
    return {
      day: i + 1,
      bus: Math.round(Math.max(3.6, Math.min(4.9, bus)) * 100) / 100,
      tram: Math.round(Math.max(3.6, Math.min(4.9, tram)) * 100) / 100,
      trolley: Math.round(Math.max(3.6, Math.min(4.9, trolley)) * 100) / 100,
      busCount: 70 + ((i * 11) % 40),
      tramCount: 55 + ((i * 9) % 30),
      trolleyCount: 40 + ((i * 13) % 25),
    };
  });
}

export interface CarrierRouteRow {
  route: string;
  type: 'bus' | 'tram' | 'trolley';
  average: number;
  count: number;
  trend: number;
}

export const carrierDemoRoutes: CarrierRouteRow[] = [
  { route: '128', type: 'bus', average: 3.62, count: 412, trend: -0.21 },
  { route: '12', type: 'trolley', average: 3.71, count: 288, trend: -0.14 },
  { route: '56', type: 'bus', average: 3.89, count: 355, trend: 0.05 },
  { route: '3', type: 'tram', average: 4.58, count: 501, trend: 0.18 },
  { route: '90', type: 'bus', average: 4.41, count: 274, trend: 0.11 },
  { route: '17', type: 'trolley', average: 4.52, count: 198, trend: 0.09 },
];

export const carrierDemoClusters = [
  {
    key: 'delays', label: 'Опоздания', icon: 'Clock', share: 34, positive: false,
    examples: [
      'Маршрут 128 постоянно задерживается в час пик',
      'Троллейбус 12 не пришёл по расписанию два раза за неделю',
    ],
  },
  {
    key: 'crowded', label: 'Переполненность', icon: 'Users', share: 21, positive: false,
    examples: [
      'В автобусе 56 вечером не хватает мест',
      'На маршруте 128 давка в час пик',
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
      'Водитель автобуса 90 очень вежливый',
      'Трамвай 3 — лучший маршрут по комфорту',
    ],
  },
];
