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
      ],
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "pageType" },
  },
});
