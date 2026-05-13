import { defineField, defineType } from "sanity";

export const sharedSection = defineType({
  name: "sharedSection",
  title: "Sección guardada",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Nombre interno",
      type: "string",
      description: "Solo visible en el Studio — ayuda a identificarla en otras páginas.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "section",
      title: "Sección",
      type: "array",
      description: "Agrega exactamente una sección.",
      validation: (Rule) => Rule.max(1),
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
        { type: "sectionSpace" },
      ],
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title: title ?? "Sin nombre",
      subtitle: "Sección guardada",
    }),
  },
});
