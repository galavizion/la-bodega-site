import { defineField, defineType } from "sanity";

export const sectionProcess = defineType({
  name: "sectionProcess",
  title: "Proceso",
  type: "object",
  fields: [
    defineField({ name: "title", title: "Título", type: "string" }),
    defineField({ name: "subtitle", title: "Subtítulo", type: "string" }),
    defineField({
      name: "steps",
      title: "Pasos",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "title", title: "Título", type: "string" },
            { name: "description", title: "Descripción", type: "text", rows: 2 },
            { name: "icon", title: "Ícono", type: "string" },
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
    prepare: ({ title }) => ({ title: title || "Proceso", subtitle: "sectionProcess" }),
  },
});
