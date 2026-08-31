import Icon from '@/components/ui/icon';
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
          { n: 1, icon: 'Hash', title: 'Найдите короткий бортовой номер', text: 'Он нанесён на кузов и внутри салона транспорта (4 - 6 цифр).' },
          { n: 2, icon: 'Grid3x3', title: 'Используйте цифровые сервисы ICQR.RU', text: 'Результат - трасса маршрута для этого транспорта и кнопка "Оценить".' },
          { n: 3, icon: 'Star', title: 'Проверьте данные и поставьте оценку', text: 'Не смешивайте оценку поездки с оценкой маршрута. Это - разные вещи.' },
        ].map((s) => (
          <div key={s.n} className="rounded-xl border border-border p-4 sm:flex sm:items-start sm:gap-4 sm:p-5">
            <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary font-mono text-sm font-semibold text-primary-foreground sm:flex">
              {s.n}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Icon name={s.icon} size={16} className="text-muted-foreground shrink-0" />
                <h3 className="font-semibold">{s.title}</h3>
              </div>
              <div className="mt-1 flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary font-mono text-[11px] font-semibold text-primary-foreground sm:hidden">
                  {s.n}
                </span>
                <p className="text-sm text-muted-foreground">{s.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}