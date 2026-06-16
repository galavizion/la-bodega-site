import { defineField, defineType } from "sanity";

export const productCategory = defineType({
  name: "productCategory",
  title: "Categoría de producto",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Nombre", type: "string" }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" } }),
    defineField({ name: "description", title: "Descripción", type: "text", rows: 2 }),
    defineField({ name: "image", title: "Imagen", type: "image", options: { hotspot: true } }),
    defineField({
      name: "parent",
      title: "Categoría padre (opcional)",
      type: "reference",
      to: [{ type: "productCategory" }],
    }),
    defineField({ name: "order", title: "Orden de aparición", type: "number", initialValue: 0 }),
    defineField({
      name: "markupPercent",
      title: "Margen precio unitario (%) — opcional",
      type: "number",
      description: "Sobrescribe el margen global para los productos de esta categoría. Si se deja vacío, se usa el de la categoría padre (si tiene) o el margen global de la tienda.",
      validation: (Rule) => Rule.min(0).max(200),
    }),
    defineField({
      name: "boxMarkupPercent",
      title: "Margen precio por caja (%) — opcional",
      type: "number",
      description: "Sobrescribe el margen de caja global para los productos de esta categoría. Si se deja vacío, se usa el de la categoría padre (si tiene) o el margen global de caja.",
      validation: (Rule) => Rule.min(-100).max(200),
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "parent.title", media: "image", markup: "markupPercent", boxMarkup: "boxMarkupPercent" },
    prepare: ({ title, subtitle, media, markup, boxMarkup }) => ({
      title,
      subtitle: [
        subtitle ? `↳ ${subtitle}` : null,
        markup != null ? `+${markup}% unit.` : null,
        boxMarkup != null ? `+${boxMarkup}% caja` : null,
      ].filter(Boolean).join(" · ") || undefined,
      media,
    }),
  },
  orderings: [
    { title: "Orden", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
});
