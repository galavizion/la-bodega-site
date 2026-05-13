import { defineField, defineType } from "sanity";

export const siteSettingsSeo = defineType({
  name: "siteSettingsSeo",
  title: "SEO",
  type: "document",
  fields: [
    defineField({ name: "defaultTitle",       title: "Título por defecto",      type: "string" }),
    defineField({ name: "defaultDescription", title: "Descripción por defecto", type: "text", rows: 3 }),
    defineField({ name: "defaultOgImage",     title: "Imagen OG por defecto",   type: "image", options: { hotspot: true } }),
  ],
  preview: { prepare: () => ({ title: "SEO" }) },
});
