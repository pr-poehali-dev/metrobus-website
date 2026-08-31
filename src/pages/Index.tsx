import { useState, useEffect } from 'react';
import TopSection from '@/components/metrobus/TopSection';
import MainTabs from '@/components/metrobus/MainTabs';
import SiteFooter from '@/components/metrobus/SiteFooter';
import InfoDialogs from '@/components/metrobus/InfoDialogs';
import InstallAppBanner from '@/components/metrobus/InstallAppBanner';
import MyRoutesDialog from '@/components/metrobus/MyRoutesDialog';
import { ViewMode, DataScope } from '@/components/metrobus/ViewModeToggle';
import { TransportType } from '@/lib/mockData';
import { fetchDashboardStats, triggerIcqrSync, DashboardData } from '@/lib/dashboardApi';
import { captureMyRatingsTokenFromUrl, getMyRatingsToken } from '@/lib/myRatingsToken';
import { getMyRoutes, setMyRoutes as saveMyRoutes } from '@/lib/myRoutes';

const ICQR_URL = 'https://icqr.ru';

const MONTH_OFFSET = 0;

const Index = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('passengers');
  const [dataScope, setDataScope] = useState<DataScope>('all');
  const [myToken, setMyToken] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [myRoutesDialogOpen, setMyRoutesDialogOpen] = useState(false);
  const [myRoutes, setMyRoutesState] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('passengers');

  useEffect(() => {
    triggerIcqrSync();
    const { scrollToDashboard, tokenCaptured } = captureMyRatingsTokenFromUrl();
    setMyToken(getMyRatingsToken());
    setMyRoutesState(getMyRoutes());

    if (tokenCaptured) {
      setActiveTab('passengers');
      setDataScope('mine');
    }
    if (scrollToDashboard) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
        });
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDashboardStats(MONTH_OFFSET, viewMode, dataScope, myToken, myRoutes)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [viewMode, dataScope, myToken, myRoutes]);

  const summary = data?.summary ?? { average: 0, prevAverage: 0, monthCount: 0, routesCount: 0, byType: [
    { type: 'bus' as TransportType, label: 'Автобус', average: 0, count: 0 },
    { type: 'tram' as TransportType, label: 'Трамвай', average: 0, count: 0 },
    { type: 'trolley' as TransportType, label: 'Троллейбус', average: 0, count: 0 },
  ] };
  const clusters = data?.clusters ?? [];
  const metric1 = data?.metric1 ?? { value: 0, label: '' };
  const metric2 = data?.metric2 ?? { value: 0, label: '' };
  const metric3 = data?.metric3 ?? null;
  const records = data?.records ?? [];
  const topActiveUsers = data?.topActiveUsers ?? [];
  const myRank = data?.myRank ?? null;

  const handleMyRatingsOpen = () => {
    setActiveTab('passengers');
    setDataScope('mine');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  };

  const handleNavScroll = (sectionId: string) => {
    setActiveTab('passengers');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  };

  const handleMyRoutesApply = (routes: string[]) => {
    saveMyRoutes(routes);
    setMyRoutesState(routes);
    setActiveTab('passengers');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  };

  const handleMyRoutesClear = () => {
    saveMyRoutes([]);
    setMyRoutesState([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopSection
        icqrUrl={ICQR_URL}
        onAboutOpen={() => setAboutOpen(true)}
        showDashboardButton={activeTab === 'passengers'}
        onMyRatingsOpen={handleMyRatingsOpen}
        onHowItWorksOpen={() => handleNavScroll('how-it-works')}
        onDashboardOpen={() => handleNavScroll('dashboard')}
        onMyRoutesOpen={() => setMyRoutesDialogOpen(true)}
      >
        {/* NAV TABS */}
        <MainTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          viewMode={viewMode}
          setViewMode={setViewMode}
          dataScope={dataScope}
          setDataScope={setDataScope}
          hasMyToken={!!myToken}
          myToken={myToken}
          loading={loading}
          summary={summary}
          clusters={clusters}
          metric1={metric1}
          metric2={metric2}
          metric3={metric3}
          records={records}
          topActiveUsers={topActiveUsers}
          myRank={myRank}
          onCityDialogOpen={() => setCityDialogOpen(true)}
          myRoutes={myRoutes}
          onMyRoutesOpen={() => setMyRoutesDialogOpen(true)}
          onMyRoutesClear={handleMyRoutesClear}
        />
      </TopSection>

      <SiteFooter />

      <InstallAppBanner />

      <InfoDialogs
        aboutOpen={aboutOpen}
        setAboutOpen={setAboutOpen}
        cityDialogOpen={cityDialogOpen}
        setCityDialogOpen={setCityDialogOpen}
      />

      <MyRoutesDialog
        open={myRoutesDialogOpen}
        onOpenChange={setMyRoutesDialogOpen}
        routes={myRoutes}
        onApply={handleMyRoutesApply}
      />
    </div>
  );
};

export default Index;