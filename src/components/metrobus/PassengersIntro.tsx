import Icon from '@/components/ui/icon';

export default function PassengersIntro() {
  return (
    <section>
      <p className="mb-4 text-base font-medium text-muted-foreground">
        Первая в России система, где оценки проверяются геометрией.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: 'Timer', title: 'Быстро', text: 'Ввели короткий номер с борта — поставили оценку разовой поездке или регулярному маршруту.' },
          { icon: 'UserX', title: 'Анонимно', text: 'Укажите свой статус (пассажир / наблюдатель) и пишите как есть. Ваша правдивая оценка помогает городу.' },
          { icon: 'Megaphone', title: 'Эффективно', text: 'Оценки увидят и перевозчики, и организатор перевозок. Найти их можно будет позже — они не потеряются.' },
        ].map((b) => (
          <div key={b.title} className="rounded-xl border border-border p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <Icon name={b.icon} size={20} className="text-foreground" />
            </div>
            <h3 className="font-semibold">{b.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{b.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}