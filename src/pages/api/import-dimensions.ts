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

/**
 * Importador exclusivo de dimensiones/peso (Length, Width, Height, Weight).
 * NO toca ningún otro campo del producto (nombre, precio, imágenes, etc).
 * Empareja por SKU: primero busca en variantes, si no encuentra usa el SKU principal del producto.
 */

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

  const rowKeys = Object.keys(row);
  const findKey = (names: string[]) =>
    rowKeys.find((k) => names.includes(k.trim().toLowerCase())) ?? "";

  const skuKey    = findKey(["sku", "codigo", "código", "code"]);
  const lengthKey = findKey(["length", "largo", "length (cm)", "largo (cm)", "largo_cm"]);
  const widthKey  = findKey(["width", "ancho", "width (cm)", "ancho (cm)", "ancho_cm"]);
  const heightKey = findKey(["height", "alto", "height (cm)", "alto (cm)", "alto_cm"]);
  const weightKey = findKey(["weight", "peso", "weight (kg)", "peso (kg)", "peso_kg"]);
  const boxLengthKey = findKey(["box_length", "box length", "largo_caja", "largo caja"]);
  const boxWidthKey  = findKey(["box_width", "box width", "ancho_caja", "ancho caja"]);
  const boxHeightKey = findKey(["box_height", "box height", "alto_caja", "alto caja"]);
  const boxWeightKey = findKey(["box_weight", "box weight", "peso_caja", "peso caja"]);

  const sku = skuKey ? String(row[skuKey]).trim() : "";
  if (!sku) {
    return new Response(
      JSON.stringify({ error: `Campo 'sku' requerido. Columnas recibidas: ${rowKeys.join(", ")}` }),
      { status: 400 }
    );
  }

  const toNum = (key: string) => (key && row[key] !== "" && row[key] != null ? Number(row[key]) : undefined);
  const lengthValue = toNum(lengthKey);
  const widthValue  = toNum(widthKey);
  const heightValue = toNum(heightKey);
  const weightValue = toNum(weightKey);
  const boxLengthValue = toNum(boxLengthKey);
  const boxWidthValue  = toNum(boxWidthKey);
  const boxHeightValue = toNum(boxHeightKey);
  const boxWeightValue = toNum(boxWeightKey);

  const hasProductDims = [lengthValue, widthValue, heightValue, weightValue].some((v) => v !== undefined);
  const hasBoxDims = [boxLengthValue, boxWidthValue, boxHeightValue, boxWeightValue].some((v) => v !== undefined);

  if (!hasProductDims && !hasBoxDims) {
    return new Response(JSON.stringify({ error: `Fila sin ninguna medida (sku: ${sku})` }), { status: 400 });
  }

  // Busca primero por SKU de variante, si no por SKU principal del producto
  const match: { _id: string; variantKey?: string } | null = await client.fetch(
    `*[_type=="catalogItem" && $sku in variants[].sku][0]{
      "_id": _id, "variantKey": variants[sku==$sku][0]._key
    }`,
    { sku }
  );

  const target = match ?? (await client.fetch(
    `*[_type=="catalogItem" && sku==$sku][0]{ "_id": _id }`,
    { sku }
  ));

  if (!target?._id) {
    return new Response(JSON.stringify({ error: `No se encontró producto/variante con SKU: ${sku}` }), { status: 404 });
  }

  const patch: Record<string, any> = {};

  if (target.variantKey) {
    if (lengthValue !== undefined) patch[`variants[_key=="${target.variantKey}"].length`] = lengthValue;
    if (widthValue  !== undefined) patch[`variants[_key=="${target.variantKey}"].width`]  = widthValue;
    if (heightValue !== undefined) patch[`variants[_key=="${target.variantKey}"].height`] = heightValue;
    if (weightValue !== undefined) patch[`variants[_key=="${target.variantKey}"].weight`] = weightValue;
  } else {
    if (lengthValue !== undefined) patch.length = lengthValue;
    if (widthValue  !== undefined) patch.width  = widthValue;
    if (heightValue !== undefined) patch.height = heightValue;
    if (weightValue !== undefined) patch.weight = weightValue;
  }

  if (boxLengthValue !== undefined) patch["boxOption.length"] = boxLengthValue;
  if (boxWidthValue  !== undefined) patch["boxOption.width"]  = boxWidthValue;
  if (boxHeightValue !== undefined) patch["boxOption.height"] = boxHeightValue;
  if (boxWeightValue !== undefined) patch["boxOption.weight"] = boxWeightValue;

  if (!Object.keys(patch).length) {
    return new Response(JSON.stringify({ action: "sin cambios", id: target._id }), { status: 200 });
  }

  try {
    let builder = client.patch(target._id);
    if (hasBoxDims) builder = builder.setIfMissing({ boxOption: {} });
    await builder.set(patch).commit();
    const scope = target.variantKey ? "variante" : "producto";
    return new Response(
      JSON.stringify({ action: `medidas actualizadas (${scope})`, id: target._id }),
      { status: 200 }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Error Sanity" }), { status: 500 });
  }
};
