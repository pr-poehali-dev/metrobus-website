import Icon from '@/components/ui/icon';

interface ChangeEntry {
  date: string;
  title: string;
  items: string[];
}

const CHANGELOG: ChangeEntry[] = [
  {
    date: '26.08.2026',
    title: 'Новая терминология дашборда и обновлённые соглашения',
    items: [
      'Переключатель дашборда переименован: «Пассажиры/Наблюдатели» → «Поездки/Маршруты» — так понятнее, что это два разных вида оценки, а не роль человека.',
      'В рейтинге активности и в панели модерации термин «Наблюдатель» заменён на «Пользователь».',
      'В последних оценках маршрутов убран номер борта — это служебная информация, важная только для оценок поездок.',
      'Пользовательское соглашение и Политика конфиденциальности приведены в соответствие с новой терминологией.',
      'Обновлена иллюстрация в блоке «Как это работает» — с более подробной инструкцией.',
    ],
  },
];

const Changelog = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <a href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Icon name="Bus" size={18} className="text-primary-foreground" />
            </span>
            <span className="text-[15px] font-bold tracking-tight">МЕТРОБУС<span>.РФ</span></span>
          </a>
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground">На главную</a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold sm:text-3xl">История обновлений</h1>
        <p className="mt-2 text-sm text-muted-foreground">Ключевые изменения сервиса МЕТРОБУС.РФ</p>

        <div className="mt-8 space-y-6">
          {CHANGELOG.map((entry) => (
            <section key={entry.date} className="rounded-xl border border-border p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-secondary px-2.5 py-0.5 font-mono-num text-xs font-medium text-muted-foreground">
                  {entry.date}
                </span>
              </div>
              <h2 className="mt-3 text-base font-semibold">{entry.title}</h2>
              <ul className="mt-3 space-y-2">
                {entry.items.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                    <Icon name="Dot" size={18} className="mt-0.5 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Changelog;
