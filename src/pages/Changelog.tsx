import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { fetchChangelogPublic, ChangelogEntry } from '@/lib/adminApi';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const Changelog = () => {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChangelogPublic()
      .then(setEntries)
      .finally(() => setLoading(false));
  }, []);

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

        {loading && (
          <p className="mt-8 text-sm text-muted-foreground">Загрузка…</p>
        )}

        {!loading && entries.length === 0 && (
          <p className="mt-8 text-sm text-muted-foreground">Записей пока нет.</p>
        )}

        <div className="mt-8 space-y-6">
          {entries.map((entry) => (
            <section key={entry.id} className="rounded-xl border border-border p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-secondary px-2.5 py-0.5 font-mono-num text-xs font-medium text-muted-foreground">
                  {formatDate(entry.entryDate)}
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
