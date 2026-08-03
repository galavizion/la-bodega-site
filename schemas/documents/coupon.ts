import { defineField, defineType } from "sanity";

export const coupon = defineType({
  name: "coupon",
  title: "Cupón",
  type: "document",
  fields: [
    defineField({
      name: "code",
      title: "Código",
      type: "string",
      description: "El cliente lo escribe en el checkout. No distingue mayúsculas/minúsculas.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "percent",
      title: "Porcentaje de descuento (%)",
      type: "number",
      initialValue: 10,
      validation: (Rule) => Rule.required().min(0).max(100),
    }),
    defineField({
      name: "active",
      title: "Cupón activo",
      type: "boolean",
      initialValue: true,
      description: "Desactiva para dejar de aceptar este código sin eliminarlo.",
    }),
    defineField({
      name: "validFrom",
      title: "Válido desde",
      type: "datetime",
      description: "Opcional. Si se deja vacío, el cupón es válido desde ya.",
    }),
    defineField({
      name: "validUntil",
      title: "Válido hasta",
      type: "datetime",
      description: "Opcional. Si se deja vacío, el cupón no expira por fecha.",
    }),
    defineField({
      name: "minOrderAmount",
      title: "Compra mínima (MXN)",
      type: "number",
      description: "Opcional. Subtotal mínimo del carrito para poder aplicar el cupón.",
    }),
    defineField({
      name: "maxUses",
      title: "Límite de usos",
      type: "number",
      description: "Opcional. Número total de pedidos en los que se puede usar este cupón.",
    }),
    defineField({
      name: "usedCount",
      title: "Usos registrados",
      type: "number",
      readOnly: true,
      initialValue: 0,
      description: "Se incrementa automáticamente cada vez que se usa en un pedido.",
    }),
  ],
  preview: {
    select: { code: "code", percent: "percent", active: "active", usedCount: "usedCount", maxUses: "maxUses" },
    prepare: ({ code, percent, active, usedCount, maxUses }) => ({
      title: `${active !== false ? "✅" : "❌"} ${code ?? "Sin código"} — ${percent ?? 0}%`,
      subtitle: maxUses ? `${usedCount ?? 0}/${maxUses} usos` : `${usedCount ?? 0} usos`,
    }),
  },
  orderings: [
    { title: "Código A-Z", name: "codeAsc", by: [{ field: "code", direction: "asc" }] },
  ],
});
