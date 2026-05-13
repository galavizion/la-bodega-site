import { defineField, defineType } from "sanity";

export const siteSettingsMenu = defineType({
  name: "siteSettingsMenu",
  title: "Menú",
  type: "document",
  fields: [
    defineField({
      name: "navigation",
      title: "Navegación principal",
      type: "array",
      of: [{ type: "navItem" }],
    }),
  ],
  preview: { prepare: () => ({ title: "Menú de navegación" }) },
});
