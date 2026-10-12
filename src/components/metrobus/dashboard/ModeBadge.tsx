import Icon from '@/components/ui/icon';
import { ViewMode } from '@/components/metrobus/ViewModeToggle';

export default function ModeBadge({ viewMode, setViewMode }: { viewMode: ViewMode; setViewMode?: (v: ViewMode) => void }) {
  return (
    <span
      onClick={setViewMode ? () => setViewMode(viewMode === 'passengers' ? 'observers' : 'passengers') : undefined}
      className="flex shrink-0 items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground"
    >
      <Icon name={viewMode === 'passengers' ? 'Bus' : 'Route'} size={12} />
      {viewMode === 'passengers' ? 'Поездки' : 'Маршруты'}
    </span>
  );
}
