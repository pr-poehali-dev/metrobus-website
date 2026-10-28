import { createFileRoute } from '@tanstack/react-router';
import AdminConsole from '@/pages/AdminConsole';

function AdminConsolePending() {
  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      <h1 className="sr-only">МЕТРОБУС.РФ — служебная консоль модерации отзывов о наземном общественном транспорте. Вход по PIN-коду для сотрудников сервиса.</h1>
      Загрузка…
    </div>
  );
}

export const Route = createFileRoute('/service/mb-console')({
  ssr: false,
  pendingComponent: AdminConsolePending,
  component: AdminConsole,
});