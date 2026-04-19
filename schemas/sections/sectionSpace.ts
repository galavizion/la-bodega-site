import { defineField, defineType } from "sanity";

export const sectionSpace = defineType({
  name: "sectionSpace",
  title: "Espacio / Separador",
  type: "object",
  fields: [
    defineField({
      name: "height",
      title: "Alto (px)",
      type: "number",
      description: "Altura del espacio en píxeles",
      initialValue: 80,
      validation: (R) => R.min(0).max(600),
    }),
    defineField({
      name: "bgColor",
      title: "Color de fondo",
      type: "string",
      description: "Color CSS válido: #fff, transparent, #1e293b, etc.",
      initialValue: "transparent",
    }),
  ],
  preview: {
    select: { height: "height", bg: "bgColor" },
    prepare: ({ height, bg }) => ({
      title: `Espacio ${height ?? 80}px`,
      subtitle: bg ?? "transparent",
    }),
  },
});
