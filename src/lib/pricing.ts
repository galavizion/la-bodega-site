// src/lib/pricing.ts
export type CategoryMarkup = {
  markupPercent?: number | null;
  boxMarkupPercent?: number | null;
  parentMarkupPercent?: number | null;
  parentBoxMarkupPercent?: number | null;
} | null | undefined;

export type ShopMarkupSettings = {
  markupPercent?: number | null;
  boxMarkupPercent?: number | null;
} | null | undefined;

/**
 * Cadena de resolución del margen: propio de la categoría → categoría padre → global de la tienda.
 * Se evalúa por separado para el margen unitario y el de caja.
 */
export function resolveMarkup(cat: CategoryMarkup, settings: ShopMarkupSettings) {
  const unit = cat?.markupPercent ?? cat?.parentMarkupPercent ?? settings?.markupPercent ?? 26.5;
  const box  = cat?.boxMarkupPercent ?? cat?.parentBoxMarkupPercent ?? settings?.boxMarkupPercent ?? 0;
  return { unit, box };
}
