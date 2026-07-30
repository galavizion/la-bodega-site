import type { APIRoute } from "astro";
import { createClient } from "@sanity/client";
import * as XLSX from "xlsx";
import { resolveMarkup } from "../../lib/pricing";

export const prerender = false;

const sanity = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? "a7b3q6z9",
  dataset:   import.meta.env.PUBLIC_SANITY_DATASET   ?? "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

type ShopSettings = { currency: string; usdRate: number; markupPercent: number; boxMarkupPercent: number };

const round2 = (n: number) => Math.round(n * 100) / 100;

export const GET: APIRoute = async () => {
  const [shopSettings, items] = await Promise.all([
    sanity
      .fetch<ShopSettings>(`
        *[_type=="siteSettingsShop"][0]{
          "currency": coalesce(currency, "USD"),
          "usdRate": coalesce(usdRate, 17),
          "markupPercent": coalesce(markupPercent, 26.5),
          "boxMarkupPercent": coalesce(boxMarkupPercent, 0)
        }
      `)
      .catch(() => ({ currency: "USD", usdRate: 17, markupPercent: 26.5, boxMarkupPercent: 0 })),
    sanity.fetch<any[]>(`
      *[_type == "catalogItem" && published != false] | order(title asc) {
        title, sku, brand, "category": category->title,
        price,
        "categoryPricing": category->{
          markupPercent, boxMarkupPercent,
          "parentMarkupPercent": parent->markupPercent,
          "parentBoxMarkupPercent": parent->boxMarkupPercent
        },
        disableMarkup,
        "boxEnabled": boxOption.enabled,
        "boxUnitsPerBox": boxOption.unitsPerBox,
        variants[]{ sku, size, label, price }
      }
    `),
  ]);

  const rows: (string | number)[][] = [];
  rows.push([
    "Producto", "SKU", "Marca", "Categoría", "Variante",
    "Precio unitario final (MXN)", "Caja habilitada", "Piezas por caja",
    "Precio de caja final (MXN)", "Precio unitario en caja (MXN)",
  ]);

  for (const item of items) {
    const { unit, box } = resolveMarkup(item.categoryPricing, shopSettings, item);
    const toFinal = (raw: number) =>
      round2((shopSettings.currency === "USD" ? raw * shopSettings.usdRate : raw) * (1 + unit / 100));

    const basePriceRaw: number | null =
      item.variants?.find((v: any) => v.price != null)?.price ?? item.price ?? null;

    let boxTotal: number | null = null;
    let boxUnit: number | null = null;
    if (item.boxEnabled && item.boxUnitsPerBox && basePriceRaw != null) {
      boxTotal = round2(
        (shopSettings.currency === "USD" ? basePriceRaw * shopSettings.usdRate : basePriceRaw) *
          item.boxUnitsPerBox *
          (1 + box / 100)
      );
      boxUnit = round2(boxTotal / item.boxUnitsPerBox);
    }

    const variantRows: any[] = Array.isArray(item.variants) && item.variants.length ? item.variants : [null];

    for (const v of variantRows) {
      const raw: number | null = v?.price ?? item.price ?? null;
      rows.push([
        item.title ?? "",
        (v?.sku ?? item.sku) ?? "",
        item.brand ?? "",
        item.category ?? "",
        v ? [v.size, v.label].filter(Boolean).join(" ") : "",
        raw != null ? toFinal(raw) : "",
        item.boxEnabled ? "Sí" : "No",
        item.boxUnitsPerBox ?? "",
        boxTotal ?? "",
        boxUnit ?? "",
      ]);
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 38 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 16 },
    { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 22 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Lista de precios");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="lista-precios-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
};
