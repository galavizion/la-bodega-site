import { defineField, defineType } from "sanity";

export const catalogItem = defineType({
  name: "catalogItem",
  title: "Producto",
  type: "document",
  groups: [
    { name: "info",     title: "Información" },
    { name: "media",    title: "Imágenes" },
    { name: "variants", title: "Variantes" },
    { name: "shop",     title: "Tienda" },
    { name: "seo",      title: "SEO" },
  ],
  fields: [
    // ── INFO ─────────────────────────────────────────────
    defineField({ name: "title",  title: "Nombre del producto", type: "string", group: "info" }),
    defineField({ name: "slug",   title: "Slug", type: "slug", options: { source: "title" }, group: "info" }),
    defineField({ name: "sku",    title: "SKU principal", type: "string", group: "info" }),
    defineField({ name: "brand",  title: "Marca", type: "string", group: "info" }),
    defineField({ name: "excerpt", title: "Descripción corta", type: "text", rows: 3, group: "info" }),
    defineField({
      name: "body",
      title: "Descripción general",
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
      name: "tags",
      title: "Etiquetas",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      group: "info",
    }),
    defineField({
      name: "certifications",
      title: "Certificaciones",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
        list: [
          { title: "UL Listed",    value: "ul" },
          { title: "FM Approved",  value: "fm" },
          { title: "NOM",          value: "nom" },
          { title: "NSF",          value: "nsf" },
          { title: "CE",           value: "ce" },
          { title: "ISO 9001",     value: "iso9001" },
        ],
      },
      group: "info",
    }),

    // ── MEDIA ────────────────────────────────────────────
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

    // ── VARIANTES ─────────────────────────────────────────
    defineField({
      name: "variants",
      title: "Variantes del producto",
      description: "Cada variante puede tener su propio SKU, medida, precio, stock, especificaciones e imagen.",
      type: "array",
      group: "variants",
      of: [
        {
          type: "object",
          title: "Variante",
          fields: [
            { name: "sku",   title: "SKU / Código",      type: "string" },
            { name: "size",  title: "Medida / Dimensión", type: "string", description: 'Ej: 2", 4", 6"' },
            { name: "label", title: "Etiqueta extra",     type: "string", description: "Ej: color, material, presión" },
            { name: "price", title: "Precio",             type: "number" },
            { name: "comparePrice", title: "Precio anterior (tachado)", type: "number" },
            { name: "stock", title: "Stock disponible",   type: "number", initialValue: 0 },
            {
              name: "specifications",
              title: "Especificaciones técnicas",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    { name: "label", title: "Propiedad", type: "string", description: "Ej: Presión Máx" },
                    { name: "value", title: "Valor",     type: "string", description: "Ej: 300 PSI" },
                  ],
                  preview: {
                    select: { title: "label", subtitle: "value" },
                  },
                },
              ],
            },
            {
              name: "variantImage",
              title: "Imagen específica de variante",
              type: "image",
              options: { hotspot: true },
              description: "Opcional — solo si la variante se ve diferente al modelo base",
            },
          ],
          preview: {
            select: { title: "size", subtitle: "sku", media: "variantImage" },
            prepare: ({ title, subtitle, media }) => ({
              title: title || subtitle || "Variante",
              subtitle: subtitle,
              media,
            }),
          },
        },
      ],
    }),

    // ── TIENDA ────────────────────────────────────────────
    defineField({ name: "featured",  title: "Producto destacado",   type: "boolean", initialValue: false, group: "shop" }),
    defineField({ name: "published", title: "Publicado en tienda",  type: "boolean", initialValue: true,  group: "shop" }),
    defineField({
      name: "whatsapp",
      title: "Compra por WhatsApp",
      type: "object",
      group: "shop",
      fields: [
        { name: "enabled", title: "Activar",             type: "boolean", initialValue: true },
        { name: "phone",   title: "Número",              type: "string" },
        { name: "message", title: "Mensaje predefinido", type: "string" },
      ],
    }),

    // ── SEO ──────────────────────────────────────────────
    defineField({ name: "seo", title: "SEO", type: "seo", group: "seo" }),
  ],
  preview: {
    select: { title: "title", subtitle: "brand", media: "coverImage" },
    prepare: ({ title, subtitle, media }) => ({
      title,
      subtitle: subtitle ?? "",
      media,
    }),
  },
  orderings: [
    { title: "Nombre A-Z",  name: "titleAsc",    by: [{ field: "title",      direction: "asc"  }] },
    { title: "Más nuevos",  name: "createdDesc", by: [{ field: "_createdAt", direction: "desc" }] },
    { title: "Destacados",  name: "featured",    by: [{ field: "featured",   direction: "desc" }] },
  ],
});
