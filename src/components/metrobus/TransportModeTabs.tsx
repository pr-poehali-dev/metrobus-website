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
    <div role="tablist" className="flex items-center gap-4 border-b border-border">
      <button
        type="button"
        role="tab"
        aria-selected={value === 'passengers'}
        onClick={() => onChange('passengers')}
        className={`flex items-center gap-1.5 border-b-2 pb-2 text-sm font-medium transition-colors ${
          value === 'passengers'
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        <Icon name="Bus" size={14} />
        Поездки
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'observers'}
        onClick={() => onChange('observers')}
        className={`flex items-center gap-1.5 border-b-2 pb-2 text-sm font-medium transition-colors ${
          value === 'observers'
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        <Icon name="Route" size={14} />
        Маршруты
      </button>
    </div>
  );
}