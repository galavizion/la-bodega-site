import { defineField, defineType } from "sanity";

export const sectionContentSplit = defineType({
  name: "sectionContentSplit",
  title: "Contenido dividido",
  type: "object",
  fields: [
    defineField({ name: "sectionId", title: "ID de sección", type: "string" }),
    defineField({ name: "title", title: "Título", type: "string" }),
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
      name: "content",
      title: "Contenido",
      type: "array",
      of: [{ type: "block" }],
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
