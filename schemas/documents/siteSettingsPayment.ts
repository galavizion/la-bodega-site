import { defineField, defineType } from "sanity";

export const siteSettingsPayment = defineType({
  name: "siteSettingsPayment",
  title: "Métodos de pago",
  type: "document",
  groups: [
    { name: "transfer", title: "Transferencia / Depósito" },
    { name: "general",  title: "General" },
  ],
  fields: [
    // ── Transferencia ──────────────────────────────────
    defineField({
      name: "transferEnabled",
      title: "Habilitar transferencia / depósito",
      type: "boolean",
      group: "transfer",
      initialValue: true,
    }),
    defineField({
      name: "bankName",
      title: "Banco",
      type: "string",
      group: "transfer",
      description: "Ej: BBVA, Banorte, HSBC, Santander, Banamex…",
    }),
    defineField({
      name: "accountHolder",
      title: "Titular de la cuenta",
      type: "string",
      group: "transfer",
    }),
    defineField({
      name: "clabe",
      title: "CLABE interbancaria (18 dígitos)",
      type: "string",
      group: "transfer",
      validation: (Rule) =>
        Rule.regex(/^\d{18}$/, { name: "CLABE", invert: false }).warning(
          "La CLABE debe tener exactamente 18 dígitos numéricos"
        ),
    }),
    defineField({
      name: "accountNumber",
      title: "Número de cuenta (opcional)",
      type: "string",
      group: "transfer",
    }),
    defineField({
      name: "reference",
      title: "Concepto / Referencia sugerida",
      type: "string",
      group: "transfer",
      description: "Déjalo vacío para usar el número de pedido automático. Ej: «Pedido La Bodega».",
    }),
    defineField({
      name: "instructions",
      title: "Instrucciones adicionales",
      type: "text",
      rows: 4,
      group: "transfer",
      description: "Texto que verá el cliente en la pantalla de confirmación.",
      initialValue: "Una vez realizado el depósito o transferencia, envíanos el comprobante por WhatsApp para confirmar tu pedido.",
    }),
    defineField({
      name: "proofWhatsapp",
      title: "Solicitar comprobante por WhatsApp",
      type: "boolean",
      group: "transfer",
      initialValue: true,
      description: "Muestra un botón al cliente para enviar el comprobante directamente por WhatsApp.",
    }),

    // ── General ────────────────────────────────────────
    defineField({
      name: "notifyEmail",
      title: "Enviar email al recibir un pedido",
      type: "boolean",
      group: "general",
      initialValue: true,
    }),
  ],
  preview: {
    select: { bank: "bankName", holder: "accountHolder", enabled: "transferEnabled" },
    prepare: ({ bank, holder, enabled }) => ({
      title: "Métodos de pago",
      subtitle: enabled
        ? (bank ? `Transferencia · ${bank}${holder ? ` — ${holder}` : ""}` : "Transferencia habilitada (sin datos bancarios)")
        : "Sin métodos activos",
    }),
  },
});
