import { defineField, defineType } from "sanity";

export const siteSettingsHeader = defineType({
  name: "siteSettingsHeader",
  title: "Header",
  type: "document",
  fields: [
    defineField({
      name: "topBar",
      title: "Barra superior",
      type: "object",
      fields: [
        { name: "enabled",   title: "Mostrar barra superior", type: "boolean", initialValue: false },
        { name: "text",      title: "Texto",                  type: "string" },
        { name: "linkLabel", title: "Texto del enlace",        type: "string" },
        { name: "linkUrl",   title: "URL del enlace",          type: "string" },
        { name: "bgColor",   title: "Color de fondo (hex)",    type: "string" },
      ],
    }),
    defineField({
      name: "headerSocial",
      title: "Mostrar redes en header",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "social",
      title: "Redes sociales",
      type: "object",
      fields: [
        { name: "facebook",  title: "Facebook URL",          type: "url" },
        { name: "instagram", title: "Instagram URL",         type: "url" },
        { name: "linkedin",  title: "LinkedIn URL",          type: "url" },
        { name: "youtube",   title: "YouTube URL",           type: "url" },
        { name: "tiktok",    title: "TikTok URL",            type: "url" },
        { name: "whatsapp",  title: "WhatsApp URL (wa.me/…)",type: "url" },
      ],
    }),
    defineField({
      name: "cta",
      title: "Botón CTA",
      type: "object",
      fields: [
        { name: "label", title: "Texto del botón", type: "string" },
        { name: "url",   title: "URL",             type: "string" },
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Header" }) },
});
