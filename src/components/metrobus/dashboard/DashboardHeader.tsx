import Icon from '@/components/ui/icon';
import ViewModeToggle, { ViewMode, DataScope } from '@/components/metrobus/ViewModeToggle';
import TransportModeTabs from '@/components/metrobus/TransportModeTabs';
import { DashboardMetric } from '@/lib/dashboardApi';

interface DashboardHeaderProps {
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  dataScope: DataScope;
  setDataScope: (v: DataScope) => void;
  hasMyToken: boolean;
  loading: boolean;
  metric1: DashboardMetric;
  onCityDialogOpen: () => void;
  myRoutes: string[];
  onMyRoutesOpen: () => void;
  onMyRoutesClear: () => void;
}

export default function DashboardHeader({
  viewMode,
  setViewMode,
  dataScope,
  setDataScope,
  hasMyToken,
  loading,
  metric1,
  onCityDialogOpen,
  myRoutes,
  onMyRoutesOpen,
  onMyRoutesClear,
}: DashboardHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold sm:text-3xl">Дашборд</h2>
        <div className="flex shrink-0 items-center gap-2">
          <span
            role="button"
            tabIndex={0}
            onClick={onMyRoutesOpen}
            onKeyDown={(e) => e.key === 'Enter' && onMyRoutesOpen()}
            className={`items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
              myRoutes.length > 0
                ? 'flex bg-primary/10 text-primary hover:bg-primary/15'
                : 'hidden bg-secondary text-muted-foreground hover:bg-secondary/70 hover:text-foreground sm:flex'
            }`}
          >
            <Icon name="Milestone" size={12} />
            {myRoutes.length > 0 ? (
              <span className="hidden sm:inline">{`Маршруты: ${myRoutes.join(', ')}`}</span>
            ) : (
              'Мои маршруты'
            )}
            {myRoutes.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMyRoutesClear();
                }}
                className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-primary/20"
              >
                <Icon name="X" size={10} />
                <span className="sr-only">Сбросить фильтр маршрутов</span>
              </button>
            )}
          </span>
          <button
            type="button"
            onClick={onCityDialogOpen}
            className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
          >
            <Icon name="MapPin" size={12} />
            Санкт-Петербург
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <TransportModeTabs value={viewMode} onChange={setViewMode} />
        <ViewModeToggle dataScope={dataScope} onDataScopeChange={setDataScope} />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {dataScope === 'mine'
          ? 'Показаны только ваши оценки, сохранённые при последнем визите на ICQR.RU в этом браузере.'
          : viewMode === 'passengers'
            ? 'Оценки комфорта поездок в наземном общественном транспорте.'
            : 'Оценки удобства маршрутов наземного общественного транспорта.'}
      </p>

      {dataScope === 'mine' && !hasMyToken && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <Icon name="Fingerprint" size={16} className="shrink-0 text-amber-600" />
          <span>Оценок нет или еще не прошли модерацию. Они привязаны к браузеру, в котором вы их ставили — откройте карту на ICQR.RU с того же устройства и нажмите «Дашборд».</span>
        </div>
      )}

      {myRoutes.length > 0 && !loading && metric1.value === 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm">
          <Icon name="Info" size={16} className="shrink-0 text-muted-foreground" />
          <span>
            По выбранным маршрутам ({myRoutes.join(', ')}) пока нет оценок. Как только появятся новые оценки по этим маршрутам, они отобразятся здесь.
          </span>
        </div>
      )}
    </>
  );
}
