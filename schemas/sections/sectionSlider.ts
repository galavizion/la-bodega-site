import { defineField, defineType } from "sanity";

export const sectionSlider = defineType({
  name: "sectionSlider",
  title: "Slider de imágenes",
  type: "object",
  fields: [
    defineField({
      name: "mode",
      title: "Modo",
      type: "string",
      options: {
        list: [
          { title: "Simple (solo imágenes)", value: "simple" },
          { title: "Con texto (título, texto y botón)", value: "text" },
        ],
        layout: "radio",
      },
      initialValue: "simple",
    }),
    defineField({
      name: "aspectRatio",
      title: "Proporción del slider",
      type: "string",
      options: {
        list: [
          { title: "Ultra ancho  (21:8 — banner promocional)", value: "21/8"  },
          { title: "Ancho        (16:6 — hero estándar)",      value: "16/6"  },
          { title: "Medio        (16:7)",                      value: "16/7"  },
          { title: "Widescreen   (16:9)",                      value: "16/9"  },
          { title: "Cuadrado     (4:3)",                       value: "4/3"   },
        ],
        layout: "radio",
      },
      initialValue: "16/6",
    }),
    defineField({
      name: "intervalSeconds",
      title: "Segundos entre cada cambio automático",
      type: "number",
      initialValue: 5,
      description: "0 desactiva el cambio automático (el visitante solo avanza con flechas o puntos).",
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "slides",
      title: "Imágenes",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "image", title: "Imagen", type: "image", options: { hotspot: true }, validation: (Rule) => Rule.required() },
            { name: "title", title: "Título (solo modo 'Con texto')", type: "string" },
            { name: "text", title: "Texto (solo modo 'Con texto')", type: "text", rows: 2 },
            { name: "buttonLabel", title: "Texto del botón (solo modo 'Con texto')", type: "string" },
            { name: "buttonUrl", title: "URL del botón (solo modo 'Con texto')", type: "string" },
          ],
          preview: {
            select: { title: "title", media: "image" },
            prepare: ({ title, media }) => ({ title: title || "Imagen", media }),
          },
        },
      ],
      validation: (Rule) => Rule.min(1),
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
    select: { mode: "mode", slides: "slides" },
    prepare: ({ mode, slides }) => ({
      title: "Slider de imágenes",
      subtitle: `${mode === "text" ? "Con texto" : "Simple"} · ${slides?.length ?? 0} imágenes`,
    }),
  },
});
