import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type ViewMode = 'passengers' | 'observers';
export type DataScope = 'mine' | 'all';

export default function ViewModeToggle({
  dataScope,
  onDataScopeChange,
}: {
  dataScope?: DataScope;
  onDataScopeChange?: (v: DataScope) => void;
}) {
  if (!dataScope || !onDataScopeChange) return null;

  return (
    <ToggleGroup
      type="single"
      value={dataScope}
      onValueChange={(v) => v && onDataScopeChange(v as DataScope)}
      className="rounded-lg bg-secondary p-1"
    >
      <ToggleGroupItem value="mine" className="h-8 gap-1.5 rounded-md px-3 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm">Мои оценки</ToggleGroupItem>
      <ToggleGroupItem value="all" className="h-8 gap-1.5 rounded-md px-3 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm">Все оценки</ToggleGroupItem>
    </ToggleGroup>
  );
}