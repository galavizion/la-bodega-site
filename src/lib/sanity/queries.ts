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
      fullWidth,
      textAlign,
      heading,
      subheading,
      bullets,
      image,
      bgColor,
      bgImage,
      aspectRatio,
      bgOverlay,
      centerImage,
      minHeight,
      mapUrl,
      mapFullWidth,
      primaryCta,
      secondaryCta,
      settings
    },

    _type == "sectionBenefits" => {
      title,
      subtitle,
      bgColor,
      textAlign,
      items[]{
        title,
        description,
        highlight,
        icon
      },
      cta{ label, url },
      settings
    },

    _type == "sectionProcess" => {
      title,
      subtitle,
      bgColor,
      textAlign,
      steps[]{
        title,
        description,
        icon
      },
      cta{ label, url },
      settings
    },

    _type == "sectionFAQ" => {
      title,
      subtitle,
      bgColor,
      textAlign,
      faqs[]{
        question,
        answer
      },
      cta{ label, url },
      settings
    },

    _type == "sectionCTA" => {
      title,
      subtitle,
      bgColor,
      textAlign,
      primaryCta,
      secondaryCta,
      settings
    },

    _type == "sectionContentSplit" => {
      sectionId,
      title,
      layout,
      imageSide,
      bgColor,
      textAlign,
      image,
      youtubeUrl,
      content,
      cta{ label, url },
      settings
    },

    _type == "sectionRichText" => {
      title,
      bgColor,
      textAlign,
      content,
      cta{ label, url },
      settings
    },

    _type == "sectionCards" => {
      title,
      subtitle,
      columns,
      cardStyle,
      bgColor,
      textAlign,
      items[]{
        _key,
        badge,
        image,
        title,
        description,
        linkLabel,
        linkUrl
      },
      cta{ label, url },
      settings
    },

    _type == "sectionSpace" => { height, bgColor },

    _type == "sectionForm" => {
      title,
      subtitle,
      bgColor,
      textAlign,
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
      cta{ label, url },
      whatsappFallback{
        enabled,
        phone,
        label
      },
      settings
    },

    _type == "sectionProductsCarousel" => {
      title,
      subtitle,
      sourceType,
      limit,
      "categoryFilterRef": categoryFilter._ref,
      "manualItems": manualItems[]->{
        "_id": _id,
        "title": title,
        "slug": slug.current,
        "image": coverImage,
        "imageUrl": imageUrl,
        "subtitle": excerpt,
        "brand": brand,
        "price": price
      },
      cta{ label, url, style },
      bgColor,
      settings
    },

    _type == "sectionSharedRef" => {
      "resolvedSection": ref->section[0]
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
      fullWidth,
      textAlign,
      heading,
      subheading,
      bullets,
      image,
      bgColor,
      bgImage,
      aspectRatio,
      bgOverlay,
      centerImage,
      minHeight,
      mapUrl,
      mapFullWidth,
      primaryCta,
      secondaryCta,
      settings
    },

    _type == "sectionBenefits" => {
      title,
      subtitle,
      bgColor,
      textAlign,
      items[]{
        title,
        description,
        highlight,
        icon
      },
      cta{ label, url },
      settings
    },

    _type == "sectionProcess" => {
      title,
      subtitle,
      bgColor,
      textAlign,
      steps[]{
        title,
        description,
        icon
      },
      cta{ label, url },
      settings
    },

    _type == "sectionFAQ" => {
      title,
      subtitle,
      bgColor,
      textAlign,
      faqs[]{
        question,
        answer
      },
      cta{ label, url },
      settings
    },

    _type == "sectionCTA" => {
      title,
      subtitle,
      bgColor,
      textAlign,
      primaryCta,
      secondaryCta,
      settings
    },

    _type == "sectionContentSplit" => {
      sectionId,
      title,
      layout,
      imageSide,
      bgColor,
      textAlign,
      image,
      youtubeUrl,
      content,
      cta{ label, url },
      settings
    },

    _type == "sectionRichText" => {
      title,
      bgColor,
      textAlign,
      content,
      cta{ label, url },
      settings
    },

    _type == "sectionCards" => {
      title,
      subtitle,
      columns,
      cardStyle,
      bgColor,
      textAlign,
      items[]{
        _key,
        badge,
        image,
        title,
        description,
        linkLabel,
        linkUrl
      },
      cta{ label, url },
      settings
    },

    _type == "sectionSpace" => { height, bgColor },

    _type == "sectionForm" => {
      title,
      subtitle,
      bgColor,
      textAlign,
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
      cta{ label, url },
      whatsappFallback{
        enabled,
        phone,
        label
      },
      settings
    },

    _type == "sectionProductsCarousel" => {
      title,
      subtitle,
      sourceType,
      limit,
      "categoryFilterRef": categoryFilter._ref,
      "manualItems": manualItems[]->{
        "_id": _id,
        "title": title,
        "slug": slug.current,
        "image": coverImage,
        "imageUrl": imageUrl,
        "subtitle": excerpt,
        "brand": brand,
        "price": price
      },
      cta{ label, url, style },
      bgColor,
      settings
    },

    _type == "sectionSharedRef" => {
      "resolvedSection": ref->section[0]
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
*[_type == "catalogItem" && defined(slug.current) && published != false] | order(_createdAt desc) {
  _id,
  title,
  "slug": slug.current,
  excerpt,
  category,
  coverImage,
  imageUrl,
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
  "category": category->title,
  coverImage,
  imageUrl,
  body,
  price,
  comparePrice,
  priceLabel,
  variants[]{
    sku,
    size,
    label,
    price,
    comparePrice,
    stock,
    specifications[]{ label, value },
    "variantImageUrl": variantImage.asset->url
  },
  boxOption{ enabled, unitsPerBox, boxMarkupPercent, boxLabel },
  whatsapp{ enabled, phone, message },
  seo{
    title,
    description,
    canonical,
    noindex,
    ogImage{ asset->{ url } }
  }
}
`;


export const CATALOG_BY_CATEGORY = groq`
{
  "category": *[_type == "productCategory" && slug.current == $catSlug][0]{
    _id, title, "slug": slug.current, description
  },
  "items": *[
    _type == "catalogItem" &&
    defined(slug.current) &&
    published != false &&
    category->slug.current == $catSlug &&
    (!defined(familySlug) || isFamilyRepresentative == true) &&
    ($q == "" || title match $q + "*" || excerpt match $q + "*")
  ] | order(_createdAt desc) [$from...$to] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    coverImage,
    imageUrl,
    price,
    priceLabel,
    familySlug,
    "familyCount": select(
      defined(familySlug) => count(*[_type=="catalogItem" && familySlug==^.familySlug && published!=false]),
      0
    ),
    boxOption{ enabled, unitsPerBox, boxMarkupPercent, boxLabel },
    whatsapp{ enabled, phone, message }
  },
  "total": count(*[
    _type == "catalogItem" &&
    defined(slug.current) &&
    published != false &&
    category->slug.current == $catSlug &&
    (!defined(familySlug) || isFamilyRepresentative == true) &&
    ($q == "" || title match $q + "*" || excerpt match $q + "*")
  ])
}
`;

export const PRODUCT_CATEGORIES_QUERY = groq`
*[_type == "productCategory" && !defined(parent)] | order(order asc) {
  _id,
  title,
  "slug": slug.current
}
`;

export const SITE_SETTINGS_QUERY = groq`
{
  // ── General ────────────────────────────────────────────
  // coalesce: nuevo documento → fallback al documento original
  "siteName":   coalesce(*[_type == "siteSettingsGeneral"][0].siteName,   *[_type == "siteSettings"][0].siteName),
  "siteUrl":    coalesce(*[_type == "siteSettingsGeneral"][0].siteUrl,    *[_type == "siteSettings"][0].siteUrl),
  "logoUrl":    coalesce(*[_type == "siteSettingsGeneral"][0].logo.asset->url,    *[_type == "siteSettings"][0].logo.asset->url),
  "logoAltUrl": coalesce(*[_type == "siteSettingsGeneral"][0].logoAlt.asset->url, *[_type == "siteSettings"][0].logoAlt.asset->url),
  "organization": coalesce(
    *[_type == "siteSettingsGeneral"][0].organization,
    *[_type == "siteSettings"][0].organization
  ){ phone, whatsapp, email, sameAs },
  "orderNotifyEmails": coalesce(
    *[_type == "siteSettingsGeneral"][0].orderNotifyEmails,
    *[_type == "siteSettings"][0].orderNotifyEmails
  ),

  // ── Menú ───────────────────────────────────────────────
  "navigation": coalesce(
    *[_type == "siteSettingsMenu"][0].navigation,
    *[_type == "siteSettings"][0].navigation
  )[]{
    "iconUrl": icon.asset->url,
    label,
    type,
    anchorId,
    externalUrl,
    internalPage->{ "slug": slug.current, title },
    productCategory->{ "slug": slug.current, title },
    children[]{
      "iconUrl": icon.asset->url,
      label,
      type,
      anchorId,
      externalUrl,
      internalPage->{ "slug": slug.current, title },
      productCategory->{ "slug": slug.current, title }
    }
  },

  // ── Header ─────────────────────────────────────────────
  "topBar": coalesce(
    *[_type == "siteSettingsHeader"][0].topBar,
    *[_type == "siteSettings"][0].topBar
  ){ enabled, text, linkLabel, linkUrl, bgColor },
  "headerSocial": coalesce(*[_type == "siteSettingsHeader"][0].headerSocial, *[_type == "siteSettings"][0].headerSocial),
  "social": coalesce(
    *[_type == "siteSettingsHeader"][0].social,
    *[_type == "siteSettings"][0].social
  ){ facebook, instagram, linkedin, youtube, tiktok, whatsapp },
  "cta": coalesce(
    *[_type == "siteSettingsHeader"][0].cta,
    *[_type == "siteSettings"][0].cta
  ){ label, url },

  // ── Footer ─────────────────────────────────────────────
  "footerMatriz": coalesce(
    *[_type == "siteSettingsFooter"][0].footerMatriz,
    *[_type == "siteSettings"][0].footerMatriz
  ){ colTitle, name, address, phone },
  "footerCategoriesTitle": coalesce(*[_type == "siteSettingsFooter"][0].footerCategoriesTitle, *[_type == "siteSettings"][0].footerCategoriesTitle),
  "footerNavTitle":        coalesce(*[_type == "siteSettingsFooter"][0].footerNavTitle,        *[_type == "siteSettings"][0].footerNavTitle),
  "footerSocialTitle":     coalesce(*[_type == "siteSettingsFooter"][0].footerSocialTitle,     *[_type == "siteSettings"][0].footerSocialTitle),
  "footerBranches": coalesce(
    *[_type == "siteSettingsFooter"][0].footerBranches,
    *[_type == "siteSettings"][0].footerBranches
  )[]{  name, url, address, phone },
  "footerCtaLabel":  coalesce(*[_type == "siteSettingsFooter"][0].footerCtaLabel,  *[_type == "siteSettings"][0].footerCtaLabel),
  "footerCtaUrl":    coalesce(*[_type == "siteSettingsFooter"][0].footerCtaUrl,    *[_type == "siteSettings"][0].footerCtaUrl),
  "footerCopyright": coalesce(*[_type == "siteSettingsFooter"][0].footerCopyright, *[_type == "siteSettings"][0].footerCopyright),

  // ── SEO ────────────────────────────────────────────────
  "defaultTitle":       coalesce(*[_type == "siteSettingsSeo"][0].defaultTitle,       *[_type == "siteSettings"][0].defaultTitle),
  "defaultDescription": coalesce(*[_type == "siteSettingsSeo"][0].defaultDescription, *[_type == "siteSettings"][0].defaultDescription),
  "defaultOgImage":     coalesce(*[_type == "siteSettingsSeo"][0].defaultOgImage.asset->url, *[_type == "siteSettings"][0].defaultOgImage.asset->url),

  // ── Códigos ────────────────────────────────────────────
  "analyticsId":               coalesce(*[_type == "siteSettingsCodes"][0].analyticsId,               *[_type == "siteSettings"][0].analyticsId),
  "tagManagerId":              coalesce(*[_type == "siteSettingsCodes"][0].tagManagerId,              *[_type == "siteSettings"][0].tagManagerId),
  "adsenseClient":             coalesce(*[_type == "siteSettingsCodes"][0].adsenseClient,             *[_type == "siteSettings"][0].adsenseClient),
  "searchConsoleVerification": coalesce(*[_type == "siteSettingsCodes"][0].searchConsoleVerification, *[_type == "siteSettings"][0].searchConsoleVerification),

  // ── Tienda ─────────────────────────────────────────────
  // ── Pago ──────────────────────────────────────────────
  "payment": *[_type == "siteSettingsPayment"][0]{
    transferEnabled, bankName, accountHolder, clabe, accountNumber,
    reference, instructions, proofWhatsapp, notifyEmail
  },

  // ── Tienda ─────────────────────────────────────────────
  "shopCurrency":      coalesce(*[_type == "siteSettingsShop"][0].currency,         *[_type == "siteSettings"][0].shop.currency,      "USD"),
  "usdRate":           coalesce(*[_type == "siteSettingsShop"][0].usdRate,           *[_type == "siteSettings"][0].shop.usdRate,        17),
  "markupPercent":     coalesce(*[_type == "siteSettingsShop"][0].markupPercent,     *[_type == "siteSettings"][0].shop.markupPercent,  26.5),
  "boxMarkupPercent":  coalesce(*[_type == "siteSettingsShop"][0].boxMarkupPercent,  0),
}
`;