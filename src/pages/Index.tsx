import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import TopSection from '@/components/metrobus/TopSection';
import MainTabs from '@/components/metrobus/MainTabs';
import SiteFooter from '@/components/metrobus/SiteFooter';
import InfoDialogs from '@/components/metrobus/InfoDialogs';
import { ViewMode } from '@/components/metrobus/ViewModeToggle';
import { TransportType } from '@/lib/mockData';
import { fetchDashboardStats, triggerIcqrSync, DashboardData } from '@/lib/dashboardApi';

const ICQR_URL = 'https://icqr.ru';

const Index = () => {
  const isMobile = useIsMobile();
  const [monthOffset, setMonthOffset] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('passengers');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);

  useEffect(() => {
    triggerIcqrSync();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDashboardStats(monthOffset, viewMode)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [monthOffset, viewMode]);

  const summary = data?.summary ?? { average: 0, prevAverage: 0, monthCount: 0, routesCount: 0, byType: [
    { type: 'bus' as TransportType, label: 'Автобус', average: 0, count: 0 },
    { type: 'tram' as TransportType, label: 'Трамвай', average: 0, count: 0 },
    { type: 'trolley' as TransportType, label: 'Троллейбус', average: 0, count: 0 },
  ] };
  const timeline = data?.timeline ?? [];
  const clusters = data?.clusters ?? [];
  const currentMonthLabel = data?.month ?? '';

  const trend = summary.average - summary.prevAverage;
  const trendUp = trend >= 0;

  return (
    <div className="min-h-screen bg-background">
      <TopSection icqrUrl={ICQR_URL} onAboutOpen={() => setAboutOpen(true)}>
        {/* NAV TABS */}
        <MainTabs
          viewMode={viewMode}
          setViewMode={setViewMode}
          monthOffset={monthOffset}
          setMonthOffset={setMonthOffset}
          loading={loading}
          isMobile={isMobile}
          summary={summary}
          timeline={timeline}
          clusters={clusters}
          currentMonthLabel={currentMonthLabel}
          trend={trend}
          trendUp={trendUp}
          onCityDialogOpen={() => setCityDialogOpen(true)}
        />
      </TopSection>

      <SiteFooter />

      <InfoDialogs
        aboutOpen={aboutOpen}
        setAboutOpen={setAboutOpen}
        cityDialogOpen={cityDialogOpen}
        setCityDialogOpen={setCityDialogOpen}
      />
    </div>
  );
};

export default Index;
