import { useEffect, useState, useMemo, KeyboardEvent, CSSProperties } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { fetchRoutesList, RouteInfo } from '@/lib/dashboardApi';
import { TransportType } from '@/lib/mockData';

interface MyRoutesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routes: string[];
  onApply: (routes: string[]) => void;
}

const transportBorderClass: Record<TransportType, string> = {
  bus: 'border-transport-bus',
  tram: 'border-transport-tram',
  trolley: 'border-transport-trolley',
};
const transportBgClass: Record<TransportType, string> = {
  bus: 'bg-transport-bus/10',
  tram: 'bg-transport-tram/10',
  trolley: 'bg-transport-trolley/10',
};
const transportTextClass: Record<TransportType, string> = {
  bus: 'text-transport-bus',
  tram: 'text-transport-tram',
  trolley: 'text-transport-trolley',
};
const transportVar: Record<TransportType, string> = {
  bus: '--tr-bus',
  tram: '--tr-tram',
  trolley: '--tr-trolley',
};

function getRouteHighlight(types: TransportType[] | undefined): { className: string; style?: CSSProperties } {
  if (!types || types.length === 0) return { className: '' };
  if (types.length === 1) {
    const t = types[0];
    return { className: `${transportBorderClass[t]} ${transportBgClass[t]} ${transportTextClass[t]}` };
  }
  const stop = 100 / types.length;
  const gradient = types
    .map((t, i) => `hsl(var(${transportVar[t]}) / 0.12) ${i * stop}%, hsl(var(${transportVar[t]}) / 0.12) ${(i + 1) * stop}%`)
    .join(', ');
  return {
    className: 'border-border',
    style: { backgroundImage: `linear-gradient(90deg, ${gradient})` },
  };
}

export default function MyRoutesDialog({ open, onOpenChange, routes, onApply }: MyRoutesDialogProps) {
  const [draft, setDraft] = useState<string[]>(routes);
  const [inputValue, setInputValue] = useState('');
  const [allRoutes, setAllRoutes] = useState<RouteInfo[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(routes);
      setInputValue('');
      setSuggestOpen(false);
      fetchRoutesList().then(setAllRoutes);
    }
  }, [open, routes]);

  const routeTypesMap = useMemo(() => {
    const map = new Map<string, TransportType[]>();
    allRoutes.forEach((r) => map.set(r.number, r.types));
    return map;
  }, [allRoutes]);

  const suggestions = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) return [];
    return allRoutes
      .filter((r) => r.number.toLowerCase().startsWith(query) && !draft.includes(r.number))
      .slice(0, 6);
  }, [inputValue, allRoutes, draft]);

  const addRoute = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setDraft((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setInputValue('');
    setSuggestOpen(false);
  };

  const removeRoute = (value: string) => {
    setDraft((prev) => prev.filter((r) => r !== value));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addRoute(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && draft.length > 0) {
      setDraft((prev) => prev.slice(0, -1));
    } else if (e.key === 'Escape') {
      setSuggestOpen(false);
    }
  };

  const handleApply = () => {
    if (inputValue.trim()) addRoute(inputValue);
    onApply(draft);
    onOpenChange(false);
  };

  const handleClear = () => {
    setDraft([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Milestone" size={18} />
            Мои маршруты
          </DialogTitle>
          <DialogDescription className="pt-2 text-left text-foreground">
            Укажите номера маршрутов, которые вам интересны — дашборд будет показывать статистику
            только по ним. Список сохраняется в этом браузере.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Input
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setSuggestOpen(true);
              }}
              onFocus={() => setSuggestOpen(true)}
              onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
              onKeyDown={handleKeyDown}
              placeholder="Введите номер и нажмите Enter"
              autoFocus
            />
            {suggestOpen && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-md border bg-popover shadow-md">
                {suggestions.map((r) => {
                  const highlight = getRouteHighlight(r.types);
                  return (
                    <button
                      key={r.number}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addRoute(r.number)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary ${highlight.className}`}
                      style={highlight.style}
                    >
                      <Icon name="Milestone" size={13} className="text-muted-foreground" />
                      Маршрут {r.number}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {draft.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {draft.map((r) => {
                const highlight = getRouteHighlight(routeTypesMap.get(r));
                return (
                  <Badge
                    key={r}
                    variant="secondary"
                    className={`gap-1 border pr-1.5 text-sm ${highlight.className}`}
                    style={highlight.style}
                  >
                    {r}
                    <button
                      type="button"
                      onClick={() => removeRoute(r)}
                      className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-foreground/10"
                    >
                      <Icon name="X" size={11} />
                      <span className="sr-only">Убрать маршрут {r}</span>
                    </button>
                  </Badge>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Маршруты не выбраны — будет показана статистика по всему городу.
            </p>
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={handleClear} disabled={draft.length === 0}>
            Очистить
          </Button>
          <Button type="button" onClick={handleApply} className="gap-2">
            <Icon name="Check" size={16} />
            Применить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}