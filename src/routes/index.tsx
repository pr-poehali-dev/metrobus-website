import { createFileRoute } from '@tanstack/react-router';
import Index from '@/pages/Index';

export const Route = createFileRoute('/')({
  head: () => ({
    links: [{ rel: 'canonical', href: 'https://xn--90aivcdt6a.xn--p1ai/' }],
  }),
  component: Index,
});
