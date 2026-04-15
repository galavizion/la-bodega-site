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

/**
 * Parsea especificaciones técnicas desde string.
 * Formato: "Presión Max:300 PSI, Temperatura:180°F"
 */
function parseSpecs(raw: string) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [label, ...rest] = s.split(":");
      return { _type: "object", _key: crypto.randomUUID(), label: label.trim(), value: rest.join(":").trim() };
    });
}

export const POST: APIRoute = async ({ request }) => {
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

  // El slug del producto se basa en el SKU principal o el título
  const productSlug = slugify(row.sku ? String(row.sku) : title);

  const tags = row.tags
    ? String(row.tags).split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  const certifications = row.certifications
    ? String(row.certifications).split(",").map((c: string) => c.trim().toLowerCase()).filter(Boolean)
    : [];

  // ── Construir variante si hay datos de variante en la fila ──
  const hasVariant = row.variant_sku || row.variant_size || row.variant_price;
  const variant = hasVariant
    ? {
        _type: "object" as const,
        _key: crypto.randomUUID(),
        sku:          String(row.variant_sku   || ""),
        size:         String(row.variant_size  || ""),
        label:        String(row.variant_label || ""),
        price:        row.variant_price ? Number(row.variant_price) : undefined,
        comparePrice: row.variant_comparePrice ? Number(row.variant_comparePrice) : undefined,
        stock:        row.variant_stock !== undefined ? Number(row.variant_stock) : 0,
        specifications: parseSpecs(String(row.variant_specs || "")),
      }
    : null;

  // ── Buscar si el producto ya existe (por SKU principal o título exacto) ──
  const existingId: string | null = await client.fetch(
    `*[_type=="catalogItem" && (slug.current==$slug || sku==$sku || title==$title)][0]._id`,
    { slug: productSlug, sku: String(row.sku || ""), title }
  );

  try {
    if (existingId) {
      // ── Actualizar campos base ──────────────────────────
      await client.patch(existingId).set({
        title,
        sku:    String(row.sku    || ""),
        brand:  String(row.brand  || ""),
        excerpt: String(row.excerpt || ""),
        tags,
        certifications,
        published: true,
        ...(row.whatsappPhone ? {
          whatsapp: {
            enabled: true,
            phone:   String(row.whatsappPhone),
            message: String(row.whatsappMessage || `Hola, me interesa: ${title}`),
          },
        } : {}),
      }).commit();

      // ── Agregar variante si no existe ya por SKU ────────
      if (variant) {
        const existing = await client.fetch<string[]>(
          `*[_type=="catalogItem" && _id==$id][0].variants[].sku`,
          { id: existingId }
        );
        const existingSkus: string[] = existing ?? [];

        if (!existingSkus.includes(variant.sku)) {
          await client.patch(existingId).append("variants", [variant]).commit();
          return new Response(JSON.stringify({ action: "variante agregada", id: existingId }), { status: 200 });
        } else {
          return new Response(JSON.stringify({ action: "variante ya existe (omitida)", id: existingId }), { status: 200 });
        }
      }

      return new Response(JSON.stringify({ action: "actualizado", id: existingId }), { status: 200 });

    } else {
      // ── Crear producto nuevo ────────────────────────────
      const doc: Record<string, unknown> & { _type: "catalogItem" } = {
        _type: "catalogItem",
        title,
        slug: { _type: "slug", current: productSlug },
        sku:    String(row.sku    || ""),
        brand:  String(row.brand  || ""),
        excerpt: String(row.excerpt || ""),
        tags,
        certifications,
        published: true,
        variants: variant ? [variant] : [],
        ...(row.whatsappPhone ? {
          whatsapp: {
            enabled: true,
            phone:   String(row.whatsappPhone),
            message: String(row.whatsappMessage || `Hola, me interesa: ${title}`),
          },
        } : {}),
      };

      const created = await client.create(doc);
      return new Response(JSON.stringify({ action: "creado", id: created._id }), { status: 200 });
    }

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Error Sanity" }), { status: 500 });
  }
};
