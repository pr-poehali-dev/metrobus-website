import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { ViewMode, DataScope } from '@/components/metrobus/ViewModeToggle';
import { DashboardSummary, Cluster, DashboardMetric, DashboardRecord, TopActiveUser, MyRank } from '@/lib/dashboardApi';
import PassengersIntro from '@/components/metrobus/PassengersIntro';
import HowItWorks from '@/components/metrobus/HowItWorks';
import PassengerDashboard from '@/components/metrobus/PassengerDashboard';
import RoleSection from '@/components/metrobus/RoleSection';

interface MainTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
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
}

export default function MainTabs({
  activeTab,
  onTabChange,
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
}: MainTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="pb-16">
      <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
        <TabsTrigger value="passengers" className="h-10 gap-1.5 text-[13px] sm:text-sm">
          <Icon name="Users" size={15} className="hidden shrink-0 sm:inline" />Пассажирам
        </TabsTrigger>
        <TabsTrigger value="carrier" className="h-10 gap-1.5 text-[13px] sm:text-sm">
          <Icon name="Building2" size={15} className="hidden shrink-0 sm:inline" />Перевозчикам
        </TabsTrigger>
        <TabsTrigger value="regulator" className="h-10 gap-1.5 text-[13px] sm:text-sm">
          <Icon name="Landmark" size={15} className="hidden sm:inline" />Заказчикам
        </TabsTrigger>
      </TabsList>

      {/* ===== ПАССАЖИРЫ ===== */}
      <TabsContent value="passengers" className="mt-8 space-y-16">
        {/* С.1 — Что это */}
        <PassengersIntro />

        {/* С.2 — Как работает */}
        <HowItWorks />

        {/* С.3 — Дашборд */}
        <PassengerDashboard
          viewMode={viewMode}
          setViewMode={setViewMode}
          dataScope={dataScope}
          setDataScope={setDataScope}
          hasMyToken={hasMyToken}
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
          onCityDialogOpen={onCityDialogOpen}
        />
      </TabsContent>

      {/* ===== ПЕРЕВОЗЧИК ===== */}
      <TabsContent value="carrier" className="mt-8">
        <RoleSection
          icon="Building2"
          title="Обратная связь привязана к конкретному рейсу, а не к общему впечатлению."
          value="Получайте объективную обратную связь в режиме реального времени. Работайте на опережение и повышайте оценку своего парка."
          bullets={[
            'Динамика оценок по вашему транспорту',
            'Автоматическая группировка проблем',
            'Данные для управленческих решений',
          ]}
          role="carrier"
          showLoginActions
        />
      </TabsContent>

      {/* ===== РЕГУЛЯТОР ===== */}
      <TabsContent value="regulator" className="mt-8">
        <RoleSection
          icon="Landmark"
          title="Российская технология независимого мониторинга на основе широко принятой практики."
          value="Объективная картина качества наземного транспорта города на основе мнений пассажиров. Прозрачная база для контроля перевозчиков и планирования."
          bullets={[
            'Сводная оценка качества по городу',
            'Тренды и проблемные зоны',
            'Независимый источник данных',
          ]}
          role="regulator"
          showLoginActions
        />
      </TabsContent>
    </Tabs>
  );
}