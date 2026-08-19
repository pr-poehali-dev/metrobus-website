import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface TopSectionProps {
  icqrUrl: string;
  onAboutOpen: () => void;
  showDashboardButton: boolean;
  onMyRatingsOpen: () => void;
  children: ReactNode;
}

export default function TopSection({ icqrUrl, onAboutOpen, showDashboardButton, onMyRatingsOpen, children }: TopSectionProps) {
  return (
    <>
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <a href="#top" className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary">
              <img src="/logo-icon.png" alt="МЕТРОБУС.РФ" className="h-full w-full object-contain" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[15px] font-bold tracking-tight">МЕТРОБУС<span>.РФ</span></span>
              <span className="text-[11px] font-medium text-muted-foreground">Цифровые сервисы пассажира</span>
            </span>
          </a>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-9 gap-1.5 px-3" onClick={onMyRatingsOpen}>
              <Icon name="UserCheck" size={15} />
              <span className="hidden sm:inline">Мои оценки</span>
              <span className="inline sm:hidden">Мои</span>
            </Button>
            <a href={icqrUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="h-9 gap-1.5 px-3">
                <Icon name="Star" size={15} />
                <span className="hidden sm:inline">Оценить</span>
                <span className="inline sm:hidden">Оценить</span>
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-5xl scroll-mt-16 px-4">
        {/* HERO */}
        <section className="pt-10 pb-8 sm:pt-16 sm:pb-12">
          <button
            type="button"
            onClick={onAboutOpen}
            className="mb-3 text-sm font-medium text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground"
          >
            Проект компании ООО "Медиа-Инкод"
          </button>
          <h1 className="text-xl font-bold leading-tight sm:text-4xl">Ваш вклад в транспорт будущего</h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">Оценивайте свои поездки и маршруты общественного транспорта - без приложения, без регистрации и без сканирования QR-кодов.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href={icqrUrl} target="_blank" rel="noopener noreferrer" className="sm:w-auto">
              <Button size="lg" className="h-12 w-full gap-2 text-base sm:w-auto">
                <Icon name="Star" size={18} />
                Оценить
              </Button>
            </a>
            {showDashboardButton && (
              <a href="#dashboard" className="sm:w-auto">
                <Button size="lg" variant="outline" className="h-12 w-full gap-2 text-base sm:w-auto">
                  <Icon name="ChartLine" size={18} />
                  Смотреть дашборд
                </Button>
              </a>
            )}
          </div>
        </section>

        {children}
      </main>
    </>
  );
}