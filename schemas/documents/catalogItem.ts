import { defineField, defineType } from "sanity";

export const catalogItem = defineType({
  name: "catalogItem",
  title: "Producto",
  type: "document",
  groups: [
    { name: "info", title: "Información" },
    { name: "media", title: "Imágenes" },
    { name: "pricing", title: "Precio y stock" },
    { name: "shop", title: "Tienda" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    // ── INFO ─────────────────────────────────────────────
    defineField({ name: "title", title: "Nombre del producto", type: "string", group: "info" }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" }, group: "info" }),
    defineField({ name: "sku", title: "SKU / Código", type: "string", group: "info" }),
    defineField({ name: "excerpt", title: "Descripción corta", type: "text", rows: 3, group: "info" }),
    defineField({
      name: "body",
      title: "Descripción completa",
      type: "array",
      of: [{ type: "block" }, { type: "image", options: { hotspot: true } }],
      group: "info",
    }),
    defineField({
      name: "category",
      title: "Categoría",
      type: "reference",
      to: [{ type: "productCategory" }],
      group: "info",
    }),
    defineField({
      name: "brand",
      title: "Marca",
      type: "string",
      group: "info",
    }),
    defineField({
      name: "tags",
      title: "Etiquetas",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      group: "info",
    }),

    // ── MEDIA ─────────────────────────────────────────────
    defineField({
      name: "coverImage",
      title: "Imagen principal",
      type: "image",
      options: { hotspot: true },
      group: "media",
    }),
    defineField({
      name: "gallery",
      title: "Galería de imágenes",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
      group: "media",
    }),

    // ── PRICING ──────────────────────────────────────────
    defineField({ name: "price", title: "Precio", type: "number", group: "pricing" }),
    defineField({ name: "comparePrice", title: "Precio anterior (tachado)", type: "number", group: "pricing" }),
    defineField({ name: "priceLabel", title: "Etiqueta de precio", type: "string", group: "pricing" }),
    defineField({ name: "stock", title: "Stock disponible", type: "number", initialValue: 0, group: "pricing" }),
    defineField({ name: "trackStock", title: "Controlar stock", type: "boolean", initialValue: false, group: "pricing" }),
    defineField({
      name: "variants",
      title: "Variantes (tallas, colores, etc.)",
      type: "array",
      group: "pricing",
      of: [
        {
          type: "object",
          fields: [
            { name: "label", title: "Nombre de variante", type: "string" },
            { name: "price", title: "Precio (si difiere)", type: "number" },
            { name: "stock", title: "Stock", type: "number", initialValue: 0 },
          ],
          preview: { select: { title: "label", subtitle: "price" } },
        },
      ],
    }),

    // ── SHOP ─────────────────────────────────────────────
    defineField({ name: "featured", title: "Producto destacado", type: "boolean", initialValue: false, group: "shop" }),
    defineField({ name: "published", title: "Publicado en tienda", type: "boolean", initialValue: true, group: "shop" }),
    defineField({
      name: "whatsapp",
      title: "Compra por WhatsApp",
      type: "object",
      group: "shop",
      fields: [
        { name: "enabled", title: "Activar", type: "boolean", initialValue: true },
        { name: "phone", title: "Número", type: "string" },
        { name: "message", title: "Mensaje predefinido", type: "string" },
      ],
    }),

    // ── SEO ──────────────────────────────────────────────
    defineField({ name: "seo", title: "SEO", type: "seo", group: "seo" }),
  ],
  preview: {
    select: { title: "title", subtitle: "category.title", media: "coverImage" },
  },
  orderings: [
    { title: "Nombre A-Z", name: "titleAsc", by: [{ field: "title", direction: "asc" }] },
    { title: "Más nuevos", name: "createdDesc", by: [{ field: "_createdAt", direction: "desc" }] },
  ],
});
