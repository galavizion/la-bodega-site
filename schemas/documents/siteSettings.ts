import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Configuración del sitio",
  type: "document",
  groups: [
    { name: "general", title: "General" },
    { name: "menu",    title: "Menú" },
    { name: "header",  title: "Header" },
    { name: "footer",  title: "Footer" },
    { name: "seo",     title: "SEO" },
    { name: "codes",   title: "Códigos" },
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
      group: "menu",
    }),

    // ── FOOTER ───────────────────────────────────────────
    defineField({
      name: "footerMatriz",
      title: "Datos de Matriz / CEDIS principal",
      type: "object",
      group: "footer",
      fields: [
        { name: "colTitle",  title: "Título de columna (ej: Contacto)",     type: "string", initialValue: "Contacto" },
        { name: "name",      title: "Nombre (ej: CEDIS MONTERREY)",          type: "string" },
        { name: "address",   title: "Dirección",                             type: "string" },
        { name: "phone",     title: "Teléfono",                              type: "string" },
      ],
    }),
    defineField({
      name: "footerCategoriesTitle",
      title: "Título columna Categorías",
      type: "string",
      initialValue: "Categorías",
      group: "footer",
    }),
    defineField({
      name: "footerNavTitle",
      title: "Título columna Menú",
      type: "string",
      initialValue: "Menú",
      group: "footer",
    }),
    defineField({
      name: "footerSocialTitle",
      title: "Título columna Redes",
      type: "string",
      initialValue: "Síguenos",
      group: "footer",
    }),
    defineField({
      name: "footerBranches",
      title: "Sucursales",
      type: "array",
      group: "footer",
      description: "Máximo 4 sucursales para el segundo renglón del footer",
      of: [
        {
          type: "object",
          fields: [
            { name: "name",    title: "Nombre de sucursal", type: "string" },
            { name: "url",     title: "URL (clic en el título)", type: "string" },
            { name: "address", title: "Dirección",          type: "string" },
            { name: "phone",   title: "Teléfono",           type: "string" },
          ],
          preview: { select: { title: "name", subtitle: "phone" } },
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

    // ── TIENDA ───────────────────────────────────────────
    defineField({
      name: "shop",
      title: "Tienda / Precios",
      type: "object",
      group: "general",
      fields: [
        {
          name: "currency",
          title: "Moneda de los precios en catálogo",
          type: "string",
          options: { list: ["USD", "MXN"], layout: "radio" },
          initialValue: "USD",
          description: "Si los precios están en USD se convierten a MXN usando el tipo de cambio.",
        },
        {
          name: "usdRate",
          title: "Tipo de cambio USD → MXN",
          type: "number",
          description: "Ejemplo: 17.50 significa que $1 USD = $17.50 MXN. Actualiza este valor manualmente.",
          initialValue: 17,
        },
      ],
    }),

    // ── SEO ──────────────────────────────────────────────
    defineField({ name: "defaultTitle", title: "Título por defecto", type: "string", group: "seo" }),
    defineField({ name: "defaultDescription", title: "Descripción por defecto", type: "text", rows: 3, group: "seo" }),
    defineField({ name: "defaultOgImage", title: "Imagen OG por defecto", type: "image", options: { hotspot: true }, group: "seo" }),

    // ── CÓDIGOS ──────────────────────────────────────────
    defineField({ name: "analyticsId", title: "Google Analytics ID (G-XXXXXXX)", type: "string", group: "codes" }),
    defineField({ name: "tagManagerId", title: "Google Tag Manager ID (GTM-XXXXX)", type: "string", group: "codes" }),
    defineField({ name: "adsenseClient", title: "AdSense Client ID (ca-pub-XXXXXX)", type: "string", group: "codes" }),
    defineField({ name: "searchConsoleVerification", title: "Search Console Verification meta", type: "string", group: "codes" }),
  ],
  preview: {
    select: { title: "siteName" },
  },
});
