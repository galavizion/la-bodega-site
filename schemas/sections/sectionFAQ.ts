import { defineField, defineType } from "sanity";

export const sectionFAQ = defineType({
  name: "sectionFAQ",
  title: "FAQ",
  type: "object",
  fields: [
    defineField({ name: "title", title: "Título", type: "string" }),
    defineField({ name: "subtitle", title: "Subtítulo", type: "string" }),
    defineField({
      name: "faqs",
      title: "Preguntas frecuentes",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "question", title: "Pregunta", type: "string" },
            { name: "answer", title: "Respuesta", type: "text", rows: 3 },
          ],
          preview: { select: { title: "question" } },
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
    prepare: ({ title }) => ({ title: title || "FAQ", subtitle: "sectionFAQ" }),
  },
});
