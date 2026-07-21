import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import Icon from '@/components/ui/icon';

export type ViewMode = 'passengers' | 'observers';

export default function ViewModeToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div className="flex items-center gap-2">
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
