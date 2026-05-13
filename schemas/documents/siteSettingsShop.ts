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
      title: "Aumento de precio (%)",
      type: "number",
      description: "Porcentaje que se agrega automáticamente al precio final (envío, manejo, etc.). Ej: 26.5 = +26.5% sobre el precio base.",
      initialValue: 26.5,
      validation: (Rule) => Rule.min(0).max(200),
    }),
  ],
  preview: {
    select: { currency: "currency", rate: "usdRate", markup: "markupPercent" },
    prepare: ({ currency, rate, markup }) => ({
      title: "Tienda / Precios",
      subtitle: [
        currency === "USD" ? `USD → MXN × ${rate}` : "Precios en MXN",
        markup != null ? `+${markup}% markup` : "",
      ].filter(Boolean).join(" · "),
    }),
  },
});
