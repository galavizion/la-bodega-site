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
      options: { list: [{ title: "2 columnas", value: 2 }, { title: "3 columnas", value: 3 }, { title: "4 columnas", value: 4 }, { title: "6 columnas", value: 6 }, { title: "12 columnas", value: 12 }] },
      initialValue: 3,
    }),
    defineField({
      name: "cardStyle",
      title: "Estilo de tarjeta",
      type: "string",
      options: {
        list: [
          { title: "Sombra suave",  value: "shadow"   },
          { title: "Con borde",     value: "outline"  },
          { title: "Fondo sólido",  value: "filled"   },
          { title: "Minimalista",   value: "minimal"  },
          { title: "Circular",      value: "circular" },
        ],
        layout: "radio",
      },
      initialValue: "shadow",
    }),
    defineField({
      name: "textAlign",
      title: "Alineación del texto",
      type: "string",
      options: {
        list: [
          { title: "Izquierda", value: "left"   },
          { title: "Centro",    value: "center" },
          { title: "Derecha",   value: "right"  },
        ],
        layout: "radio",
      },
      initialValue: "left",
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
      fields: [{ name: "sectionId", title: "ID de sección (anchor)", type: "string" }],
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title: title || "Tarjetas", subtitle: "sectionCards" }),
  },
});
