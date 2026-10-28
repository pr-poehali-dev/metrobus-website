import { createFileRoute } from '@tanstack/react-router';
import CarrierDemo from '@/pages/CarrierDemo';
import { seoHead } from '@/components/metrobus/SeoHead';

export const Route = createFileRoute('/carrier-demo')({
  head: () =>
    seoHead({
      title: 'Личный кабинет перевозчика — демо | МЕТРОБУС.РФ',
      description:
        'Демо-кабинет перевозчика: мониторинг оценок комфорта поездок и удобства маршрутов, динамика по автобусам, трамваям и троллейбусам в реальном времени.',
      path: '/carrier-demo',
    }),
  component: CarrierDemo,
});
