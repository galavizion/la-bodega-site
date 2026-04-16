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

  // ── Normalizar columnas: búsqueda case-insensitive por si hay variación en el Excel ──
  // Busca la clave que corresponde a "nombre" o "title" sin importar mayúsculas/espacios
  const rowKeys = Object.keys(row);
  const findKey = (names: string[]) =>
    rowKeys.find((k) => names.includes(k.trim().toLowerCase())) ?? "";

  const nombreKey = findKey(["nombre", "title", "name", "producto", "product"]);
  const title = String(nombreKey ? row[nombreKey] : "").trim();

  if (!title) {
    return new Response(
      JSON.stringify({ error: `Campo 'nombre' requerido. Columnas recibidas: ${rowKeys.join(", ")}` }),
      { status: 400 }
    );
  }

  // Slug basado en título (para agrupar variantes del mismo producto)
  const productSlug = slugify(title);

  const brandKey    = findKey(["marca", "brand", "fabricante"]);
  const excerptKey  = findKey(["descripcion", "descripción", "excerpt", "description"]);
  const categoriaKey = findKey(["categoria", "categoría", "category"]);
  const tagsKey     = findKey(["tags", "etiquetas"]);
  const certKey     = findKey(["certifications", "certificaciones"]);
  const skuKey      = findKey(["sku", "codigo", "código", "code"]);
  const precioKey   = findKey(["precio", "price", "variant_price"]);
  const ofertaKey   = findKey(["precio_oferta", "compare_price", "variant_comparePrice", "precio_anterior"]);
  const dispKey     = findKey(["disponible", "stock", "variant_stock", "disponibilidad"]);
  const v1Key       = findKey(["variante_1", "variant_1", "variante1"]);
  const v2Key       = findKey(["variante_2", "variant_2", "variante2"]);
  const v3Key       = findKey(["variante_3", "variant_3", "variante3"]);

  const brand   = String(brandKey   ? row[brandKey]   : "").trim();
  const excerpt = String(excerptKey ? row[excerptKey] : "").trim();

  const tags: string[] = categoriaKey && row[categoriaKey]
    ? [String(row[categoriaKey]).trim()]
    : tagsKey && row[tagsKey]
    ? String(row[tagsKey]).split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  const certifications: string[] = certKey && row[certKey]
    ? String(row[certKey]).split(",").map((c: string) => c.trim().toLowerCase()).filter(Boolean)
    : [];

  // ── Construir especificaciones de variante ──────────────────────────────────
  let specifications: ReturnType<typeof specsFromString> = [];

  const v1 = String(v1Key ? row[v1Key] : "").trim();
  const v2 = String(v2Key ? row[v2Key] : "").trim();
  const v3 = String(v3Key ? row[v3Key] : "").trim();

  if (v1 || v2 || v3) {
    for (const raw of [v1, v2, v3]) {
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
    specifications = specsFromString(String(row.variant_specs));
  }

  // ── Determinar size desde variante_1 (ej: "Medida: 1\"" → "1\"") ──────────
  const variantSize = v1.includes(":")
    ? v1.split(":").slice(1).join(":").trim()
    : v1;

  // ── Construir objeto variante ───────────────────────────────────────────────
  const variantSku   = String(skuKey  ? row[skuKey]  : row.variant_sku  || "").trim();
  const variantPrice = precioKey ? row[precioKey] : row.variant_price;
  const variantCompare = ofertaKey ? row[ofertaKey] : row.variant_comparePrice;
  const variantStock = parseStock(dispKey ? row[dispKey] : row.variant_stock);

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
