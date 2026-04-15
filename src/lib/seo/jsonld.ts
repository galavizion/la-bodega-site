// src/lib/seo/jsonld.ts

type Img = string | null | undefined;

const clean = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

/* =====================================================
ORGANIZATION
===================================================== */
export const buildOrgSchema = (siteUrl: string, settings?: any) =>
  clean({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings?.siteName || "Ranking Agencia",
    url: siteUrl,
    description:
      settings?.defaultDescription ||
      "Consultoría de SEO, publicidad digital, desarrollo web y automatización para empresas.",
    logo: settings?.logoUrl || `${siteUrl}/media/ranking-agencia.svg`,
    email: settings?.organization?.email || undefined,
    sameAs: settings?.organization?.sameAs || [],
    contactPoint: settings?.organization?.phone
      ? [
          {
            "@type": "ContactPoint",
            telephone: settings.organization.phone,
            contactType: "customer service",
            areaServed: "MX",
            availableLanguage: ["es"],
          },
        ]
      : undefined,
  });
/* =====================================================
WEBSITE
===================================================== */

export const buildWebsiteSchema = (siteUrl: string) =>
  clean({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Ranking Agencia",
    url: siteUrl,
    description:
      "Consultor SEO y estrategias de marketing digital para empresas que buscan generar más clientes desde internet.",
  });

/* =====================================================
BREADCRUMB
===================================================== */

export const buildBreadcrumb = (
  siteUrl: string,
  items: { name: string; url: string }[]
) =>
  clean({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: it.name,
      item: it.url.startsWith("http") ? it.url : `${siteUrl}${it.url}`,
    })),
  });

/* =====================================================
SERVICE
===================================================== */

export const buildServiceSchema = (args: {
  siteUrl: string;
  name: string;
  description?: string;
  url: string;
  image?: Img;
  price?: number | null;
  priceCurrency?: string;
}) =>
  clean({
    "@context": "https://schema.org",
    "@type": "Service",
    name: args.name,
    description: args.description,
    url: args.url.startsWith("http")
      ? args.url
      : `${args.siteUrl}${args.url}`,
    image: args.image || undefined,

    provider: {
      "@type": "Organization",
      name: "Ranking Agencia",
      url: args.siteUrl,
    },

    areaServed: {
      "@type": "Country",
      name: "Mexico",
    },

    offers:
      args.price != null
        ? {
            "@type": "Offer",
            priceCurrency: args.priceCurrency || "MXN",
            price: args.price,
            url: args.url.startsWith("http")
              ? args.url
              : `${args.siteUrl}${args.url}`,
            availability: "https://schema.org/InStock",
          }
        : undefined,
  });

/* =====================================================
PRODUCT
===================================================== */

export const buildProductSchema = (args: {
  siteUrl: string;
  name: string;
  description?: string;
  url: string;
  image?: Img;
  price?: number | null;
  priceCurrency?: string;
  sku?: string;
  brand?: string;
}) =>
  clean({
    "@context": "https://schema.org",
    "@type": "Product",
    name: args.name,
    description: args.description,
    image: args.image ? [args.image] : undefined,
    sku: args.sku,

    brand: {
      "@type": "Brand",
      name: args.brand || "Ranking Agencia",
    },

    offers:
      args.price != null
        ? {
            "@type": "Offer",
            priceCurrency: args.priceCurrency || "MXN",
            price: args.price,
            url: args.url.startsWith("http")
              ? args.url
              : `${args.siteUrl}${args.url}`,
            availability: "https://schema.org/InStock",
          }
        : undefined,
  });

/* =====================================================
ARTICLE
===================================================== */

export const buildArticleSchema = (args: {
  siteUrl: string;
  headline: string;
  description?: string;
  url: string;
  image?: Img;
  datePublished?: string;
  dateModified?: string;
}) =>
  clean({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: args.headline,
    description: args.description,

    mainEntityOfPage: args.url.startsWith("http")
      ? args.url
      : `${args.siteUrl}${args.url}`,

    image: args.image ? [args.image] : undefined,

    datePublished: args.datePublished,
    dateModified: args.dateModified || args.datePublished,

    author: {
      "@type": "Organization",
      name: "Ranking Agencia",
      url: args.siteUrl,
    },

    publisher: {
      "@type": "Organization",
      name: "Ranking Agencia",
      url: args.siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${args.siteUrl}/media/ranking-agencia.svg`,
      },
    },
  });