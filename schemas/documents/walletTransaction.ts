import { defineField, defineType } from "sanity";

export const walletTransaction = defineType({
  name: "walletTransaction",
  title: "Movimiento de cashback",
  type: "document",
  fields: [
    defineField({
      name: "customerEmail",
      title: "Email del cliente",
      type: "string",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "order",
      title: "Pedido",
      type: "reference",
      to: [{ type: "order" }],
      weak: true,
      readOnly: true,
    }),
    defineField({
      name: "amount",
      title: "Monto",
      type: "number",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "status",
      title: "Estado",
      type: "string",
      readOnly: true,
      options: {
        list: [
          { title: "✅ Disponible", value: "available" },
          { title: "🛒 Usado en pedido", value: "redeemed" },
          { title: "⛔ Revertido", value: "reverted" },
        ],
      },
      initialValue: "available",
    }),
    defineField({
      name: "note",
      title: "Nota",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "createdAt",
      title: "Fecha",
      type: "datetime",
      readOnly: true,
    }),
  ],
  preview: {
    select: { email: "customerEmail", amount: "amount", status: "status" },
    prepare: ({ email, amount, status }) => ({
      title: `${email ?? "—"} · $${amount ?? 0}`,
      subtitle: status === "reverted" ? "Revertido" : status === "redeemed" ? "Usado en pedido" : "Disponible",
    }),
  },
  orderings: [
    { title: "Más recientes", name: "createdAtDesc", by: [{ field: "createdAt", direction: "desc" }] },
  ],
});
