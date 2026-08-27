import Icon from '@/components/ui/icon';

export default function PassengersIntro() {
  return (
    <section>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: 'Timer', title: 'Быстро', text: 'Ввели короткий номер с борта — поставили оценку разовой поездке или регулярному маршруту.' },
          { icon: 'UserX', title: 'Анонимно', text: 'Разрешите доступ к текущей геопозиции и заполните короткую форму. Ваши правдивые оценки помогают городу.' },
          { icon: 'Megaphone', title: 'Эффективно', text: 'Ваши оценки увидят и перевозчики, и заказчики пассажирских перевозок, а мы будем держать вас в курсе.' },
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