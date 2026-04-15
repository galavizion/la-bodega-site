import { defineField, defineType } from "sanity";

export const post = defineType({
  name: "post",
  title: "Artículo (Blog)",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Título", type: "string" }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" } }),
    defineField({ name: "excerpt", title: "Extracto", type: "text", rows: 3 }),
    defineField({ name: "publishedAt", title: "Fecha de publicación", type: "datetime" }),
    defineField({ name: "mainImage", title: "Imagen principal", type: "image", options: { hotspot: true } }),
    defineField({
      name: "author",
      title: "Autor",
      type: "reference",
      to: [{ type: "author" }],
    }),
    defineField({
      name: "categories",
      title: "Categorías",
      type: "array",
      of: [{ type: "reference", to: [{ type: "category" }] }],
    }),
    defineField({
      name: "body",
      title: "Contenido",
      type: "array",
      of: [
        { type: "block" },
        { type: "image", options: { hotspot: true } },
      ],
    }),
    defineField({
      name: "faqs",
      title: "FAQs",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "q", title: "Pregunta", type: "string" },
            { name: "a", title: "Respuesta", type: "text", rows: 3 },
          ],
          preview: { select: { title: "q" } },
        },
      ],
    }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  preview: {
    select: { title: "title", subtitle: "publishedAt", media: "mainImage" },
  },
});
