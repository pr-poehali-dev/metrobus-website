import Icon from '@/components/ui/icon';

export default function HowItWorks() {
  return (
    <section>
      <h2 className="text-2xl font-bold sm:text-3xl">Как это работает</h2>
      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <img
          src="https://cdn.poehali.dev/projects/b9388cc3-9182-4a68-8712-f47fb43ea878/files/67a650ef-1a75-487f-b615-e728a5601603.jpg"
          alt="Пример расположения короткого бортового номера на транспорте"
          className="h-auto w-full object-cover"
        />
      </div>
      <div className="mt-3 space-y-3">
        {[
          { n: 1, icon: 'Hash', title: 'Найдите короткий бортовой номер', text: 'Он нанесён на кузов и внутри салона транспорта (4 - 6 цифр).' },
          { n: 2, icon: 'Grid3x3', title: 'Используйте его на главной странице ICQR.RU', text: 'Результат - карта маршрута для этого транспорта и кнопка "Оценить".' },
          { n: 3, icon: 'Star', title: 'Проверьте данные и поставьте оценку', text: 'При желании, напишите короткий комментарий.' },
        ].map((s) => (
          <div key={s.n} className="flex items-start gap-4 rounded-xl border border-border p-4 sm:p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary font-mono text-sm font-semibold text-primary-foreground">
              {s.n}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Icon name={s.icon} size={16} className="text-muted-foreground" />
                <h3 className="font-semibold">{s.title}</h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}