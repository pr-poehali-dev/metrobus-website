import Icon from '@/components/ui/icon';
import { SOCIAL_LINKS } from '@/lib/socialLinks';

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
          <div className="space-y-4 text-sm text-muted-foreground sm:mt-10 sm:text-right">
            <a href="mailto:support@icqr.ru" className="flex items-center gap-2 hover:text-foreground sm:justify-end">
              <Icon name="Mail" size={15} />
              support@icqr.ru
            </a>
            <div className="space-y-2">
              <p className="flex items-center gap-2 sm:justify-end">
                <Icon name="ShieldCheck" size={15} />
                Патент на изобретение способа № 2803701
              </p>
              <p className="flex items-center gap-2 sm:justify-end">
                <Icon name="BadgeCheck" size={15} />
                Реестр Минцифры № 19406
              </p>
              <p className="flex items-center gap-3 sm:justify-end">
                <a href={SOCIAL_LINKS.vk} target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline">ВКонтакте</a>
                <a href={SOCIAL_LINKS.telegram} target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline">Телеграм</a>
                <a href={SOCIAL_LINKS.max} target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline">MAX</a>
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