import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    <Tabs value={value} onValueChange={(v) => onChange(v as ViewMode)}>
      <TabsList className="h-9 gap-1 rounded-lg border border-border bg-transparent p-1">
        <TabsTrigger value="passengers" className="h-7 gap-1.5 rounded-md px-3 text-xs data-[state=active]:bg-secondary data-[state=active]:shadow-none">
          <Icon name="Bus" size={13} />
          Поездки
        </TabsTrigger>
        <TabsTrigger value="observers" className="h-7 gap-1.5 rounded-md px-3 text-xs data-[state=active]:bg-secondary data-[state=active]:shadow-none">
          <Icon name="Route" size={13} />
          Маршруты
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
