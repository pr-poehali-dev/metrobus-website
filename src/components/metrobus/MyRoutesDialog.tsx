import { useEffect, useState, useMemo, KeyboardEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { fetchRoutesList } from '@/lib/dashboardApi';

interface MyRoutesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routes: string[];
  onApply: (routes: string[]) => void;
}

export default function MyRoutesDialog({ open, onOpenChange, routes, onApply }: MyRoutesDialogProps) {
  const [draft, setDraft] = useState<string[]>(routes);
  const [inputValue, setInputValue] = useState('');
  const [allRoutes, setAllRoutes] = useState<string[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(routes);
      setInputValue('');
      setSuggestOpen(false);
      fetchRoutesList().then(setAllRoutes);
    }
  }, [open, routes]);

  const suggestions = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) return [];
    return allRoutes
      .filter((r) => r.toLowerCase().startsWith(query) && !draft.includes(r))
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
                {suggestions.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addRoute(r)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary"
                  >
                    <Icon name="Milestone" size={13} className="text-muted-foreground" />
                    Маршрут {r}
                  </button>
                ))}
              </div>
            )}
          </div>
          {draft.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {draft.map((r) => (
                <Badge key={r} variant="secondary" className="gap-1 pr-1.5 text-sm">
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
              ))}
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