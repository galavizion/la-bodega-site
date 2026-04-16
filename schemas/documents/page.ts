import { defineField, defineType } from "sanity";

export const page = defineType({
  name: "page",
  title: "Página",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Título", type: "string" }),
    defineField({
      name: "pageType",
      title: "Tipo de página",
      type: "string",
      options: {
        list: [
          { title: "Home", value: "home" },
          { title: "Servicio", value: "service" },
          { title: "Landing", value: "landing" },
        ],
      },
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      options: { source: "title" },
    }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
    defineField({
      name: "background",
      title: "Fondo de página",
      type: "object",
      options: { collapsible: true, collapsed: false },
      fields: [
        {
          name: "type",
          title: "Tipo de fondo",
          type: "string",
          options: {
            list: [
              { title: "Gradiente animado (default)", value: "gradient" },
              { title: "Color sólido", value: "solid" },
              { title: "Imagen", value: "image" },
            ],
            layout: "radio",
          },
          initialValue: "gradient",
        },
        { name: "color", title: "Color sólido (hex)", type: "string" },
        {
          name: "gradientColors",
          title: "Colores del gradiente (hex, uno por línea)",
          type: "text",
          rows: 4,
          description: "Ej: #16b988\n#e73c7e\n#23a6d5\n#332b79",
        },
        {
          name: "image",
          title: "Imagen de fondo",
          type: "image",
          options: { hotspot: true },
        },
        {
          name: "overlay",
          title: "Overlay oscuro sobre imagen (%)",
          type: "number",
          initialValue: 0,
        },
      ],
    }),
    defineField({
      name: "sections",
      title: "Secciones",
      type: "array",
      of: [
        { type: "sectionHero" },
        { type: "sectionBenefits" },
        { type: "sectionProcess" },
        { type: "sectionFAQ" },
        { type: "sectionCTA" },
        { type: "sectionContentSplit" },
        { type: "sectionRichText" },
        { type: "sectionCards" },
        { type: "sectionForm" },
      ],
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "pageType" },
  },
});
