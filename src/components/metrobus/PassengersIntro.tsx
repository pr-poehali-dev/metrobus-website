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

      <div className="mt-4 flex gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
          <Icon name="MapPin" size={20} className="text-primary" />
        </span>
        <div className="text-sm">
          <p className="font-semibold">Оценивайте поездку, находясь в транспорте или на остановке</p>
          <p className="mt-1 text-muted-foreground">
            Геопозиция нужна только для того, чтобы убедиться: вы действительно рядом с маршрутом. Так оценки остаются честными, а не
            «с дивана». Мы не сохраняем ваш путь и не узнаём, кто вы. Без доступа к геопозиции или вдали от маршрута (дальше 300 м)
            оценка не будет принята.
          </p>
        </div>
      </div>
    </section>
  );
}