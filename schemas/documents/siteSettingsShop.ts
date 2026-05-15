import { defineField, defineType } from "sanity";

export const siteSettingsShop = defineType({
  name: "siteSettingsShop",
  title: "Configuración de tienda",
  type: "document",
  fields: [
    defineField({
      name: "currency",
      title: "Moneda de los precios en catálogo",
      type: "string",
      options: { list: ["USD", "MXN"], layout: "radio" },
      initialValue: "USD",
      description: "Si los precios están en USD se convierten a MXN usando el tipo de cambio abajo.",
    }),
    defineField({
      name: "usdRate",
      title: "Tipo de cambio USD → MXN",
      type: "number",
      description: "Ej: 17.50 = $1 USD vale $17.50 MXN. Actualiza este valor manualmente.",
      initialValue: 17,
    }),
    defineField({
      name: "markupPercent",
      title: "Margen precio unitario (%)",
      type: "number",
      description: "Se agrega al precio de cada pieza individual. Ej: 26.5 = +26.5% sobre el precio base.",
      initialValue: 26.5,
      validation: (Rule) => Rule.min(0).max(200),
    }),
    defineField({
      name: "boxMarkupPercent",
      title: "Margen precio por caja (%)",
      type: "number",
      description: "Se usa para calcular el precio de caja: precio unitario × piezas × (1 + este %). Independiente del margen individual.",
      initialValue: 0,
      validation: (Rule) => Rule.min(-100).max(200),
    }),
  ],
  preview: {
    select: { currency: "currency", rate: "usdRate", markup: "markupPercent", boxMarkup: "boxMarkupPercent" },
    prepare: ({ currency, rate, markup, boxMarkup }) => ({
      title: "Tienda / Precios",
      subtitle: [
        currency === "USD" ? `USD → MXN × ${rate}` : "Precios en MXN",
        markup != null ? `+${markup}% unitario` : "",
        boxMarkup != null ? `+${boxMarkup}% caja` : "",
      ].filter(Boolean).join(" · "),
    }),
  },
});
