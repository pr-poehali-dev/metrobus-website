import Icon from '@/components/ui/icon';

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-primary">
                <img src="/logo-icon.png" alt="МЕТРОБУС.РФ" className="h-full w-full object-contain" />
              </span>
              <span className="font-bold">МЕТРОБУС.РФ</span>
            </div>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">Цифровые сервисы пассажира.<br />Оплата проезда. Смарт-информирование. Обратная связь.</p>
          </div>
          <div className="space-y-4 text-sm text-muted-foreground sm:mt-10">
            <a href="mailto:support@icqr.ru" className="flex items-center gap-2 hover:text-foreground">
              <Icon name="Mail" size={15} />
              support@icqr.ru
            </a>
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <Icon name="ShieldCheck" size={15} />
                Патент на изобретение способа № 2803701
              </p>
              <p className="flex items-center gap-2">
                <Icon name="BadgeCheck" size={15} />
                Реестр Минцифры № 19406 от 04.10.2023 г.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a href="/terms" className="underline hover:text-foreground">Пользовательское соглашение</a>
            <a href="/privacy" className="underline hover:text-foreground">Политика конфиденциальности</a>
          </div>
          <span>© ООО «МЕДИА-ИНКОД», {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}