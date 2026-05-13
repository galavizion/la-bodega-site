import { defineField, defineType } from "sanity";

export const sectionProcess = defineType({
  name: "sectionProcess",
  title: "Proceso",
  type: "object",
  fields: [
    defineField({ name: "title", title: "Título", type: "string" }),
    defineField({ name: "subtitle", title: "Subtítulo", type: "string" }),
    defineField({
      name: "textAlign",
      title: "Alineación del texto",
      type: "string",
      options: { list: [{ title: "Izquierda", value: "left" }, { title: "Centro", value: "center" }, { title: "Derecha", value: "right" }], layout: "radio" },
      initialValue: "left",
    }),
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
          { title: "Amarillo",               value: "#F7E96A" },
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
    prepare: ({ title }) => ({ title: title || "Proceso", subtitle: "sectionProcess" }),
  },
});
