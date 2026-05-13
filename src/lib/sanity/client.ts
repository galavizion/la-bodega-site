import { createClient } from "@sanity/client";

export const client = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? "a7b3q6z9",
  dataset: import.meta.env.PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-01-01",
  useCdn: import.meta.env.PROD
});

export async function sanityFetch<T>({
  query,
  params = {},
}: {
  query: string;
  params?: Record<string, any>;
}): Promise<T> {
  return client.fetch(query, params);
}