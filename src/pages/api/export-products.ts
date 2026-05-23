import type { APIRoute } from "astro";
import { createClient } from "@sanity/client";

export const prerender = false;

const sanity = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? "a7b3q6z9",
  dataset:   import.meta.env.PUBLIC_SANITY_DATASET   ?? "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

export const GET: APIRoute = async () => {
  const items = await sanity.fetch<any[]>(`
    *[_type == "catalogItem"] | order(title asc) {
      _id,
      title,
      "slug": slug.current,
      sku,
      brand,
      excerpt,
      "category": category->title,
      price,
      comparePrice,
      published,
      featured,
      familySlug,
      tags,
      "boxEnabled":      boxOption.enabled,
      "boxUnitsPerBox":  boxOption.unitsPerBox,
      "boxLabel":        boxOption.boxLabel,
      variants[]{ sku, size, label, price, comparePrice, stock }
    }
  `);

  const rows: string[][] = [];

  // Encabezado
  rows.push([
    "title", "slug", "sku", "brand", "excerpt", "category",
    "price", "comparePrice", "published", "featured", "familySlug", "tags",
    "boxEnabled", "boxUnitsPerBox", "boxLabel",
    "variant_sku", "variant_size", "variant_label", "variant_price", "variant_comparePrice", "variant_stock",
  ]);

  for (const item of items) {
    const base = [
      item.title ?? "",
      item.slug  ?? "",
      item.sku   ?? "",
      item.brand ?? "",
      item.excerpt ?? "",
      item.category ?? "",
      item.price        != null ? String(item.price)        : "",
      item.comparePrice != null ? String(item.comparePrice) : "",
      item.published != null ? String(item.published) : "true",
      item.featured  != null ? String(item.featured)  : "false",
      item.familySlug ?? "",
      Array.isArray(item.tags) ? item.tags.join("|") : "",
      item.boxEnabled     != null ? String(item.boxEnabled)     : "",
      item.boxUnitsPerBox != null ? String(item.boxUnitsPerBox) : "",
      item.boxLabel ?? "",
    ];

    if (Array.isArray(item.variants) && item.variants.length > 0) {
      for (const v of item.variants) {
        rows.push([
          ...base,
          v.sku   ?? "",
          v.size  ?? "",
          v.label ?? "",
          v.price        != null ? String(v.price)        : "",
          v.comparePrice != null ? String(v.comparePrice) : "",
          v.stock        != null ? String(v.stock)        : "",
        ]);
      }
    } else {
      rows.push([...base, "", "", "", "", "", ""]);
    }
  }

  const csv = rows
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="productos-${new Date().toISOString().slice(0,10)}.csv"`,
    },
  });
};
