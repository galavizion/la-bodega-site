import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Configuración del sitio",
  type: "document",
  groups: [
    { name: "general", title: "General" },
    { name: "header", title: "Header" },
    { name: "footer", title: "Footer" },
    { name: "seo", title: "SEO & Analytics" },
  ],
  fields: [
    // ── GENERAL ──────────────────────────────────────────
    defineField({ name: "siteName", title: "Nombre del sitio", type: "string", group: "general" }),
    defineField({ name: "siteUrl", title: "URL del sitio", type: "url", group: "general" }),
    defineField({ name: "logo", title: "Logo principal", type: "image", options: { hotspot: true }, group: "general" }),
    defineField({ name: "logoAlt", title: "Logo versión clara (para footer)", type: "image", options: { hotspot: true }, group: "general" }),
    defineField({
      name: "organization",
      title: "Organización",
      type: "object",
      group: "general",
      fields: [
        { name: "phone", title: "Teléfono principal", type: "string" },
        { name: "whatsapp", title: "Número WhatsApp (con código país)", type: "string" },
        { name: "email", title: "Email", type: "string" },
        { name: "sameAs", title: "Redes sociales (URLs)", type: "array", of: [{ type: "url" }] },
      ],
    }),

    // ── HEADER ───────────────────────────────────────────
    defineField({
      name: "topBar",
      title: "Barra superior",
      type: "object",
      group: "header",
      fields: [
        { name: "enabled", title: "Mostrar barra superior", type: "boolean", initialValue: false },
        { name: "text", title: "Texto", type: "string" },
        { name: "linkLabel", title: "Texto del enlace", type: "string" },
        { name: "linkUrl", title: "URL del enlace", type: "string" },
        { name: "bgColor", title: "Color de fondo (hex)", type: "string" },
      ],
    }),
    defineField({
      name: "headerSocial",
      title: "Mostrar redes en header",
      type: "boolean",
      initialValue: false,
      group: "header",
    }),
    defineField({
      name: "social",
      title: "Redes sociales",
      type: "object",
      group: "header",
      fields: [
        { name: "facebook", title: "Facebook URL", type: "url" },
        { name: "instagram", title: "Instagram URL", type: "url" },
        { name: "linkedin", title: "LinkedIn URL", type: "url" },
        { name: "youtube", title: "YouTube URL", type: "url" },
        { name: "tiktok", title: "TikTok URL", type: "url" },
        { name: "whatsapp", title: "WhatsApp URL (wa.me/...)", type: "url" },
      ],
    }),
    defineField({
      name: "cta",
      title: "Botón CTA del header",
      type: "object",
      group: "header",
      fields: [
        { name: "label", title: "Texto", type: "string" },
        { name: "url", title: "URL", type: "string" },
      ],
    }),
    defineField({
      name: "navigation",
      title: "Navegación principal",
      type: "array",
      of: [{ type: "navItem" }],
      group: "header",
    }),

    // ── FOOTER ───────────────────────────────────────────
    defineField({
      name: "footerTagline",
      title: "Tagline del footer",
      type: "string",
      group: "footer",
    }),
    defineField({
      name: "footerColumns",
      title: "Columnas del footer",
      type: "array",
      group: "footer",
      of: [
        {
          type: "object",
          name: "footerColumn",
          fields: [
            { name: "title", title: "Título de columna", type: "string" },
            {
              name: "links",
              title: "Enlaces",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    { name: "label", title: "Texto", type: "string" },
                    { name: "url", title: "URL", type: "string" },
                  ],
                  preview: { select: { title: "label", subtitle: "url" } },
                },
              ],
            },
          ],
          preview: { select: { title: "title" } },
        },
      ],
    }),
    defineField({
      name: "footerLocations",
      title: "Ubicaciones / Contactos",
      type: "array",
      group: "footer",
      of: [
        {
          type: "object",
          fields: [
            { name: "city", title: "Ciudad", type: "string" },
            { name: "phone", title: "Teléfono", type: "string" },
            { name: "whatsapp", title: "WhatsApp (wa.me/...)", type: "string" },
            { name: "email", title: "Email", type: "string" },
          ],
          preview: { select: { title: "city", subtitle: "phone" } },
        },
      ],
    }),
    defineField({
      name: "footerCtaLabel",
      title: "Texto del botón CTA (footer)",
      type: "string",
      group: "footer",
    }),
    defineField({
      name: "footerCtaUrl",
      title: "URL del botón CTA (footer)",
      type: "string",
      group: "footer",
    }),
    defineField({
      name: "footerCopyright",
      title: "Texto de copyright",
      type: "string",
      group: "footer",
    }),

    // ── SEO & ANALYTICS ──────────────────────────────────
    defineField({ name: "defaultTitle", title: "Título por defecto", type: "string", group: "seo" }),
    defineField({ name: "defaultDescription", title: "Descripción por defecto", type: "text", rows: 3, group: "seo" }),
    defineField({ name: "defaultOgImage", title: "Imagen OG por defecto", type: "image", options: { hotspot: true }, group: "seo" }),
    defineField({ name: "analyticsId", title: "Google Analytics ID", type: "string", group: "seo" }),
    defineField({ name: "tagManagerId", title: "Google Tag Manager ID", type: "string", group: "seo" }),
    defineField({ name: "adsenseClient", title: "AdSense Client ID", type: "string", group: "seo" }),
    defineField({ name: "searchConsoleVerification", title: "Search Console Verification", type: "string", group: "seo" }),
  ],
  preview: {
    select: { title: "siteName" },
  },
});
