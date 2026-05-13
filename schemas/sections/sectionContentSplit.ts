import { defineField, defineType } from "sanity";

export const sectionContentSplit = defineType({
  name: "sectionContentSplit",
  title: "Contenido dividido",
  type: "object",
  fields: [
    defineField({ name: "sectionId", title: "ID de sección", type: "string" }),
    defineField({ name: "title", title: "Título", type: "string" }),
    defineField({
      name: "textAlign",
      title: "Alineación del texto",
      type: "string",
      options: { list: [{ title: "Izquierda", value: "left" }, { title: "Centro", value: "center" }, { title: "Derecha", value: "right" }], layout: "radio" },
      initialValue: "left",
    }),
    defineField({
      name: "layout",
      title: "Layout",
      type: "string",
      options: { list: ["default", "wide", "narrow"] },
    }),
    defineField({
      name: "imageSide",
      title: "Lado de la imagen",
      type: "string",
      options: { list: [{ title: "Izquierda", value: "left" }, { title: "Derecha", value: "right" }] },
    }),
    defineField({ name: "image", title: "Imagen", type: "image", options: { hotspot: true } }),
    defineField({
      name: "youtubeUrl",
      title: "Video de YouTube (alternativa a imagen)",
      type: "string",
      description: "Pega la URL del video o el código <iframe> completo. Si hay imagen Y video, el video tiene prioridad.",
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
      name: "settings",
      title: "Configuración",
      type: "object",
      fields: [{ name: "sectionId", title: "ID de sección", type: "string" }],
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title: title || "Contenido dividido", subtitle: "sectionContentSplit" }),
  },
});
