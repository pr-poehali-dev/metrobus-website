import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import Icon from '@/components/ui/icon';

export type ViewMode = 'passengers' | 'observers';
export type DataScope = 'mine' | 'all';

export default function ViewModeToggle({
  value,
  onChange,
  dataScope,
  onDataScopeChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
  dataScope?: DataScope;
  onDataScopeChange?: (v: DataScope) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {dataScope && onDataScopeChange && (
        <ToggleGroup
          type="single"
          value={dataScope}
          onValueChange={(v) => v && onDataScopeChange(v as DataScope)}
          className="rounded-lg bg-secondary p-1"
        >
          <ToggleGroupItem value="mine" className="h-8 gap-1.5 rounded-md px-3 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm">Мои оценки</ToggleGroupItem>
          <ToggleGroupItem value="all" className="h-8 gap-1.5 rounded-md px-3 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm">
            <Icon name="Globe" size={13} />
            Все
          </ToggleGroupItem>
        </ToggleGroup>
      )}
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => v && onChange(v as ViewMode)}
        className="rounded-lg bg-secondary p-1"
      >
        <ToggleGroupItem value="passengers" className="h-8 gap-1.5 rounded-md px-3 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm">
          <Icon name="Bus" size={13} />
          Пассажиры
        </ToggleGroupItem>
        <ToggleGroupItem value="observers" className="h-8 gap-1.5 rounded-md px-3 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm">
          <Icon name="Eye" size={13} />
          Наблюдатели
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}