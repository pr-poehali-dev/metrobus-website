import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import ThemeToggle from '@/components/metrobus/ThemeToggle';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface TopSectionProps {
  icqrUrl: string;
  onAboutOpen: () => void;
  showDashboardButton: boolean;
  onMyRatingsOpen: () => void;
  onHowItWorksOpen: () => void;
  onDashboardOpen: () => void;
  onMyRoutesOpen: () => void;
  children: ReactNode;
}

export default function TopSection({ icqrUrl, onAboutOpen, showDashboardButton, onMyRatingsOpen, onHowItWorksOpen, onDashboardOpen, onMyRoutesOpen, children }: TopSectionProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Как это работает', icon: 'ListChecks', onClick: onHowItWorksOpen },
    { label: 'Дашборд', icon: 'ChartLine', onClick: onDashboardOpen },
    { label: 'О компании', icon: 'Building2', onClick: onAboutOpen },
  ];

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

          <nav className="hidden items-center gap-5 md:flex">
            {navLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={link.onClick}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary active:text-primary"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a href={icqrUrl} target="_blank" rel="noopener noreferrer" className="hidden sm:block">
              <Button size="sm" variant="outline" className="h-9 gap-1.5 px-3">
                <Icon name="Star" size={15} />
                <span>Оценить</span>
              </Button>
            </a>
            <ThemeToggle />
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9 md:hidden"
              onClick={() => setMenuOpen(true)}
            >
              <Icon name="Menu" size={18} />
              <span className="sr-only">Меню</span>
            </Button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-3/4 sm:max-w-xs">
          <SheetHeader>
            <SheetTitle>Навигация</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 flex flex-col gap-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  link.onClick();
                }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <Icon name={link.icon} size={17} className="text-muted-foreground" />
                {link.label}
              </button>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* HERO */}
      <section id="top" className="relative overflow-hidden scroll-mt-16 bg-gradient-to-b from-[#447BBA]/[0.14] via-[#447BBA]/[0.04] to-transparent pt-10 pb-8 sm:pt-16 sm:pb-12">
        <div className="mx-auto max-w-5xl px-4">
          <h1 className="text-xl font-bold leading-tight sm:text-4xl">Ваш вклад в транспорт будущего</h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">Оценивайте комфорт поездок и удобство маршрутов общественного транспорта - без приложения, регистрации и сканирования QR-кодов.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="h-12 w-full gap-2 text-base sm:w-auto" onClick={onMyRatingsOpen}>
              <Icon name="UserCheck" size={18} />
              Мои оценки
            </Button>
            {showDashboardButton && (
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full gap-2 text-base sm:w-auto"
                onClick={onMyRoutesOpen}
              >
                <Icon name="Milestone" size={18} />
                Мои маршруты
              </Button>
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