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
  ],
  preview: {
    select: { title: "title", subtitle: "parent.title", media: "image" },
    prepare: ({ title, subtitle, media }) => ({
      title,
      subtitle: subtitle ? `↳ ${subtitle}` : undefined,
      media,
    }),
  },
  orderings: [
    { title: "Orden", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
});
