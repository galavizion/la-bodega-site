import { defineField, defineType } from "sanity";

export const catalogItem = defineType({
  name: "catalogItem",
  title: "Catálogo",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Nombre del producto", type: "string" }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" } }),
    defineField({ name: "excerpt", title: "Extracto", type: "text", rows: 3 }),
    defineField({ name: "category", title: "Categoría", type: "string" }),
    defineField({ name: "coverImage", title: "Imagen de portada", type: "image", options: { hotspot: true } }),
    defineField({
      name: "body",
      title: "Descripción completa",
      type: "array",
      of: [
        { type: "block" },
        { type: "image", options: { hotspot: true } },
      ],
    }),
    defineField({ name: "price", title: "Precio", type: "number" }),
    defineField({ name: "priceLabel", title: "Etiqueta de precio", type: "string" }),
    defineField({
      name: "whatsapp",
      title: "WhatsApp",
      type: "object",
      fields: [
        { name: "enabled", title: "Activar", type: "boolean", initialValue: true },
        { name: "phone", title: "Número", type: "string" },
        { name: "message", title: "Mensaje predefinido", type: "string" },
      ],
    }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  preview: {
    select: { title: "title", subtitle: "category", media: "coverImage" },
  },
});
