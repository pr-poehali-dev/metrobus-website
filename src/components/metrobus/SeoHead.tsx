interface SeoHeadProps {
  title: string;
  description: string;
  path: string;
}

const SITE_URL = 'https://xn--90aivcdt6a.xn--p1ai';

/** Мета-теги страницы для head() маршрута (раньше — компонент на react-helmet-async). */
export function seoHead({ title, description, path }: SeoHeadProps) {
  const url = `${SITE_URL}${path}`;
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    links: [{ rel: 'canonical', href: url }],
  };
}
