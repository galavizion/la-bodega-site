import { defineField, defineType } from "sanity";

export const sectionHero = defineType({
  name: "sectionHero",
  title: "Hero",
  type: "object",
  fields: [
    defineField({ name: "heading", title: "Título principal", type: "string" }),
    defineField({ name: "subheading", title: "Subtítulo", type: "text", rows: 3 }),
    defineField({
      name: "bullets",
      title: "Puntos clave",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({ name: "image", title: "Imagen", type: "image", options: { hotspot: true } }),
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
      fields: [
        { name: "sectionId", title: "ID de sección", type: "string" },
        { name: "bgColor", title: "Color de fondo", type: "string" },
      ],
    }),
  ],
  preview: {
    select: { title: "heading" },
    prepare: ({ title }) => ({ title: title || "Hero", subtitle: "sectionHero" }),
  },
});
