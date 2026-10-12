import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { getCollapsedPref, setCollapsedPref } from '@/lib/uiPrefs';

export default function PassengersIntro() {
  const [showGeoHint, setShowGeoHint] = useState(() => !getCollapsedPref('geo_hint_closed'));
  const closeGeoHint = () => {
    setCollapsedPref('geo_hint_closed', true);
    setShowGeoHint(false);
  };
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

      {showGeoHint && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <Icon name="MapPin" size={18} className="mt-0.5 shrink-0 text-primary" />
          <p className="flex-1 text-sm">
            <span className="font-semibold">Оценивайте, находясь в транспорте или на остановке.</span>{' '}
            <span className="text-muted-foreground">Геопозиция нужна, чтобы подтвердить, что вы рядом с маршрутом, — иначе оценка не будет принята.</span>
          </p>
          <button
            type="button"
            onClick={closeGeoHint}
            aria-label="Закрыть подсказку"
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Icon name="X" size={16} />
          </button>
        </div>
      )}
    </section>
  );
}