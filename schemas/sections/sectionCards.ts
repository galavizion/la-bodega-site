import { defineField, defineType } from "sanity";

export const sectionCards = defineType({
  name: "sectionCards",
  title: "Tarjetas (grid flexible)",
  type: "object",
  fields: [
    defineField({ name: "title",    title: "Título",    type: "string" }),
    defineField({ name: "subtitle", title: "Subtítulo", type: "string" }),
    defineField({
      name: "columns",
      title: "Columnas",
      type: "number",
      options: { list: [{ title: "2 columnas", value: 2 }, { title: "3 columnas", value: 3 }, { title: "4 columnas", value: 4 }] },
      initialValue: 3,
    }),
    defineField({
      name: "cardStyle",
      title: "Estilo de tarjeta",
      type: "string",
      options: {
        list: [
          { title: "Sombra suave",  value: "shadow" },
          { title: "Con borde",     value: "outline" },
          { title: "Fondo sólido",  value: "filled" },
          { title: "Minimalista",   value: "minimal" },
        ],
        layout: "radio",
      },
      initialValue: "shadow",
    }),
    defineField({
      name: "items",
      title: "Tarjetas",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "badge",        title: "Badge / etiqueta (opcional)", type: "string" },
            { name: "image",        title: "Imagen",          type: "image", options: { hotspot: true } },
            { name: "title",        title: "Título",          type: "string" },
            { name: "description",  title: "Descripción",     type: "text", rows: 3 },
            { name: "linkLabel",    title: "Texto del botón", type: "string" },
            { name: "linkUrl",      title: "URL del botón",   type: "string" },
          ],
          preview: {
            select: { title: "title", subtitle: "description", media: "image" },
          },
        },
      ],
    }),
    defineField({
      name: "bgColor",
      title: "Color de fondo",
      type: "string",
      options: {
        list: [
          { title: "Ninguno (transparente)", value: "none" },
          { title: "Blanco",                 value: "#ffffff" },
          { title: "Gris claro",             value: "#f1f5f9" },
          { title: "Gris oscuro",            value: "#1e293b" },
          { title: "Negro",                  value: "#0f172a" },
          { title: "Rojo (acento)",          value: "#ef4444" },
          { title: "Rojo oscuro",            value: "#7f1d1d" },
        ],
        layout: "radio",
      },
      initialValue: "none",
    }),
    defineField({
      name: "settings",
      title: "Configuración",
      type: "object",
      fields: [{ name: "sectionId", title: "ID de sección (anchor)", type: "string" }],
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title: title || "Tarjetas", subtitle: "sectionCards" }),
  },
});
