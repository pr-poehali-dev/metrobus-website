// Демонстрационные данные для дашборда перевозчика.
// Полностью вымышлены и не отражают реальные показатели парка.
// ГУП «Горэлектротранс» эксплуатирует только трамваи и троллейбусы.
// Два набора (passengers/observers) иллюстрируют разделение оценок поездок и оценок маршрутов.

import { MultiPoint } from '@/components/metrobus/RatingChart';
import { ViewMode } from '@/components/metrobus/ViewModeToggle';

const summaryByMode = {
  passengers: {
    fleetName: 'ГУП «Горэлектротранс»',
    average: 4.28,
    prevAverage: 4.14,
    monthCount: 3478,
    vehiclesCount: 96,
    cityRank: 2,
    cityRankTotal: 6,
  },
  observers: {
    fleetName: 'ГУП «Горэлектротранс»',
    average: 3.92,
    prevAverage: 4.01,
    monthCount: 214,
    vehiclesCount: 96,
    cityRank: 3,
    cityRankTotal: 6,
  },
};

export function carrierDemoSummary(mode: ViewMode) {
  return summaryByMode[mode];
}

const byTypeByMode = {
  passengers: [
    { type: 'tram' as const, label: 'Трамвай', average: 4.46, count: 1975 },
    { type: 'trolley' as const, label: 'Троллейбус', average: 4.09, count: 1503 },
  ],
  observers: [
    { type: 'tram' as const, label: 'Трамвай', average: 4.02, count: 128 },
    { type: 'trolley' as const, label: 'Троллейбус', average: 3.79, count: 86 },
  ],
};

export function carrierDemoByType(mode: ViewMode) {
  return byTypeByMode[mode];
}

export function carrierDemoTimeline(mode: ViewMode): MultiPoint[] {
  const days = 30;
  const baseTram = mode === 'passengers' ? 4.4 : 4.0;
  const baseTrolley = mode === 'passengers' ? 4.0 : 3.75;
  const countScale = mode === 'passengers' ? 1 : 0.06;
  return Array.from({ length: days }, (_, i) => {
    const tram = baseTram + Math.sin((i / days) * Math.PI * 2 + 1) * 0.12 + ((i * 5) % 7) / 100;
    const trolley = baseTrolley + Math.sin((i / days) * Math.PI * 2 + 2) * 0.14 + ((i * 3) % 8) / 100;
    return {
      day: i + 1,
      bus: null,
      tram: Math.round(Math.max(3.4, Math.min(4.9, tram)) * 100) / 100,
      trolley: Math.round(Math.max(3.4, Math.min(4.9, trolley)) * 100) / 100,
      busCount: 0,
      tramCount: Math.round((55 + ((i * 9) % 30)) * countScale),
      trolleyCount: Math.round((40 + ((i * 13) % 25)) * countScale),
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

const routesByMode: Record<ViewMode, CarrierRouteRow[]> = {
  passengers: [
    { route: '12', type: 'trolley', average: 3.71, count: 288, trend: -0.14 },
    { route: '8', type: 'trolley', average: 3.84, count: 231, trend: -0.09 },
    { route: '3', type: 'tram', average: 4.58, count: 501, trend: 0.18 },
    { route: '17', type: 'trolley', average: 4.52, count: 198, trend: 0.09 },
    { route: '9', type: 'tram', average: 4.33, count: 316, trend: 0.06 },
  ],
  observers: [
    { route: '12', type: 'trolley', average: 3.4, count: 19, trend: -0.21 },
    { route: '8', type: 'trolley', average: 3.6, count: 14, trend: -0.05 },
    { route: '3', type: 'tram', average: 4.1, count: 22, trend: 0.08 },
    { route: '17', type: 'trolley', average: 4.2, count: 11, trend: 0.02 },
    { route: '9', type: 'tram', average: 3.95, count: 17, trend: 0.03 },
  ],
};

export function carrierDemoRoutes(mode: ViewMode) {
  return routesByMode[mode];
}

const clustersByMode = {
  // Поездки — впечатления от конкретной поездки: салон, водитель, комфорт
  passengers: [
    {
      key: 'clean', label: 'Чистота', icon: 'Sparkles', share: 34, positive: true,
      examples: [
        'Трамвай был чистым и ухоженным',
        'В троллейбусе приятно находиться — салон в порядке',
      ],
    },
    {
      key: 'driver', label: 'Манера вождения', icon: 'UserCog', share: 29, positive: false,
      examples: [
        'Водитель вёл машину аккуратно и вежливо',
        'Резкое торможение на повороте — неприятно',
      ],
    },
    {
      key: 'positive', label: 'Позитив', icon: 'Smile', share: 37, positive: true,
      examples: [
        'Комфортная и спокойная поездка',
        'Один из лучших маршрутов по уровню комфорта',
      ],
    },
  ],
  // Маршруты — системные проблемы: расписание и достаточность транспорта на линии
  observers: [
    {
      key: 'delays', label: 'Опоздания', icon: 'Clock', share: 51, positive: false,
      examples: [
        'Транспорт не пришёл по расписанию',
        'Между рейсами бывают долгие интервалы',
      ],
    },
    {
      key: 'crowded', label: 'Переполненность', icon: 'Users', share: 27, positive: false,
      examples: [
        'Вечером в салоне не хватает мест',
        'В час пик на маршруте настоящая давка',
      ],
    },
    {
      key: 'positive', label: 'Позитив', icon: 'Smile', share: 22, positive: true,
      examples: [
        'Интервалы движения стали соблюдаться точнее',
        'Транспорт в целом стал ходить по расписанию',
      ],
    },
  ],
};

export function carrierDemoClusters(mode: ViewMode) {
  return clustersByMode[mode];
}