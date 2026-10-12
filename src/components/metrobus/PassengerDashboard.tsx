import { ViewMode, DataScope } from '@/components/metrobus/ViewModeToggle';
import { DashboardSummary, Cluster, DashboardMetric, DashboardRecord, TopActiveUser, MyRank } from '@/lib/dashboardApi';
import DashboardHeader from '@/components/metrobus/dashboard/DashboardHeader';
import DashboardMetrics from '@/components/metrobus/dashboard/DashboardMetrics';
import DashboardInsights from '@/components/metrobus/dashboard/DashboardInsights';

interface PassengerDashboardProps {
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  dataScope: DataScope;
  setDataScope: (v: DataScope) => void;
  hasMyToken: boolean;
  myToken: string | null;
  loading: boolean;
  summary: DashboardSummary;
  clusters: Cluster[];
  metric1: DashboardMetric;
  metric2: DashboardMetric;
  metric3: DashboardMetric | null;
  records: DashboardRecord[];
  topActiveUsers: TopActiveUser[];
  myRank: MyRank | null;
  onCityDialogOpen: () => void;
  myRoutes: string[];
  onMyRoutesOpen: () => void;
  onMyRoutesClear: () => void;
}

export default function PassengerDashboard({
  viewMode,
  setViewMode,
  dataScope,
  setDataScope,
  hasMyToken,
  myToken,
  loading,
  summary,
  clusters,
  metric1,
  metric2,
  metric3,
  records,
  topActiveUsers,
  myRank,
  onCityDialogOpen,
  myRoutes,
  onMyRoutesOpen,
  onMyRoutesClear,
}: PassengerDashboardProps) {
  return (
    <section id="dashboard" className="scroll-mt-20">
      <DashboardHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        dataScope={dataScope}
        setDataScope={setDataScope}
        hasMyToken={hasMyToken}
        loading={loading}
        metric1={metric1}
        onCityDialogOpen={onCityDialogOpen}
        myRoutes={myRoutes}
        onMyRoutesOpen={onMyRoutesOpen}
        onMyRoutesClear={onMyRoutesClear}
      />

      <DashboardMetrics
        viewMode={viewMode}
        setViewMode={setViewMode}
        dataScope={dataScope}
        loading={loading}
        summary={summary}
        metric1={metric1}
        metric2={metric2}
        metric3={metric3}
        records={records}
      />

      <DashboardInsights
        viewMode={viewMode}
        setViewMode={setViewMode}
        dataScope={dataScope}
        hasMyToken={hasMyToken}
        myToken={myToken}
        loading={loading}
        clusters={clusters}
        topActiveUsers={topActiveUsers}
        myRank={myRank}
      />
    </section>
  );
}
