import { defineField, defineType } from "sanity";

const TYPE_OPTIONS = [
  { title: "Página interna",        value: "internal"  },
  { title: "URL externa",            value: "external"  },
  { title: "Ancla (#)",              value: "anchor"    },
  { title: "Tienda (catálogo)",      value: "shop"      },
  { title: "Categoría de producto", value: "category"  },
  { title: "Blog",                  value: "blog"      },
];

export const navItem = defineType({
  name: "navItem",
  title: "Elemento de navegación",
  type: "object",
  fields: [
    defineField({
      name: "icon",
      title: "Ícono",
      type: "image",
      description: "Opcional. Sube un SVG o PNG (se mostrará a la izquierda del label).",
      options: { accept: "image/svg+xml,image/png,image/webp" },
    }),
    defineField({ name: "label", title: "Etiqueta", type: "string" }),
    defineField({ name: "type",  title: "Tipo",     type: "string", options: { list: TYPE_OPTIONS } }),
    defineField({ name: "anchorId",    title: "ID de ancla",           type: "string" }),
    defineField({ name: "externalUrl", title: "URL externa",           type: "url"    }),
    defineField({ name: "internalPage",    title: "Página interna",          type: "reference", to: [{ type: "page" }]            }),
    defineField({ name: "productCategory", title: "Categoría de producto",   type: "reference", to: [{ type: "productCategory" }] }),
    defineField({
      name: "children",
      title: "Submenú",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "icon",
              title: "Ícono",
              type: "image",
              options: { accept: "image/svg+xml,image/png,image/webp" },
            }),
            defineField({ name: "label", title: "Etiqueta", type: "string" }),
            defineField({ name: "type",  title: "Tipo",     type: "string", options: { list: TYPE_OPTIONS } }),
            defineField({ name: "anchorId",    title: "ID de ancla",         type: "string" }),
            defineField({ name: "externalUrl", title: "URL externa",         type: "url"    }),
            defineField({ name: "internalPage",    title: "Página interna",        type: "reference", to: [{ type: "page" }]            }),
            defineField({ name: "productCategory", title: "Categoría de producto", type: "reference", to: [{ type: "productCategory" }] }),
          ],
          preview: { select: { title: "label", subtitle: "type", media: "icon" } },
        },
      ],
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "type", media: "icon" },
  },
});
