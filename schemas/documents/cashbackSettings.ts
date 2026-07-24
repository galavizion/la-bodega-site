import { defineField, defineType } from "sanity";

export const cashbackSettings = defineType({
  name: "cashbackSettings",
  title: "Cashback",
  type: "document",
  fields: [
    defineField({
      name: "enabled",
      title: "Activar cashback",
      type: "boolean",
      initialValue: false,
      description: "Si está apagado, no se acredita cashback en ningún pedido nuevo.",
    }),
    defineField({
      name: "percent",
      title: "Porcentaje de cashback (%)",
      type: "number",
      initialValue: 2,
      description: "Ej: 2 = el cliente recibe 2% del total del pedido como saldo.",
      validation: (Rule) => Rule.min(0).max(100),
    }),
  ],
  preview: {
    select: { enabled: "enabled", percent: "percent" },
    prepare: ({ enabled, percent }) => ({
      title: "Cashback",
      subtitle: enabled ? `Activo · ${percent ?? 0}%` : "Desactivado",
    }),
  },
});
