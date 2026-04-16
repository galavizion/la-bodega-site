import type { APIRoute } from "astro";
import { createClient } from "@sanity/client";

export const prerender = false;

const client = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET,
  apiVersion: "2025-01-01",
  token: import.meta.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

export const POST: APIRoute = async ({ request }) => {
  if (!import.meta.env.DEV && !import.meta.env.SANITY_WRITE_TOKEN) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
  }

  let ids: string[];
  try {
    const body = await request.json();
    ids = Array.isArray(body.ids) ? body.ids : [];
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400 });
  }

  if (!ids.length) {
    return new Response(JSON.stringify({ error: "Sin IDs" }), { status: 400 });
  }

  try {
    const tx = client.transaction();
    ids.forEach((id) => tx.delete(id));
    await tx.commit();
    return new Response(JSON.stringify({ deleted: ids.length }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Error Sanity" }), { status: 500 });
  }
};
