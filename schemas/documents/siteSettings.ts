import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Configuración del sitio",
  type: "document",
  fields: [
    defineField({ name: "siteName", title: "Nombre del sitio", type: "string" }),
    defineField({ name: "siteUrl", title: "URL del sitio", type: "url" }),
    defineField({ name: "defaultTitle", title: "Título por defecto", type: "string" }),
    defineField({ name: "defaultDescription", title: "Descripción por defecto", type: "text", rows: 3 }),
    defineField({ name: "defaultOgImage", title: "Imagen OG por defecto", type: "image", options: { hotspot: true } }),
    defineField({ name: "logo", title: "Logo", type: "image", options: { hotspot: true } }),
    defineField({ name: "analyticsId", title: "Google Analytics ID", type: "string" }),
    defineField({ name: "tagManagerId", title: "Google Tag Manager ID", type: "string" }),
    defineField({ name: "adsenseClient", title: "AdSense Client ID", type: "string" }),
    defineField({ name: "searchConsoleVerification", title: "Search Console Verification", type: "string" }),
    defineField({
      name: "cta",
      title: "CTA global",
      type: "object",
      fields: [
        { name: "label", title: "Texto", type: "string" },
        { name: "url", title: "URL", type: "string" },
      ],
    }),
    defineField({
      name: "organization",
      title: "Organización",
      type: "object",
      fields: [
        { name: "phone", title: "Teléfono", type: "string" },
        { name: "email", title: "Email", type: "string" },
        { name: "sameAs", title: "Redes sociales (URLs)", type: "array", of: [{ type: "url" }] },
      ],
    }),
    defineField({
      name: "navigation",
      title: "Navegación",
      type: "array",
      of: [{ type: "navItem" }],
    }),
  ],
  preview: {
    select: { title: "siteName" },
  },
});
