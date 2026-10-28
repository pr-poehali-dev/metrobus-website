import { createFileRoute } from '@tanstack/react-router';
import Changelog from '@/pages/Changelog';
import { fetchChangelogPublic, type ChangelogEntry } from '@/lib/adminApi';

export const Route = createFileRoute('/changelog')({
  loader: async (): Promise<{ entries: ChangelogEntry[] | null }> => {
    try {
      return { entries: await fetchChangelogPublic() };
    } catch {
      return { entries: null };
    }
  },
  component: ChangelogRoute,
});

function ChangelogRoute() {
  const data = Route.useLoaderData();
  return <Changelog initialEntries={data?.entries ?? null} />;
}
