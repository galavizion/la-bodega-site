import { defineField, defineType } from "sanity";

export const sectionHero = defineType({
  name: "sectionHero",
  title: "Hero",
  type: "object",
  fields: [
    // ── Estilo visual ────────────────────────────────────────────
    defineField({
      name: "visualStyle",
      title: "Estilo visual",
      type: "string",
      options: {
        list: [
          { title: "Texto + imagen lateral (default)", value: "default" },
          { title: "Imagen de fondo + imagen central",  value: "bg-image" },
          { title: "Texto + mapa de Google",            value: "map"      },
        ],
        layout: "radio",
      },
      initialValue: "default",
    }),

    // ── Contenido ────────────────────────────────────────────────
    defineField({ name: "heading",    title: "Título principal", type: "string" }),
    defineField({ name: "subheading", title: "Subtítulo",        type: "text", rows: 3 }),
    defineField({
      name: "bullets",
      title: "Puntos clave",
      type: "array",
      of: [{ type: "string" }],
    }),

    // ── Imagen lateral (solo estilo default) ─────────────────────
    defineField({
      name: "image",
      title: "Imagen lateral",
      type: "image",
      options: { hotspot: true },
      hidden: ({ parent }) => parent?.visualStyle !== "default" && parent?.visualStyle != null,
    }),

    // ── Estilo bg-image ──────────────────────────────────────────
    defineField({
      name: "bgColor",
      title: "Color de fondo sólido",
      type: "string",
      description: "Color CSS válido: #1e293b, rgb(0,0,0), etc. Si hay imagen, se usa como fallback.",
      hidden: ({ parent }) => parent?.visualStyle !== "bg-image",
    }),
    defineField({
      name: "bgImage",
      title: "Imagen de fondo (opcional, cubre el color)",
      type: "image",
      options: { hotspot: true },
      hidden: ({ parent }) => parent?.visualStyle !== "bg-image",
    }),
    defineField({
      name: "bgOverlay",
      title: "Oscurecer fondo (0–90%)",
      type: "number",
      options: { list: [0,10,20,30,40,50,60,70,80,90] },
      initialValue: 40,
      hidden: ({ parent }) => parent?.visualStyle !== "bg-image",
    }),
    defineField({
      name: "centerImage",
      title: "Imagen central (opcional)",
      type: "image",
      options: { hotspot: true },
      hidden: ({ parent }) => parent?.visualStyle !== "bg-image",
    }),

    // ── Estilo map ───────────────────────────────────────────────
    defineField({
      name: "mapUrl",
      title: "Enlace de Google Maps",
      type: "url",
      description: "Pega el enlace de compartir de Google Maps (maps.app.goo.gl/... o maps.google.com/...)",
      hidden: ({ parent }) => parent?.visualStyle !== "map",
    }),

    // ── CTAs ─────────────────────────────────────────────────────
    defineField({
      name: "primaryCta",
      title: "Botón primario",
      type: "object",
      fields: [
        { name: "label", title: "Texto", type: "string" },
        { name: "url",   title: "URL",   type: "string" },
      ],
    }),
    defineField({
      name: "secondaryCta",
      title: "Botón secundario",
      type: "object",
      fields: [
        { name: "label", title: "Texto", type: "string" },
        { name: "url",   title: "URL",   type: "string" },
      ],
    }),

    // ── Configuración ────────────────────────────────────────────
    defineField({
      name: "settings",
      title: "Configuración",
      type: "object",
      fields: [
        { name: "sectionId", title: "ID de sección", type: "string" },
        { name: "theme",     title: "Tema de texto", type: "string",
          options: { list: [{ title: "Claro (sobre oscuro)", value: "transparent" }, { title: "Oscuro (sobre claro)", value: "light" }] } },
      ],
    }),
  ],
  preview: {
    select: { title: "heading" },
    prepare: ({ title }) => ({ title: title || "Hero", subtitle: "sectionHero" }),
  },
});
