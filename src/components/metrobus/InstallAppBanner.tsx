import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const DISMISS_KEY = 'installBannerDismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // TODO: временно для отладки — показать баннер всегда
    setShowIosHint(isIos());
    setVisible(true);
    return;

    // eslint-disable-next-line no-unreachable
    if (isStandalone() || localStorage.getItem(DISMISS_KEY) === '1') return;

    if (isIos()) {
      setShowIosHint(true);
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-background px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] animate-fade-in">
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg overflow-hidden dark:bg-primary dark:p-1.5">
          <img src="https://cdn.poehali.dev/projects/b9388cc3-9182-4a68-8712-f47fb43ea878/bucket/4510c05a-59cc-463d-9ddd-015aa1febb82.png" alt="МЕТРОБУС.РФ" className="h-full w-full object-cover dark:hidden" />
          <img src="https://cdn.poehali.dev/projects/b9388cc3-9182-4a68-8712-f47fb43ea878/bucket/ad43e99a-45cd-411d-b75d-75d7774f4441.png" alt="МЕТРОБУС.РФ" className="hidden h-full w-full object-contain dark:block" />
        </span>

        {showIosHint ? (
          <div className="flex-1 text-sm">
            <p className="font-semibold">Добавить симпатичную иконку</p>
            <p className="mt-0.5 text-muted-foreground">
              Нажмите <Icon name="Share" size={13} className="mx-0.5 inline -translate-y-px" /> и выберите «На экран «Домой»»
            </p>
          </div>
        ) : (
          <div className="flex-1 text-sm">
            <p className="font-semibold">Добавить симпатичную иконку</p>
            <p className="mt-0.5 text-muted-foreground">Быстрый доступ с экрана смартфона</p>
          </div>
        )}

        {!showIosHint && (
          <Button
            size="sm"
            className="h-9 shrink-0 gap-1.5 px-3"
            onClick={handleInstall}
          >
            <Icon name="Download" size={15} />
            Добавить
          </Button>
        )}

        <button
          type="button"
          onClick={dismiss}
          aria-label="Закрыть"
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Icon name="X" size={18} />
        </button>
      </div>
    </div>
  );
}