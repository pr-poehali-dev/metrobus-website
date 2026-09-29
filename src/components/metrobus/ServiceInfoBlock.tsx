import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { getCollapsedPref, setCollapsedPref } from '@/lib/uiPrefs';

interface ServiceInfoBlockProps {
  storageKey: string;
  children: React.ReactNode;
}

/**
 * Обёртка для служебной информации дашборда (подсказки, место в рейтинге и т.п.),
 * которую можно свернуть — состояние сохраняется в localStorage по storageKey.
 */
export default function ServiceInfoBlock({ storageKey, children }: ServiceInfoBlockProps) {
  const [collapsed, setCollapsed] = useState(() => getCollapsedPref(storageKey));

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      setCollapsedPref(storageKey, next);
      return next;
    });
  };

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon name="Info" size={15} />
          Служебная информация
        </span>
        <Icon name={collapsed ? 'ChevronDown' : 'ChevronUp'} size={16} className="shrink-0 text-muted-foreground" />
      </button>
      {!collapsed && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  );
}
