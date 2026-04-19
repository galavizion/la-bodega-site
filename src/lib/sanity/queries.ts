// src/lib/sanity/queries.ts
import groq from "groq";

// ✅ Home (único)
export const homeQuery = groq`
*[_type=="page" && pageType=="home"][0]{
  title,
  pageType,
  background,
  seo{
    title,
    description,
    canonical,
    noindex,
    ogImage{
      asset->{
        url
      }
    }
  },
  sections[]{
    _key,
    _type,

    _type == "sectionHero" => {
      visualStyle,
      heading,
      subheading,
      bullets,
      image,
      bgImage,
      bgOverlay,
      centerImage,
      mapUrl,
      primaryCta,
      secondaryCta,
      settings
    },

    _type == "sectionBenefits" => {
      title,
      subtitle,
      items[]{
        title,
        description,
        highlight,
        icon
      },
      settings
    },

    _type == "sectionProcess" => {
      title,
      subtitle,
      steps[]{
        title,
        description,
        icon
      },
      settings
    },

    _type == "sectionFAQ" => {
      title,
      subtitle,
      faqs[]{
        question,
        answer
      },
      settings
    },

    _type == "sectionCTA" => {
      title,
      subtitle,
      primaryCta,
      secondaryCta,
      settings
    },

    _type == "sectionContentSplit" => {
      sectionId,
      title,
      layout,
      imageSide,
      image,
      content,
      settings
    },

    _type == "sectionRichText" => {
      title,
      content,
      settings
    },

    _type == "sectionCards" => {
      title,
      subtitle,
      columns,
      cardStyle,
      bgColor,
      items[]{
        _key,
        badge,
        image,
        title,
        description,
        linkLabel,
        linkUrl
      },
      settings
    },

    _type == "sectionForm" => {
      title,
      subtitle,
      formType,
      fields[]{
        _key,
        type,
        label,
        placeholder,
        required,
        options
      },
      submitLabel,
      successMessage,
      whatsappFallback{
        enabled,
        phone,
        label
      },
      settings
    }
  }
}
`;

// ✅ Cualquier página por slug (service/landing)
export const pageBySlugQuery = groq`
*[_type=="page" && slug.current==$slug][0]{
  title,
  pageType,
  "slug": slug.current,
  background,
  seo{
    title,
    description,
    canonical,
    noindex,
    ogImage{
      asset->{
        url
      }
    }
  },
  sections[]{
    _key,
    _type,

    _type == "sectionHero" => {
      visualStyle,
      heading,
      subheading,
      bullets,
      image,
      bgImage,
      bgOverlay,
      centerImage,
      mapUrl,
      primaryCta,
      secondaryCta,
      settings
    },

    _type == "sectionBenefits" => {
      title,
      subtitle,
      items[]{
        title,
        description,
        highlight,
        icon
      },
      settings
    },

    _type == "sectionProcess" => {
      title,
      subtitle,
      steps[]{
        title,
        description,
        icon
      },
      settings
    },

    _type == "sectionFAQ" => {
      title,
      subtitle,
      faqs[]{
        question,
        answer
      },
      settings
    },

    _type == "sectionCTA" => {
      title,
      subtitle,
      primaryCta,
      secondaryCta,
      settings
    },

    _type == "sectionContentSplit" => {
      sectionId,
      title,
      layout,
      imageSide,
      image,
      content,
      settings
    },

    _type == "sectionRichText" => {
      title,
      content,
      settings
    },

    _type == "sectionCards" => {
      title,
      subtitle,
      columns,
      cardStyle,
      bgColor,
      items[]{
        _key,
        badge,
        image,
        title,
        description,
        linkLabel,
        linkUrl
      },
      settings
    },

    _type == "sectionForm" => {
      title,
      subtitle,
      formType,
      fields[]{
        _key,
        type,
        label,
        placeholder,
        required,
        options
      },
      submitLabel,
      successMessage,
      whatsappFallback{
        enabled,
        phone,
        label
      },
      settings
    }
  }
}
`;

// ✅ Slugs para prerender (solo service/landing)
export const allPageSlugsQuery = groq`
*[_type=="page" && pageType in ["service","landing"] && defined(slug.current)][]{
  "slug": slug.current,
  pageType
}
`;

export const CATALOG_LIST = groq`
*[_type == "catalogItem" && defined(slug.current)] | order(_createdAt desc) {
  _id,
  title,
  "slug": slug.current,
  excerpt,
  category,
  coverImage,
  price,
  priceLabel,
  whatsapp{
    enabled,
    phone,
    message
  }
}
`;

export const CATALOG_BY_SLUG = groq`
*[_type == "catalogItem" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  excerpt,
  category,
  coverImage,
  body,
  price,
  priceLabel,
  whatsapp{
    enabled,
    phone,
    message
  },
  seo{
    title,
    description,
    canonical,
    noindex,
    ogImage{
      asset->{
        url
      }
    }
  }
}
`;


export const SITE_SETTINGS_QUERY = groq`
*[_type == "siteSettings"][0]{
  siteName,
  siteUrl,
  defaultTitle,
  defaultDescription,
  "defaultOgImage": defaultOgImage.asset->url,
  analyticsId,
  tagManagerId,
  adsenseClient,
  searchConsoleVerification,

  "logoUrl": logo.asset->url,
  "logoAltUrl": logoAlt.asset->url,

  topBar{
    enabled,
    text,
    linkLabel,
    linkUrl,
    bgColor
  },

  headerSocial,

  social{
    facebook,
    instagram,
    linkedin,
    youtube,
    tiktok,
    whatsapp
  },

  cta{
    label,
    url
  },

  organization{
    phone,
    whatsapp,
    email,
    sameAs
  },

  navigation[]{
    label,
    type,
    anchorId,
    externalUrl,
    internalPage->{ "slug": slug.current, title },
    children[]{
      label,
      type,
      anchorId,
      externalUrl,
      internalPage->{ "slug": slug.current, title }
    }
  },

  footerTagline,
  footerColumns[]{
    title,
    links[]{ label, url }
  },
  footerLocations[]{
    city,
    phone,
    whatsapp,
    email
  },
  footerCtaLabel,
  footerCtaUrl,
  footerCopyright
}
`;