import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import ThemeToggle from '@/components/metrobus/ThemeToggle';

interface TopSectionProps {
  icqrUrl: string;
  onAboutOpen: () => void;
  showDashboardButton: boolean;
  onMyRatingsOpen: () => void;
  onCityDialogOpen: () => void;
  children: ReactNode;
}

export default function TopSection({ icqrUrl, onAboutOpen, showDashboardButton, onMyRatingsOpen, onCityDialogOpen, children }: TopSectionProps) {
  return (
    <>
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <a href="#top" className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary">
              <img src="/logo-icon.png" alt="МЕТРОБУС.РФ" className="h-full w-full object-contain dark:hidden" />
              <img src="https://cdn.poehali.dev/projects/b9388cc3-9182-4a68-8712-f47fb43ea878/bucket/ad43e99a-45cd-411d-b75d-75d7774f4441.png" alt="МЕТРОБУС.РФ" className="hidden h-full w-full object-contain dark:block" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[15px] font-bold tracking-tight">МЕТРОБУС<span>.РФ</span></span>
              <span className="text-[11px] font-medium text-muted-foreground">Цифровые сервисы пассажира</span>
            </span>
          </a>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="hidden h-9 gap-1.5 px-3 sm:flex" onClick={onMyRatingsOpen}>
              <Icon name="UserCheck" size={15} />
              <span>Мои оценки</span>
            </Button>
            <a href={icqrUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="h-9 gap-1.5 px-3">
                <Icon name="Star" size={15} />
                <span className="hidden sm:inline">Оценить</span>
                <span className="inline sm:hidden">Оценить</span>
              </Button>
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative overflow-hidden scroll-mt-16 bg-gradient-to-b from-[#447BBA]/[0.14] via-[#447BBA]/[0.04] to-transparent pt-10 pb-8 sm:pt-16 sm:pb-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={onAboutOpen}
              className="mb-3 text-sm font-medium text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors hover:text-primary active:text-primary"
            >
              Проект компании ООО "Медиа-Инкод"
            </button>
            <button
              type="button"
              onClick={onCityDialogOpen}
              className="flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
            >
              <Icon name="MapPin" size={12} />
              Санкт-Петербург
            </button>
          </div>
          <h1 className="text-xl font-bold leading-tight sm:text-4xl">Ваш вклад в транспорт будущего</h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">Оценивайте комфорт поездок и удобство маршрутов общественного транспорта - без приложения, регистрации и сканирования QR-кодов.</p>
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
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4">
        {children}
      </main>
    </>
  );
}