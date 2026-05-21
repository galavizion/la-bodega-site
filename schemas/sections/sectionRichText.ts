import { defineField, defineType } from "sanity";

export const sectionRichText = defineType({
  name: "sectionRichText",
  title: "Texto enriquecido",
  type: "object",
  fields: [
    defineField({ name: "title", title: "Título", type: "string" }),
    defineField({
      name: "textAlign",
      title: "Alineación del texto",
      type: "string",
      options: { list: [{ title: "Izquierda", value: "left" }, { title: "Centro", value: "center" }, { title: "Derecha", value: "right" }], layout: "radio" },
      initialValue: "left",
    }),
    defineField({
      name: "content",
      title: "Contenido",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "cta",
      title: "Botón",
      type: "object",
      fields: [
        { name: "label", title: "Texto del botón", type: "string" },
        { name: "url",   title: "URL",             type: "string" },
      ],
    }),
    defineField({
      name: "bgColor",
      title: "Color de fondo",
      type: "string",
      options: {
        list: [
          { title: "Transparente (default)", value: "none"    },
          { title: "Negro",                  value: "#000000" },
          { title: "Blanco",                 value: "#ffffff" },
          { title: "Amarillo",               value: "#FFD700" },
        ],
        layout: "radio",
      },
      initialValue: "none",
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
    prepare: ({ title }) => ({ title: title || "Texto", subtitle: "sectionRichText" }),
  },
});
