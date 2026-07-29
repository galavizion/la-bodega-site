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

/** Descarga una imagen desde una URL y la sube al CDN de Sanity como asset.
 *  Devuelve un objeto { _type:"image", asset:{_type:"reference",_ref:"..."} }
 *  o null si falla la descarga o el upload. */
async function uploadImageFromUrl(url: string, filename: string): Promise<any | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": new URL(url).origin + "/",
        "Accept": "image/webp,image/avif,image/apng,image/*,*/*;q=0.8",
      },
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = contentType.split("/")[1]?.split(";")[0] ?? "jpg";
    const safeFilename = filename.replace(/[^a-z0-9\-]/gi, "-").toLowerCase() + "." + ext;

    const asset = await client.assets.upload("image", buffer, {
      filename: safeFilename,
      contentType,
    });

    return {
      _type: "image",
      asset: { _type: "reference", _ref: asset._id },
    };
  } catch {
    return null;
  }
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

// Corrige mojibake Latin-1→UTF-8 (ej: "Ã¡" → "á")
function fixEncoding(str: string): string {
  if (!str) return str;
  try {
    return decodeURIComponent(escape(str));
  } catch {
    return str;
  }
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

  // Fetch all productCategory docs once to resolve references by title
  const allCategories: { _id: string; title: string }[] = await client.fetch(
    `*[_type == "productCategory"]{ _id, title }`
  );
  const categoryByTitle = new Map(
    allCategories.map((c) => [c.title.toLowerCase().trim(), c._id])
  );

  // ── Normalizar columnas: búsqueda case-insensitive por si hay variación en el Excel ──
  // Busca la clave que corresponde a "nombre" o "title" sin importar mayúsculas/espacios
  const rowKeys = Object.keys(row);
  const findKey = (names: string[]) =>
    rowKeys.find((k) => names.includes(k.trim().toLowerCase())) ?? "";

  const nombreKey = findKey(["nombre", "title", "name", "producto", "product"]);
  const title = fixEncoding(String(nombreKey ? row[nombreKey] : "").trim());

  if (!title) {
    return new Response(
      JSON.stringify({ error: `Campo 'nombre' requerido. Columnas recibidas: ${rowKeys.join(", ")}` }),
      { status: 400 }
    );
  }

  // Slug basado en título (para agrupar variantes del mismo producto)
  const productSlug = slugify(title);

  const brandKey     = findKey(["marca", "brand", "fabricante"]);
  const excerptKey   = findKey(["descripcion corta", "descripción corta", "descripcion", "descripción", "excerpt", "description", "desc", "resumen", "short_description", "short description"]);
  const bodyKey      = findKey(["descripcion detallada", "descripción detallada", "descripcion_detallada", "descripcion_larga", "descripción_larga", "long_description", "long description", "body", "detalle", "detalles", "detail", "details", "contenido", "content"]);
  const categoriaKey = findKey(["categoria", "categoría", "category"]);
  const imageUrlKey = findKey([
    "imagen", "image", "image url", "image_url", "imageurl", "image src", "image_src",
    "imagesrc", "foto", "photo", "thumbnail", "img", "img_url", "img url",
    "imagen_url", "url_imagen", "imagen url", "picture", "picture_url",
    "image link", "image_link", "variant image", "variant_image", "media",
    "url", "src",
  ]);
  const tagsKey       = findKey(["tags", "etiquetas"]);
  const certKey       = findKey(["certifications", "certificaciones"]);
  const boxEnabledKey = findKey(["boxenabled", "box_enabled", "caja_activa", "venta_caja"]);
  const boxUnitsKey   = findKey(["boxunitsperbox", "box_units", "unitsperbox", "piezas_caja", "piezas por caja"]);
  const boxLabelKey   = findKey(["boxlabel", "box_label", "etiqueta_caja"]);
  const skuKey        = findKey(["sku", "codigo", "código", "code"]);
  const basePriceKey  = findKey(["precio", "price"]);
  const precioKey     = findKey(["precio", "price", "variant_price"]);
  const ofertaKey   = findKey(["precio_oferta", "compare_price", "variant_comparePrice", "precio_anterior"]);
  const dispKey     = findKey(["disponible", "stock", "variant_stock", "disponibilidad"]);
  const v1Key       = findKey(["variante_1", "variant_1", "variante1"]);
  const v2Key       = findKey(["variante_2", "variant_2", "variante2"]);
  const v3Key       = findKey(["variante_3", "variant_3", "variante3"]);
  const familySlugKey = findKey(["familyslug", "family_slug", "familia", "familia_slug"]);
  const lengthKey  = findKey(["length", "largo", "length (cm)", "largo (cm)", "largo_cm"]);
  const widthKey   = findKey(["width", "ancho", "width (cm)", "ancho (cm)", "ancho_cm"]);
  const heightKey  = findKey(["height", "alto", "height (cm)", "alto (cm)", "alto_cm"]);
  const weightKey  = findKey(["weight", "peso", "weight (kg)", "peso (kg)", "peso_kg"]);
  const boxLengthKey = findKey(["box_length", "box length", "largo_caja", "largo caja"]);
  const boxWidthKey  = findKey(["box_width", "box width", "ancho_caja", "ancho caja"]);
  const boxHeightKey = findKey(["box_height", "box height", "alto_caja", "alto caja"]);
  const boxWeightKey = findKey(["box_weight", "box weight", "peso_caja", "peso caja"]);

  const brand   = fixEncoding(String(brandKey ? row[brandKey] : "").trim());
  const excerpt = fixEncoding(String(excerptKey ? row[excerptKey] : "").trim());

  // Body: texto (puede tener HTML) → párrafos en portable text
  const bodyRaw = fixEncoding(String(bodyKey ? row[bodyKey] : "").trim());
  const body = bodyRaw
    ? bodyRaw
        // <br> doble o sencillo → separador de párrafo
        .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, "\n\n")
        .replace(/<br\s*\/?>/gi, "\n")
        // quitar cualquier otra etiqueta HTML
        .replace(/<[^>]+>/g, "")
        // separar por doble salto para múltiples párrafos
        .split(/\n{2,}/)
        .map(p => p.replace(/\n/g, " ").trim())
        .filter(Boolean)
        .map(p => ({
          _type: "block",
          _key: crypto.randomUUID(),
          style: "normal",
          markDefs: [],
          children: [{ _type: "span", _key: crypto.randomUUID(), text: p, marks: [] }],
        }))
    : undefined;

  const imageRaw = imageUrlKey && row[imageUrlKey] ? String(row[imageUrlKey]).trim() : "";
  const imageUrl = imageRaw && (imageRaw.startsWith("http://") || imageRaw.startsWith("https://"))
    ? imageRaw
    : undefined;

  // Intentar subir la imagen al CDN de Sanity (server-side, bypasa hotlink protection del browser)
  const coverImageAsset = imageUrl ? await uploadImageFromUrl(imageUrl, slugify(title)) : null;

  const tags: string[] = tagsKey && row[tagsKey]
    ? String(row[tagsKey]).split(",").map((t: string) => fixEncoding(t.trim())).filter(Boolean)
    : [];

  // Resolve category — toma el primer segmento (ej: "CONEXIONES / Codos" → "CONEXIONES")
  const rawCategory = categoriaKey && row[categoriaKey]
    ? fixEncoding(String(row[categoriaKey]).split("/")[0].trim())
    : "";

  let categoryRefId = rawCategory ? categoryByTitle.get(rawCategory.toLowerCase()) : undefined;

  // Si no existe la categoría en Sanity, la crea automáticamente
  if (rawCategory && !categoryRefId) {
    const newCat = await client.create({
      _type: "productCategory",
      title: rawCategory,
      slug: { _type: "slug", current: slugify(rawCategory) },
    });
    categoryRefId = newCat._id;
    categoryByTitle.set(rawCategory.toLowerCase(), newCat._id);
  }

  const categoryRef = categoryRefId
    ? { _type: "reference" as const, _ref: categoryRefId }
    : undefined;

  const certifications: string[] = certKey && row[certKey]
    ? String(row[certKey]).split(",").map((c: string) => c.trim().toLowerCase()).filter(Boolean)
    : [];

  // ── Construir especificaciones de variante ──────────────────────────────────
  let specifications: ReturnType<typeof specsFromString> = [];

  const v1 = fixEncoding(String(v1Key ? row[v1Key] : "").trim());
  const v2 = fixEncoding(String(v2Key ? row[v2Key] : "").trim());
  const v3 = fixEncoding(String(v3Key ? row[v3Key] : "").trim());

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
  const basePriceValue = basePriceKey && row[basePriceKey] !== "" && row[basePriceKey] != null ? Number(row[basePriceKey]) : undefined;

  // ── Dimensiones y peso (opcionales — si no vienen en el Excel, se respeta lo llenado manualmente en Sanity) ──
  const toNum = (key: string) => (key && row[key] !== "" && row[key] != null ? Number(row[key]) : undefined);
  const lengthValue = toNum(lengthKey);
  const widthValue  = toNum(widthKey);
  const heightValue = toNum(heightKey);
  const weightValue = toNum(weightKey);
  const boxLengthValue = toNum(boxLengthKey);
  const boxWidthValue  = toNum(boxWidthKey);
  const boxHeightValue = toNum(boxHeightKey);
  const boxWeightValue = toNum(boxWeightKey);
  const familySlugRaw = familySlugKey ? String(row[familySlugKey] || "").trim() : "";
  const familySlug = familySlugRaw ? slugify(familySlugRaw) : undefined;
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
        ...(lengthValue !== undefined ? { length: lengthValue } : {}),
        ...(widthValue  !== undefined ? { width:  widthValue  } : {}),
        ...(heightValue !== undefined ? { height: heightValue } : {}),
        ...(weightValue !== undefined ? { weight: weightValue } : {}),
      }
    : null;

  // ── Opción de caja ─────────────────────────────────────────────────────────
  const boxEnabledRaw = boxEnabledKey ? row[boxEnabledKey] : undefined;
  const boxUnitsRaw   = boxUnitsKey   ? row[boxUnitsKey]   : undefined;
  const boxLabelRaw   = boxLabelKey   ? row[boxLabelKey]   : undefined;
  const hasBoxData    = boxEnabledRaw !== undefined || boxUnitsRaw !== undefined || boxLabelRaw !== undefined
    || boxLengthValue !== undefined || boxWidthValue !== undefined || boxHeightValue !== undefined || boxWeightValue !== undefined;

  const boxOption = hasBoxData ? {
    enabled:     boxEnabledRaw !== undefined
                   ? String(boxEnabledRaw).toLowerCase() === "true" || boxEnabledRaw === true || String(boxEnabledRaw) === "1"
                   : false,
    unitsPerBox: boxUnitsRaw !== undefined && boxUnitsRaw !== "" ? Number(boxUnitsRaw) : undefined,
    boxLabel:    boxLabelRaw ? String(boxLabelRaw).trim() : undefined,
    ...(boxLengthValue !== undefined ? { length: boxLengthValue } : {}),
    ...(boxWidthValue  !== undefined ? { width:  boxWidthValue  } : {}),
    ...(boxHeightValue !== undefined ? { height: boxHeightValue } : {}),
    ...(boxWeightValue !== undefined ? { weight: boxWeightValue } : {}),
  } : undefined;

  // ── Buscar producto existente por slug o título ─────────────────────────────
  const existingId: string | null = await client.fetch(
    `*[_type=="catalogItem" && (slug.current==$slug || title==$title)][0]._id`,
    { slug: productSlug, title }
  );

  // Si se asigna una familia, hay que asegurar que tenga un "principal" para que se muestre en el catálogo
  let isFamilyRepresentative: boolean | undefined;
  if (familySlug) {
    const hasPrincipal: boolean = await client.fetch(
      `count(*[_type=="catalogItem" && familySlug==$familySlug && isFamilyRepresentative==true && _id!=$excludeId]) > 0`,
      { familySlug, excludeId: existingId ?? "" }
    );
    if (!hasPrincipal) isFamilyRepresentative = true;
  }

  try {
    if (existingId) {
      // ── Actualizar campos base ──────────────────────────────────────────────
      await client.patch(existingId).set({
        title,
        ...(variantSku ? { sku: variantSku } : {}),
        brand,
        excerpt,
        ...(body ? { body } : {}),
        tags,
        certifications,
        ...(basePriceValue != null && !isNaN(basePriceValue) ? { price: basePriceValue } : {}),
        ...(familySlug ? { familySlug } : {}),
        ...(isFamilyRepresentative ? { isFamilyRepresentative } : {}),
        ...(coverImageAsset ? { coverImage: coverImageAsset } : imageUrl ? { imageUrl } : {}),
        ...(categoryRef ? { category: categoryRef } : {}),
        ...(boxOption ? { boxOption } : {}),
        ...(lengthValue !== undefined ? { length: lengthValue } : {}),
        ...(widthValue  !== undefined ? { width:  widthValue  } : {}),
        ...(heightValue !== undefined ? { height: heightValue } : {}),
        ...(weightValue !== undefined ? { weight: weightValue } : {}),
        ...(row.whatsappPhone ? {
          whatsapp: {
            enabled: true,
            phone: String(row.whatsappPhone),
            message: String(row.whatsappMessage || `Hola, me interesa: ${title}`),
          },
        } : {}),
      }).commit();

      // ── Agregar o actualizar variante por SKU ──────────────────────────────
      if (variant) {
        const existingVariants: { _key: string; sku: string }[] = (await client.fetch(
          `*[_type=="catalogItem" && _id==$id][0].variants[]{ _key, sku }`,
          { id: existingId }
        )) ?? [];

        const matchingKey = existingVariants.find((v) => v.sku === variant.sku)?._key;

        if (!matchingKey) {
          await client.patch(existingId).append("variants", [variant]).commit();
          return new Response(JSON.stringify({ action: "variante agregada", id: existingId }), { status: 200 });
        } else {
          // Actualizar campos de la variante existente por su _key
          const patch: Record<string, any> = {};
          if (variant.price        !== undefined) patch[`variants[_key=="${matchingKey}"].price`]        = variant.price;
          if (variant.comparePrice !== undefined) patch[`variants[_key=="${matchingKey}"].comparePrice`] = variant.comparePrice;
          if (variant.stock        !== undefined) patch[`variants[_key=="${matchingKey}"].stock`]        = variant.stock;
          if (variant.size)                       patch[`variants[_key=="${matchingKey}"].size`]         = variant.size;
          if (variant.label)                      patch[`variants[_key=="${matchingKey}"].label`]        = variant.label;
          if (variant.length  !== undefined)      patch[`variants[_key=="${matchingKey}"].length`]       = variant.length;
          if (variant.width   !== undefined)      patch[`variants[_key=="${matchingKey}"].width`]        = variant.width;
          if (variant.height  !== undefined)      patch[`variants[_key=="${matchingKey}"].height`]       = variant.height;
          if (variant.weight  !== undefined)      patch[`variants[_key=="${matchingKey}"].weight`]       = variant.weight;
          if (Object.keys(patch).length) await client.patch(existingId).set(patch).commit();
          return new Response(JSON.stringify({ action: "variante actualizada", id: existingId }), { status: 200 });
        }
      }

      const imgTag = coverImageAsset ? " +img" : imageUrl ? " +img(url)" : "";
      const catTag = categoryRef ? ` +cat(${rawCategory})` : rawCategory ? ` !cat(${rawCategory})` : "";
      return new Response(JSON.stringify({ action: `actualizado${imgTag}${catTag}`, id: existingId }), { status: 200 });

    } else {
      // ── Crear producto nuevo ────────────────────────────────────────────────
      const doc: Record<string, unknown> & { _type: "catalogItem" } = {
        _type: "catalogItem",
        title,
        slug: { _type: "slug", current: productSlug },
        sku: variantSku,
        brand,
        excerpt,
        tags,
        certifications,
        published: true,
        ...(basePriceValue != null && !isNaN(basePriceValue) ? { price: basePriceValue } : {}),
        ...(familySlug ? { familySlug } : {}),
        ...(isFamilyRepresentative ? { isFamilyRepresentative } : {}),
        ...(coverImageAsset ? { coverImage: coverImageAsset } : imageUrl ? { imageUrl } : {}),
        ...(categoryRef ? { category: categoryRef } : {}),
        ...(body ? { body } : {}),
        variants: variant ? [variant] : [],
        ...(boxOption ? { boxOption } : {}),
        ...(lengthValue !== undefined ? { length: lengthValue } : {}),
        ...(widthValue  !== undefined ? { width:  widthValue  } : {}),
        ...(heightValue !== undefined ? { height: heightValue } : {}),
        ...(weightValue !== undefined ? { weight: weightValue } : {}),
        whatsapp: {
          enabled: true,
          phone: String(row.whatsappPhone || ""),
          message: String(row.whatsappMessage || `Hola, me interesa: ${title}`),
        },
      };

      const created = await client.create(doc);
      const imgTag = coverImageAsset ? " +img" : imageUrl ? " +img(url)" : "";
      const catTag = categoryRef ? ` +cat(${rawCategory})` : rawCategory ? ` !cat(no encontrada)` : "";
      return new Response(JSON.stringify({ action: `creado${imgTag}${catTag}`, id: created._id }), { status: 200 });
    }

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Error Sanity" }), { status: 500 });
  }
};
