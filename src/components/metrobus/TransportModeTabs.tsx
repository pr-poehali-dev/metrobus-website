import Icon from '@/components/ui/icon';
import { ViewMode } from '@/components/metrobus/ViewModeToggle';

export default function TransportModeTabs({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div role="tablist" className="flex h-8 items-center gap-4 border-b border-border">
      <button
        type="button"
        role="tab"
        aria-selected={value === 'passengers'}
        onClick={() => onChange('passengers')}
        className={`relative flex h-8 items-center gap-1.5 text-sm font-medium transition-colors ${
          value === 'passengers'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Icon name="Bus" size={14} />
        Поездки
        {value === 'passengers' && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'observers'}
        onClick={() => onChange('observers')}
        className={`relative flex h-8 items-center gap-1.5 text-sm font-medium transition-colors ${
          value === 'observers'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Icon name="Route" size={14} />
        Маршруты
        {value === 'observers' && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
      </button>
    </div>
  );
}