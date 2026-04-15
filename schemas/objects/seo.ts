import { defineField, defineType } from "sanity";

export const seo = defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  fields: [
    defineField({ name: "title", title: "Título SEO", type: "string" }),
    defineField({ name: "description", title: "Descripción", type: "text", rows: 3 }),
    defineField({ name: "canonical", title: "URL Canónica", type: "url" }),
    defineField({ name: "noindex", title: "No indexar", type: "boolean", initialValue: false }),
    defineField({
      name: "ogImage",
      title: "Imagen OG",
      type: "image",
      options: { hotspot: true },
    }),
  ],
});
