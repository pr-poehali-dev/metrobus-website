import { useState } from 'react';
import { getCollapsedPref, setCollapsedPref } from '@/lib/uiPrefs';
import Icon from '@/components/ui/icon';
import { ViewMode, DataScope } from '@/components/metrobus/ViewModeToggle';
import ShareMyRatingsButton from '@/components/metrobus/ShareMyRatingsButton';
import ServiceInfoBlock from '@/components/metrobus/ServiceInfoBlock';
import { Cluster, TopActiveUser, MyRank } from '@/lib/dashboardApi';
import ModeBadge from '@/components/metrobus/dashboard/ModeBadge';

interface DashboardInsightsProps {
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  dataScope: DataScope;
  hasMyToken: boolean;
  myToken: string | null;
  loading: boolean;
  clusters: Cluster[];
  topActiveUsers: TopActiveUser[];
  myRank: MyRank | null;
}

export default function DashboardInsights({
  viewMode,
  setViewMode,
  dataScope,
  hasMyToken,
  myToken,
  loading,
  clusters,
  topActiveUsers,
  myRank,
}: DashboardInsightsProps) {
  const [top10Expanded, setTop10Expanded] = useState(() => !getCollapsedPref('top10_rest', true));
  const toggleTop10 = () => {
    setTop10Expanded((prev) => {
      setCollapsedPref('top10_rest', prev);
      return !prev;
    });
  };
  const visibleClusters = clusters.filter((c) => c.share > 0 || c.examples.length > 0);
  const showMineInfo = dataScope === 'mine' && ((hasMyToken && !!myToken) || !!myRank);
  return (
    <>
      {/* Рейтинг самых активных пользователей */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon name="Trophy" size={18} className="text-muted-foreground" />
            <h3 className="text-lg font-semibold">Топ-10</h3>
          </div>
          <ModeBadge viewMode={viewMode} setViewMode={setViewMode} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Используется анонимный идентификатор.</p>
        {topActiveUsers.length === 0 && !loading && (
          <p className="mt-4 text-sm text-muted-foreground">Пока недостаточно данных для рейтинга.</p>
        )}
        {topActiveUsers.length > 0 && (
          <div className="mt-4 space-y-2">
            {(top10Expanded ? topActiveUsers : topActiveUsers.slice(0, 5)).map((u) => (
              <div
                key={u.rank}
                className={`flex items-center gap-3 rounded-xl border p-3 sm:p-4 ${
                  u.isMe ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono-num text-sm font-bold ${
                    u.rank <= 3 ? 'bg-amber-500/15 text-amber-600' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {u.rank}
                </span>
                <span className="flex-1 truncate font-medium">
                  {u.label}
                  {u.isMe && <span className="ml-2 text-xs font-normal text-primary">Это вы</span>}
                </span>
                <span className="flex shrink-0 items-center gap-1.5 font-mono-num text-sm font-semibold">
                  <Icon name="Star" size={14} className="fill-amber-500 text-amber-500" />
                  {u.count.toLocaleString('ru-RU')}
                </span>
              </div>
            ))}
            {topActiveUsers.length > 5 && (
              <button
                type="button"
                onClick={toggleTop10}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {top10Expanded ? 'Свернуть' : `Показать ещё ${topActiveUsers.length - 5}`}
                <Icon name={top10Expanded ? 'ChevronUp' : 'ChevronDown'} size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* AI-кластеры */}
      <div className="mt-8 hidden sm:block">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon name="Sparkles" size={18} className="text-muted-foreground" />
            <h3 className="text-lg font-semibold">О чём пишут пользователи</h3>
          </div>
          <ModeBadge viewMode={viewMode} setViewMode={setViewMode} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Комментарии сгруппированы автоматически. Доля — от всех отзывов с комментариями; один отзыв может касаться нескольких тем.</p>
        {visibleClusters.length === 0 && !loading && (
          <p className="mt-4 text-sm text-muted-foreground">Пока нет отзывов с комментариями.</p>
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {visibleClusters.map((c) => (
            <div key={c.key} className="rounded-xl border border-border p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.positive ? 'bg-transport-tram/10' : 'bg-secondary'}`}>
                    <Icon name={c.icon} size={18} className={c.positive ? 'text-transport-tram' : 'text-foreground'} />
                  </span>
                  <span className="font-semibold">{c.label}</span>
                </div>
                <span className="flex shrink-0 items-baseline gap-1.5">
                  {typeof c.count === 'number' && typeof c.total === 'number' && c.total < 10 ? (
                    <span className="font-mono-num text-lg font-bold">{c.count} из {c.total}</span>
                  ) : (
                    <>
                      <span className="font-mono-num text-lg font-bold">{c.share}%</span>
                      {typeof c.count === 'number' && typeof c.total === 'number' && (
                        <span className="font-mono-num text-xs text-muted-foreground">{c.count} из {c.total}</span>
                      )}
                    </>
                  )}
                </span>
              </div>
              <ul className="mt-3 space-y-2">
                {c.examples.map((ex, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                    <Icon name="Quote" size={13} className="mt-1 shrink-0 opacity-40" />
                    <span>{ex}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className={showMineInfo ? '' : 'sm:hidden'}>
        <ServiceInfoBlock storageKey="service_info">
          {hasMyToken && myToken && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm">
              <span className="text-muted-foreground">Хотите посмотреть свои оценки на компьютере, в комфортной обстановке?</span>
              <ShareMyRatingsButton token={myToken} />
            </div>
          )}

          {myRank && (
            <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 font-mono-num text-base font-bold text-primary">
                {myRank.rank}
              </span>
              <span>
                Ваше место в общегородском рейтинге активности:{' '}
                <span className="font-semibold">{myRank.rank}</span> из {myRank.totalUsers.toLocaleString('ru-RU')}{' '}
                ({myRank.count.toLocaleString('ru-RU')}{' '}
                {myRank.count === 1 ? 'оценка' : 'оценок'})
              </span>
            </div>
          )}
          <div className="flex items-center gap-3 rounded-xl border border-border p-4 sm:hidden">
            <Icon name="Monitor" size={18} className="shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              В версии для компьютера информация представлена более полно и подробно.
            </p>
          </div>
        </ServiceInfoBlock>
      </div>
    </>
  );
}
