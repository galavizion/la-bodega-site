export const SERVICES_LIST = /* groq */ `
*[_type=="service" && defined(slug.current)]
| order(order asc, _createdAt desc){
  _id,
  title,
  "slug": slug.current,
  kicker,
  excerpt,
  featured,
  order,
  coverImage
}
`



export const SERVICE_BY_SLUG = /* groq */ `
*[_type=="service" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  kicker,
  excerpt,
  coverImage,
  gallery,
  benefits,
  deliverables,
  processSteps,
  faqs,
  content,
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
`