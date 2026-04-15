import { defineField, defineType } from "sanity";

export const sectionCTA = defineType({
  name: "sectionCTA",
  title: "CTA",
  type: "object",
  fields: [
    defineField({ name: "title", title: "Título", type: "string" }),
    defineField({ name: "subtitle", title: "Subtítulo", type: "string" }),
    defineField({
      name: "primaryCta",
      title: "CTA primario",
      type: "object",
      fields: [
        { name: "label", title: "Texto", type: "string" },
        { name: "url", title: "URL", type: "string" },
      ],
    }),
    defineField({
      name: "secondaryCta",
      title: "CTA secundario",
      type: "object",
      fields: [
        { name: "label", title: "Texto", type: "string" },
        { name: "url", title: "URL", type: "string" },
      ],
    }),
    defineField({
      name: "settings",
      title: "Configuración",
      type: "object",
      fields: [{ name: "sectionId", title: "ID de sección", type: "string" }],
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title: title || "CTA", subtitle: "sectionCTA" }),
  },
});
