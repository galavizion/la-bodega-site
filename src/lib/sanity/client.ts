import { createClient } from "@sanity/client";

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET;

if (!projectId) throw new Error("Missing PUBLIC_SANITY_PROJECT_ID");
if (!dataset) throw new Error("Missing PUBLIC_SANITY_DATASET");

export const client = createClient({
  projectId,
  dataset,
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