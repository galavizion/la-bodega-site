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

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export const POST: APIRoute = async ({ request }) => {
  // Solo en dev o con token de acceso
  if (!import.meta.env.DEV && !import.meta.env.SANITY_WRITE_TOKEN) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
  }

  let row: Record<string, any>;
  try {
    row = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400 });
  }

  const title = String(row.title || "").trim();
  if (!title) {
    return new Response(JSON.stringify({ error: "Campo 'title' requerido" }), { status: 400 });
  }

  const slug = slugify(row.sku ? String(row.sku) : title);

  // Buscar si ya existe por SKU o slug
  const existing = await client.fetch(
    `*[_type=="catalogItem" && (slug.current==$slug || sku==$sku)][0]._id`,
    { slug, sku: String(row.sku || "") }
  );

  const tags = row.tags
    ? String(row.tags).split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  const doc: Record<string, unknown> & { _type: "catalogItem" } = {
    _type: "catalogItem",
    title,
    slug: { _type: "slug", current: slug },
    sku: String(row.sku || ""),
    excerpt: String(row.excerpt || ""),
    brand: String(row.brand || ""),
    tags,
    price: row.price ? Number(row.price) : undefined,
    comparePrice: row.comparePrice ? Number(row.comparePrice) : undefined,
    stock: row.stock !== undefined ? Number(row.stock) : 0,
    published: true,
    whatsapp: row.whatsappPhone
      ? {
          enabled: true,
          phone: String(row.whatsappPhone),
          message: String(row.whatsappMessage || `Hola, me interesa: ${title}`),
        }
      : undefined,
  };

  try {
    if (existing) {
      await client.patch(existing).set(doc).commit();
      return new Response(JSON.stringify({ action: "actualizado", id: existing }), { status: 200 });
    } else {
      const created = await client.create(doc);
      return new Response(JSON.stringify({ action: "creado", id: created._id }), { status: 200 });
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Error Sanity" }), { status: 500 });
  }
};
