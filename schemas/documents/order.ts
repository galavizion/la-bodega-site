import { defineField, defineType } from "sanity";

export const order = defineType({
  name: "order",
  title: "Pedido",
  type: "document",
  groups: [
    { name: "info", title: "Información" },
    { name: "customer", title: "Cliente" },
    { name: "items", title: "Productos" },
  ],
  fields: [
    defineField({
      name: "orderNumber",
      title: "# Pedido",
      type: "string",
      group: "info",
      readOnly: true,
    }),
    defineField({
      name: "status",
      title: "Estado",
      type: "string",
      group: "info",
      options: {
        list: [
          { title: "⏳ Pendiente", value: "pending" },
          { title: "✅ Confirmado", value: "confirmed" },
          { title: "📦 En preparación", value: "processing" },
          { title: "🚚 Enviado", value: "shipped" },
          { title: "🏠 Entregado", value: "delivered" },
          { title: "❌ Cancelado", value: "cancelled" },
        ],
        layout: "radio",
      },
      initialValue: "pending",
    }),
    defineField({ name: "createdAt", title: "Fecha del pedido", type: "datetime", group: "info", readOnly: true }),
    defineField({ name: "notes", title: "Notas internas", type: "text", rows: 3, group: "info" }),
    defineField({
      name: "customer",
      title: "Datos del cliente",
      type: "object",
      group: "customer",
      fields: [
        { name: "name", title: "Nombre", type: "string" },
        { name: "email", title: "Email", type: "string" },
        { name: "phone", title: "Teléfono / WhatsApp", type: "string" },
        { name: "address", title: "Dirección de envío", type: "text", rows: 3 },
        { name: "city", title: "Ciudad", type: "string" },
        { name: "state", title: "Estado / Provincia", type: "string" },
        { name: "zip", title: "Código postal", type: "string" },
      ],
    }),
    defineField({
      name: "items",
      title: "Productos del pedido",
      type: "array",
      group: "items",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "product",
              title: "Producto",
              type: "reference",
              to: [{ type: "catalogItem" }],
            },
            { name: "quantity", title: "Cantidad", type: "number", initialValue: 1 },
            { name: "unitPrice", title: "Precio unitario", type: "number" },
            { name: "variantLabel", title: "Variante (opcional)", type: "string" },
          ],
          preview: {
            select: {
              title: "product.title",
              qty: "quantity",
              price: "unitPrice",
            },
            prepare: ({ title, qty, price }) => ({
              title: title ?? "Producto",
              subtitle: `${qty ?? 1} × $${price ?? 0}`,
            }),
          },
        },
      ],
    }),
    defineField({ name: "subtotal", title: "Subtotal", type: "number", group: "items", readOnly: true }),
    defineField({ name: "shipping", title: "Envío", type: "number", group: "items", initialValue: 0 }),
    defineField({ name: "total", title: "Total", type: "number", group: "items", readOnly: true }),
    defineField({
      name: "paymentMethod",
      title: "Método de pago",
      type: "string",
      group: "info",
      options: {
        list: [
          { title: "Transferencia", value: "transfer" },
          { title: "Efectivo", value: "cash" },
          { title: "Tarjeta", value: "card" },
          { title: "WhatsApp / Manual", value: "whatsapp" },
        ],
      },
    }),
  ],
  preview: {
    select: {
      orderNumber: "orderNumber",
      name: "customer.name",
      status: "status",
      total: "total",
    },
    prepare: ({ orderNumber, name, status, total }) => ({
      title: `#${orderNumber ?? "---"} — ${name ?? "Sin nombre"}`,
      subtitle: `${status ?? "pending"} · $${total ?? 0}`,
    }),
  },
  orderings: [
    {
      title: "Más recientes",
      name: "createdAtDesc",
      by: [{ field: "createdAt", direction: "desc" }],
    },
  ],
});
