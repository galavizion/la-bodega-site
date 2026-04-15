import { defineField, defineType } from "sanity";

export const navItem = defineType({
  name: "navItem",
  title: "Elemento de navegación",
  type: "object",
  fields: [
    defineField({ name: "label", title: "Etiqueta", type: "string" }),
    defineField({
      name: "type",
      title: "Tipo",
      type: "string",
      options: {
        list: [
          { title: "Página interna", value: "internal" },
          { title: "URL externa", value: "external" },
          { title: "Ancla (#)", value: "anchor" },
        ],
      },
    }),
    defineField({ name: "anchorId", title: "ID de ancla", type: "string" }),
    defineField({ name: "externalUrl", title: "URL externa", type: "url" }),
    defineField({
      name: "internalPage",
      title: "Página interna",
      type: "reference",
      to: [{ type: "page" }],
    }),
    defineField({
      name: "children",
      title: "Submenú",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "label", title: "Etiqueta", type: "string" },
            {
              name: "type",
              title: "Tipo",
              type: "string",
              options: {
                list: [
                  { title: "Página interna", value: "internal" },
                  { title: "URL externa", value: "external" },
                  { title: "Ancla (#)", value: "anchor" },
                ],
              },
            },
            { name: "anchorId", title: "ID de ancla", type: "string" },
            { name: "externalUrl", title: "URL externa", type: "url" },
            {
              name: "internalPage",
              title: "Página interna",
              type: "reference",
              to: [{ type: "page" }],
            },
          ],
        },
      ],
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "type" },
  },
});
