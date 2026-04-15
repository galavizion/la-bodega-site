import { defineField, defineType } from "sanity";

export const author = defineType({
  name: "author",
  title: "Autor",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Nombre", type: "string" }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "name" } }),
    defineField({ name: "image", title: "Foto", type: "image", options: { hotspot: true } }),
    defineField({ name: "bio", title: "Biografía", type: "text", rows: 4 }),
  ],
  preview: {
    select: { title: "name", media: "image" },
  },
});
