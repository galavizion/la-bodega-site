import { defineField, defineType } from "sanity";

export const sectionProductsCarousel = defineType({
  name: "sectionProductsCarousel",
  title: "Carrusel de productos",
  type: "object",
  fields: [
    defineField({ name: "title",    title: "Título",    type: "string" }),
    defineField({ name: "subtitle", title: "Subtítulo", type: "string" }),
    defineField({
      name: "sourceType",
      title: "Mostrar",
      type: "string",
      options: {
        list: [
          { title: "Selección manual de productos", value: "manual"     },
          { title: "Productos recientes",            value: "recent"     },
          { title: "Productos destacados (featured)",value: "featured"   },
          { title: "Categorías",                     value: "categories" },
          { title: "Marcas",                         value: "brands"     },
        ],
        layout: "radio",
      },
      initialValue: "recent",
    }),
    defineField({
      name: "manualItems",
      title: "Productos seleccionados",
      description: "Busca y elige hasta 10 productos de cualquier categoría o marca",
      type: "array",
      of: [
        {
          type: "reference",
          to: [{ type: "catalogItem" }],
          weak: true,
          options: {
            disableNew: true,
            filter: "published != false",
          },
        },
      ],
      validation: (Rule) => Rule.max(10),
      hidden: ({ parent }: any) => parent?.sourceType !== "manual",
    }),
    defineField({
      name: "limit",
      title: "Cantidad de elementos (máx. 10)",
      description: "No aplica en selección manual (se muestran todos los seleccionados)",
      type: "number",
      initialValue: 10,
      validation: (Rule) => Rule.min(1).max(10),
      hidden: ({ parent }: any) => parent?.sourceType === "manual",
    }),
    defineField({
      name: "categoryFilter",
      title: "Filtrar por categoría (opcional)",
      description: "Solo aplica para productos recientes o destacados",
      type: "reference",
      to: [{ type: "productCategory" }],
      hidden: ({ parent }: any) => !["recent", "featured"].includes(parent?.sourceType),
    }),
    defineField({
      name: "cta",
      title: "Botón inferior",
      type: "object",
      options: { collapsible: true, collapsed: false },
      fields: [
        { name: "label", title: "Texto del botón", type: "string" },
        { name: "url",   title: "URL",             type: "string" },
        {
          name: "style",
          title: "Estilo",
          type: "string",
          options: {
            list: [
              { title: "Principal (amarillo)", value: "primary" },
              { title: "Secundario (borde)",   value: "ghost"   },
            ],
            layout: "radio",
          },
          initialValue: "primary",
        },
      ],
    }),
    defineField({
      name: "bgColor",
      title: "Color de fondo",
      type: "string",
      options: {
        list: [
          { title: "Transparente (default)", value: "none"    },
          { title: "Negro",                  value: "#000000" },
          { title: "Blanco",                 value: "#ffffff" },
          { title: "Amarillo",               value: "#FFD700" },
        ],
        layout: "radio",
      },
      initialValue: "none",
    }),
    defineField({
      name: "settings",
      title: "Configuración",
      type: "object",
      fields: [{ name: "sectionId", title: "ID de sección (anchor)", type: "string" }],
    }),
  ],
  preview: {
    select: { title: "title", sourceType: "sourceType" },
    prepare: ({ title, sourceType }) => ({
      title:    title || "Carrusel de productos",
      subtitle: `Carrusel · ${sourceType || "recent"}`,
    }),
  },
});
