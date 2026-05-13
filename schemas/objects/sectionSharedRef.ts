import { defineField, defineType } from "sanity";

export const sectionSharedRef = defineType({
  name: "sectionSharedRef",
  title: "↗ Sección guardada",
  type: "object",
  fields: [
    defineField({
      name: "ref",
      title: "Sección guardada",
      type: "reference",
      to: [{ type: "sharedSection" }],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: "ref.title" },
    prepare: ({ title }) => ({
      title: `↗ ${title ?? "Sección guardada"}`,
      subtitle: "Sección guardada",
    }),
  },
});
