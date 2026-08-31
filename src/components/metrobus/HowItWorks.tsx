import howItWorksImg from '@/assets/how-it-works.png';

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20">
      <h2 className="text-2xl font-bold sm:text-3xl">Как это работает</h2>
      <p className="mt-2 text-base text-muted-foreground">Первая в России система, где оценки проверяются геометрией.</p>
      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <img
          src={howItWorksImg}
          alt="Пример расположения короткого бортового номера на транспорте и порядок оценки на ICQR.RU"
          className="h-auto w-full object-cover"
        />
      </div>
      <div className="mt-3 space-y-3">
        {[
          { n: 1, title: 'Найдите короткий бортовой номер', text: 'Он нанесён на кузов и внутри салона транспорта (4 - 6 цифр).' },
          { n: 2, title: 'Используйте цифровые сервисы', text: 'Результат - трасса маршрута для этого транспорта и кнопка "Оценить".' },
          { n: 3, title: 'Проверьте данные и поставьте оценку', text: 'Не смешивайте оценку поездки с оценкой маршрута. Это - разные вещи.' },
        ].map((s) => (
          <div key={s.n} className="rounded-xl border border-border p-4 sm:p-5">
            <h3 className="font-semibold">{`${s.n}. ${s.title}`}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}