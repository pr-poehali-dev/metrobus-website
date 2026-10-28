import { createFileRoute } from '@tanstack/react-router';
import RegulatorDemo from '@/pages/RegulatorDemo';
import { seoHead } from '@/components/metrobus/SeoHead';

export const Route = createFileRoute('/regulator-demo')({
  head: () =>
    seoHead({
      title: 'Кабинет заказчика перевозок — демо | МЕТРОБУС.РФ',
      description:
        'Демо-кабинет заказчика перевозок: независимый мониторинг качества наземного общественного транспорта города на основе оценок пассажиров, рейтинг перевозчиков.',
      path: '/regulator-demo',
    }),
  component: RegulatorDemo,
});
