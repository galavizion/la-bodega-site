import { defineField, defineType } from "sanity";

export const sectionBenefits = defineType({
  name: "sectionBenefits",
  title: "Beneficios",
  type: "object",
  fields: [
    defineField({ name: "title", title: "Título", type: "string" }),
    defineField({ name: "subtitle", title: "Subtítulo", type: "string" }),
    defineField({
      name: "items",
      title: "Items",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "title", title: "Título", type: "string" },
            { name: "description", title: "Descripción", type: "text", rows: 2 },
            { name: "highlight", title: "Destacado", type: "string" },
            { name: "icon", title: "Ícono (SVG o nombre)", type: "string" },
          ],
          preview: { select: { title: "title" } },
        },
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
    prepare: ({ title }) => ({ title: title || "Beneficios", subtitle: "sectionBenefits" }),
  },
});
