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
  ],
  preview: {
    select: { currency: "currency", rate: "usdRate" },
    prepare: ({ currency, rate }) => ({
      title: "Tienda / Precios",
      subtitle: currency === "USD" ? `USD → MXN × ${rate}` : "Precios en MXN",
    }),
  },
});
