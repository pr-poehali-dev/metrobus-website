import type {ReactNode} from "react";
import {HeadContent, Outlet, Scripts, createRootRoute} from "@tanstack/react-router";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {useState} from "react";
import {Toaster} from "@/components/ui/toaster";
import {Toaster as Sonner} from "@/components/ui/sonner";
import {TooltipProvider} from "@/components/ui/tooltip";
import {ThemeProvider} from "@/components/theme-provider";
import NotFound from "@/pages/NotFound";
import {PLATFORM_META, PLATFORM_SCRIPTS} from "@/platform/scripts.gen";
import {HMR_CLIENT} from "@/platform/dev-hmr";
import appCss from "@/index.css?url";

const SITE_URL = "https://xn--90aivcdt6a.xn--p1ai/";
const TITLE = "Оценка автобусов, трамваев и троллейбусов онлайн — МЕТРОБУС.РФ";
const DESCRIPTION =
    "Один отзыв — это мнение, а тысяча — это то, с чем придётся считаться. Оценивайте общественный транспорт — без приложения, регистрации и QR-кодов.";
const TWITTER_DESCRIPTION =
    "Оцените поездку или маршрут наземного общественного транспорта Санкт-Петербурга за 10 секунд — без приложений, регистрации и QR-кодов.";
const OG_IMAGE = "https://cdn.poehali.dev/projects/***/files/og-image-1788183136191.png";

const JSON_LD = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "МЕТРОБУС.РФ",
    url: SITE_URL,
    description:
        "Оценка поездок и маршрутов наземного общественного транспорта Санкт-Петербурга за 10 секунд — без приложений, регистрации и QR-кодов.",
    applicationCategory: "TransportApplication",
    operatingSystem: "Any",
    inLanguage: "ru-RU",
    offers: {"@type": "Offer", price: "0", priceCurrency: "RUB"},
    areaServed: {"@type": "City", name: "Санкт-Петербург"},
    publisher: {"@type": "Organization", name: "ООО «Медиа-Инкод»", url: SITE_URL},
};

const METRIKA_1 = `(function (m, e, t, r, i, k, a) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments) };
    m[i].l = 1 * new Date();
    for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
    k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a)
})(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
ym(101026698, "init", { trustedDomains: ["poehali.dev"], clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true, trackHash: true });`;

const METRIKA_2 = `(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js', 'ym');
ym(99951354, 'init', {clickmap:true, referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});`;

export const Route = createRootRoute({
    head: () => ({
        meta: [
            {charSet: "utf-8"},
            {name: "viewport", content: "width=device-width, initial-scale=1.0"},
            {title: TITLE},
            {name: "description", content: DESCRIPTION},
            {
                name: "keywords",
                content:
                    "оценка транспорта, автобус спб, трамвай спб, троллейбус спб, общественный транспорт, отзывы о маршрутах, качество перевозок",
            },
            {name: "author", content: "МЕТРОБУС.РФ"},
            {name: "robots", content: "index, follow"},
            {name: "theme-color", content: "#0376BB"},
            {name: "apple-mobile-web-app-capable", content: "yes"},
            {name: "apple-mobile-web-app-status-bar-style", content: "black-translucent"},
            {name: "apple-mobile-web-app-title", content: "Метробус"},
            {property: "og:type", content: "website"},
            {property: "og:site_name", content: "МЕТРОБУС.РФ"},
            {property: "og:locale", content: "ru_RU"},
            {property: "og:url", content: SITE_URL},
            {property: "og:title", content: TITLE},
            {property: "og:description", content: DESCRIPTION},
            {property: "og:image:width", content: "1200"},
            {property: "og:image:height", content: "630"},
            {property: "og:image", content: OG_IMAGE},
            {property: "og:image:alt", content: "МЕТРОБУС.РФ — цифровые сервисы пассажира"},
            {name: "twitter:card", content: "summary_large_image"},
            {name: "twitter:title", content: TITLE},
            {name: "twitter:description", content: TWITTER_DESCRIPTION},
            {name: "twitter:image", content: OG_IMAGE},
            ...PLATFORM_META,
        ],
        links: [
            {rel: "stylesheet", href: appCss},
            {rel: "preconnect", href: "https://fonts.googleapis.com"},
            {rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous"},
            {
                rel: "stylesheet",
                href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap",
            },
            {rel: "icon", href: "/favicon.ico", sizes: "48x48"},
            {rel: "icon", href: "/favicon-theme.svg", type: "image/svg+xml"},
            {rel: "apple-touch-icon", href: "/apple-touch-icon.png"},
            {rel: "manifest", href: "/manifest.json"},
            {rel: "alternate", type: "text/plain", href: "/llms.txt", title: "Описание сайта для ИИ-ассистентов"},
        ],
        // IMPORTANT: DO NOT REMOVE PLATFORM SCRIPTS AND THE DEV HMR CLIENT!
        scripts: [
            ...(import.meta.env.DEV ? [{children: HMR_CLIENT}] : []),
            ...PLATFORM_SCRIPTS,
            {type: "application/ld+json", children: JSON.stringify(JSON_LD)},
            {children: METRIKA_1},
            {children: METRIKA_2},
        ],
    }),
    component: RootComponent,
    notFoundComponent: NotFound,
});

function RootComponent() {
    const [queryClient] = useState(() => new QueryClient());
    return (
        <RootDocument>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
                <QueryClientProvider client={queryClient}>
                    <TooltipProvider>
                        <Toaster/>
                        <Sonner/>
                        <Outlet/>
                    </TooltipProvider>
                </QueryClientProvider>
            </ThemeProvider>
        </RootDocument>
    );
}

function RootDocument({children}: { children: ReactNode }) {
    return (
        <html lang="ru" suppressHydrationWarning>
        <head>
            <HeadContent/>
        </head>
        <body>
        {children}
        <noscript>
            <div><img src="https://mc.yandex.ru/watch/101026698" style={{position: "absolute", left: "-9999px"}} alt=""/></div>
            <div><img src="https://mc.yandex.ru/watch/99951354" style={{position: "absolute", left: "-9999px"}} alt=""/></div>
        </noscript>
        <Scripts/>
        </body>
        </html>
    );
}
