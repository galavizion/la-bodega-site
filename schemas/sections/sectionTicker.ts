import { defineField, defineType } from "sanity";

export const sectionTicker = defineType({
  name: "sectionTicker",
  title: "Barra de aviso",
  type: "object",
  fields: [
    defineField({
      name: "bgColor",
      title: "Color de fondo",
      type: "string",
      description: "Color CSS válido: #fef0dc, rgb(254,240,220), etc.",
      initialValue: "#fef0dc",
    }),
    defineField({
      name: "textColor",
      title: "Color del texto",
      type: "string",
      description: "Color CSS válido: #96460a, rgb(150,70,10), etc.",
      initialValue: "#96460a",
    }),
    defineField({
      name: "col1Text",
      title: "Texto columna izquierda",
      type: "string",
    }),
    defineField({
      name: "col2Text",
      title: "Texto columna derecha",
      type: "string",
    }),
    defineField({
      name: "settings",
      title: "Configuración",
      type: "object",
      fields: [
        { name: "sectionId", title: "ID de sección", type: "string" },
      ],
    }),
  ],
  preview: {
    select: { col1: "col1Text", col2: "col2Text" },
    prepare: ({ col1, col2 }) => ({
      title: "Barra de aviso",
      subtitle: [col1, col2].filter(Boolean).join(" · ") || "Sin texto",
    }),
  },
});
