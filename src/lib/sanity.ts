import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const sanity = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? "a7b3q6z9",
  dataset: import.meta.env.PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: import.meta.env.PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  useCdn: true,
})

const builder = imageUrlBuilder(sanity)
export const urlFor = (source: any) => builder.image(source)

export const sanityClient = sanity