// Демонстрационные данные для кабинета заказчика (регулятора).
// Полностью вымышлены и не отражают реальные показатели города.
// В отличие от кабинета перевозчика, здесь сводная картина по ВСЕМ видам транспорта и ВСЕМ перевозчикам города.

import { MultiPoint } from '@/components/metrobus/RatingChart';
import { ViewMode } from '@/components/metrobus/ViewModeToggle';

const summaryByMode = {
  passengers: {
    cityName: 'Санкт-Петербург',
    average: 4.21,
    prevAverage: 4.09,
    monthCount: 18642,
    carriersCount: 6,
    routesCount: 214,
  },
  observers: {
    cityName: 'Санкт-Петербург',
    average: 3.87,
    prevAverage: 3.95,
    monthCount: 1103,
    carriersCount: 6,
    routesCount: 214,
  },
};

export function regulatorDemoSummary(mode: ViewMode) {
  return summaryByMode[mode];
}

const byTypeByMode = {
  passengers: [
    { type: 'bus' as const, label: 'Автобус', average: 4.11, count: 9820 },
    { type: 'trolley' as const, label: 'Троллейбус', average: 4.09, count: 3698 },
    { type: 'tram' as const, label: 'Трамвай', average: 4.46, count: 5124 },
  ],
  observers: [
    { type: 'bus' as const, label: 'Автобус', average: 3.74, count: 612 },
    { type: 'trolley' as const, label: 'Троллейбус', average: 3.79, count: 173 },
    { type: 'tram' as const, label: 'Трамвай', average: 4.02, count: 318 },
  ],
};

export function regulatorDemoByType(mode: ViewMode) {
  return byTypeByMode[mode];
}

export function regulatorDemoTimeline(mode: ViewMode): MultiPoint[] {
  const days = 30;
  const baseBus = mode === 'passengers' ? 4.1 : 3.7;
  const baseTram = mode === 'passengers' ? 4.4 : 4.0;
  const baseTrolley = mode === 'passengers' ? 4.0 : 3.75;
  const countScale = mode === 'passengers' ? 1 : 0.06;
  return Array.from({ length: days }, (_, i) => {
    const bus = baseBus + Math.sin((i / days) * Math.PI * 2) * 0.1 + ((i * 7) % 6) / 100;
    const tram = baseTram + Math.sin((i / days) * Math.PI * 2 + 1) * 0.12 + ((i * 5) % 7) / 100;
    const trolley = baseTrolley + Math.sin((i / days) * Math.PI * 2 + 2) * 0.14 + ((i * 3) % 8) / 100;
    return {
      day: i + 1,
      bus: Math.round(Math.max(3.4, Math.min(4.9, bus)) * 100) / 100,
      tram: Math.round(Math.max(3.4, Math.min(4.9, tram)) * 100) / 100,
      trolley: Math.round(Math.max(3.4, Math.min(4.9, trolley)) * 100) / 100,
      busCount: Math.round((280 + ((i * 11) % 60)) * countScale),
      tramCount: Math.round((160 + ((i * 9) % 30)) * countScale),
      trolleyCount: Math.round((110 + ((i * 13) % 25)) * countScale),
    };
  });
}

export interface RegulatorCarrierRow {
  carrier: string;
  routesCount: number;
  average: number;
  count: number;
  trend: number;
}

const carriersByMode: Record<ViewMode, RegulatorCarrierRow[]> = {
  passengers: [
    { carrier: 'ГУП «Пассажиравтотранс»', routesCount: 96, average: 3.92, count: 6210, trend: -0.05 },
    { carrier: 'ООО «Питеравто»', routesCount: 41, average: 3.98, count: 2140, trend: -0.02 },
    { carrier: 'ГУП «Горэлектротранс»', routesCount: 58, average: 4.28, count: 3478, trend: 0.14 },
    { carrier: 'ООО «Третий парк»', routesCount: 12, average: 4.41, count: 980, trend: 0.07 },
    { carrier: 'СПб ГУП «Пассажиравтотранс-2»', routesCount: 7, average: 3.65, count: 512, trend: -0.11 },
  ],
  observers: [
    { carrier: 'ГУП «Пассажиравтотранс»', routesCount: 96, average: 3.61, count: 402, trend: -0.09 },
    { carrier: 'ООО «Питеравто»', routesCount: 41, average: 3.7, count: 156, trend: -0.03 },
    { carrier: 'ГУП «Горэлектротранс»', routesCount: 58, average: 3.92, count: 214, trend: 0.08 },
    { carrier: 'ООО «Третий парк»', routesCount: 12, average: 4.05, count: 61, trend: 0.02 },
    { carrier: 'СПб ГУП «Пассажиравтотранс-2»', routesCount: 7, average: 3.4, count: 40, trend: -0.15 },
  ],
};

export function regulatorDemoCarriers(mode: ViewMode) {
  return carriersByMode[mode];
}

const clustersByMode = {
  // Поездки — впечатления от конкретной поездки: салон, водитель, комфорт
  passengers: [
    {
      key: 'clean', label: 'Чистота', icon: 'Sparkles', share: 30, positive: true,
      examples: [
        'Салон был чистым и ухоженным',
        'Новый транспорт радует состоянием салона',
      ],
    },
    {
      key: 'driver', label: 'Манера вождения', icon: 'UserCog', share: 27, positive: false,
      examples: [
        'Водитель был вежлив и вёл аккуратно',
        'Резкое торможение сделало поездку некомфортной',
      ],
    },
    {
      key: 'positive', label: 'Позитив', icon: 'Smile', share: 43, positive: true,
      examples: [
        'Комфортная поездка, всё понравилось',
        'В целом транспорт стал ходить точнее',
      ],
    },
  ],
  // Маршруты — системные проблемы: расписание и достаточность транспорта на линии
  observers: [
    {
      key: 'delays', label: 'Опоздания', icon: 'Clock', share: 48, positive: false,
      examples: [
        'Транспорт регулярно опаздывает в час пик',
        'Интервалы движения сильно выбиваются из расписания',
      ],
    },
    {
      key: 'crowded', label: 'Переполненность', icon: 'Users', share: 29, positive: false,
      examples: [
        'Вечером в салоне не хватает мест',
        'В час пик на линии не хватает единиц транспорта',
      ],
    },
    {
      key: 'positive', label: 'Позитив', icon: 'Smile', share: 23, positive: true,
      examples: [
        'Расписание стало соблюдаться точнее',
      ],
    },
  ],
};

export function regulatorDemoClusters(mode: ViewMode) {
  return clustersByMode[mode];
}