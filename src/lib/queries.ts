
export const POSTS_LIST = /* groq */ `
  *[_type == "post" && defined(slug.current)]
  | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    mainImage,
    "authorName": author->name
  }
`

export const POST_BY_SLUG = /* groq */ `
  *[_type == "post" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    mainImage,
    body,
    "authorName": author->name
  }
`
// lib/queries.js
export const siteSettingsQuery = /* groq */ `
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

  cta{
    label,
    url
  },

  organization{
    phone,
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
  }
}
`;