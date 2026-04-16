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
 * Parsea specs desde un string "Presión Max:300 PSI, Temperatura:180°F"
 * o desde columnas variante_1/2/3 con formato "Medida: 1\""
 */
function specsFromString(raw: string) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const idx = s.indexOf(":");
      if (idx === -1) return { _type: "object", _key: crypto.randomUUID(), label: s, value: "" };
      return {
        _type: "object",
        _key: crypto.randomUUID(),
        label: s.slice(0, idx).trim(),
        value: s.slice(idx + 1).trim(),
      };
    });
}

/**
 * Convierte "si"/"no" o número a valor de stock numérico.
 */
function parseStock(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const lower = raw.toLowerCase().trim();
    if (lower === "si" || lower === "sí" || lower === "yes") return 1;
    if (lower === "no") return 0;
    const n = Number(raw);
    return isNaN(n) ? 0 : n;
  }
  return 0;
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

  // ── Normalizar columnas: soporta formato nuevo (nombre/variante_*) y formato legacy ──
  const title = String(row.nombre || row.title || "").trim();
  if (!title) {
    return new Response(JSON.stringify({ error: "Campo 'nombre' o 'title' requerido" }), { status: 400 });
  }

  // Slug basado en título (para agrupar variantes del mismo producto)
  const productSlug = slugify(title);

  const brand = String(row.marca || row.brand || "").trim();
  const excerpt = String(row.descripcion || row.excerpt || "").trim();

  // Tags: usa categoria como tag si existe, o columna tags
  const tags: string[] = row.categoria
    ? [String(row.categoria).trim()]
    : row.tags
    ? String(row.tags).split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  const certifications: string[] = row.certifications
    ? String(row.certifications).split(",").map((c: string) => c.trim().toLowerCase()).filter(Boolean)
    : [];

  // ── Construir especificaciones de variante ──────────────────────────────────
  let specifications: ReturnType<typeof specsFromString> = [];

  if (row.variante_1 || row.variante_2 || row.variante_3) {
    // Formato nuevo: columnas variante_1, variante_2, variante_3
    for (const key of ["variante_1", "variante_2", "variante_3"]) {
      const raw = String(row[key] || "").trim();
      if (!raw) continue;
      const idx = raw.indexOf(":");
      specifications.push({
        _type: "object",
        _key: crypto.randomUUID(),
        label: idx > -1 ? raw.slice(0, idx).trim() : raw,
        value: idx > -1 ? raw.slice(idx + 1).trim() : "",
      });
    }
  } else if (row.variant_specs) {
    // Formato legacy: string "Presión:300 PSI, ..."
    specifications = specsFromString(String(row.variant_specs));
  }

  // ── Determinar size desde variante_1 (ej: "Medida: 1\"" → "1\"") ──────────
  const firstVariante = String(row.variante_1 || row.variant_size || "").trim();
  const variantSize = firstVariante.includes(":")
    ? firstVariante.split(":").slice(1).join(":").trim()
    : firstVariante;

  // ── Construir objeto variante ───────────────────────────────────────────────
  const variantSku = String(row.sku || row.variant_sku || "").trim();
  const variantPrice = row.precio ?? row.variant_price;
  const variantCompare = row.precio_oferta ?? row.variant_comparePrice;
  const variantStock = parseStock(row.disponible ?? row.variant_stock);

  const hasVariant = variantSku || variantPrice || specifications.length > 0;
  const variant = hasVariant
    ? {
        _type: "object" as const,
        _key: crypto.randomUUID(),
        sku: variantSku,
        size: variantSize,
        label: String(row.variant_label || ""),
        price: variantPrice !== undefined && variantPrice !== "" ? Number(variantPrice) : undefined,
        comparePrice: variantCompare !== undefined && variantCompare !== "" ? Number(variantCompare) : undefined,
        stock: variantStock,
        specifications,
      }
    : null;

  // ── Buscar producto existente por slug o título ─────────────────────────────
  const existingId: string | null = await client.fetch(
    `*[_type=="catalogItem" && (slug.current==$slug || title==$title)][0]._id`,
    { slug: productSlug, title }
  );

  try {
    if (existingId) {
      // ── Actualizar campos base ──────────────────────────────────────────────
      await client.patch(existingId).set({
        title,
        brand,
        excerpt,
        tags,
        certifications,
        published: true,
        ...(row.whatsappPhone ? {
          whatsapp: {
            enabled: true,
            phone: String(row.whatsappPhone),
            message: String(row.whatsappMessage || `Hola, me interesa: ${title}`),
          },
        } : {}),
      }).commit();

      // ── Agregar variante si no existe ya por SKU ────────────────────────────
      if (variant) {
        const existingSkus: string[] = (await client.fetch<string[]>(
          `*[_type=="catalogItem" && _id==$id][0].variants[].sku`,
          { id: existingId }
        )) ?? [];

        if (!existingSkus.includes(variant.sku)) {
          await client.patch(existingId).append("variants", [variant]).commit();
          return new Response(JSON.stringify({ action: "variante agregada", id: existingId }), { status: 200 });
        } else {
          return new Response(JSON.stringify({ action: "variante ya existe (omitida)", id: existingId }), { status: 200 });
        }
      }

      return new Response(JSON.stringify({ action: "actualizado", id: existingId }), { status: 200 });

    } else {
      // ── Crear producto nuevo ────────────────────────────────────────────────
      const doc: Record<string, unknown> & { _type: "catalogItem" } = {
        _type: "catalogItem",
        title,
        slug: { _type: "slug", current: productSlug },
        sku: "",
        brand,
        excerpt,
        tags,
        certifications,
        published: true,
        variants: variant ? [variant] : [],
        whatsapp: {
          enabled: true,
          phone: String(row.whatsappPhone || ""),
          message: String(row.whatsappMessage || `Hola, me interesa: ${title}`),
        },
      };

      const created = await client.create(doc);
      return new Response(JSON.stringify({ action: "creado", id: created._id }), { status: 200 });
    }

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Error Sanity" }), { status: 500 });
  }
};
