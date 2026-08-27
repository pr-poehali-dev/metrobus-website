import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `https://xn--90aivcdt6a.xn--p1ai${item.href}` } : {}),
    })),
  };

  return (
    <nav aria-label="Хлебные крошки" className="mb-4 flex items-center flex-wrap gap-1 text-sm text-muted-foreground">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-1">
          {i > 0 && <Icon name="ChevronRight" size={14} className="shrink-0 text-muted-foreground/60" />}
          {item.href ? (
            <Link to={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
