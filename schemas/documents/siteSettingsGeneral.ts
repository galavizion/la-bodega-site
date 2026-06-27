import { defineField, defineType } from "sanity";

export const siteSettingsGeneral = defineType({
  name: "siteSettingsGeneral",
  title: "General",
  type: "document",
  fields: [
    defineField({ name: "siteName", title: "Nombre del sitio", type: "string" }),
    defineField({ name: "siteUrl", title: "URL del sitio", type: "url" }),
    defineField({ name: "logo", title: "Logo principal", type: "image", options: { hotspot: true } }),
    defineField({ name: "logoAlt", title: "Logo versión clara (para footer)", type: "image", options: { hotspot: true } }),
    defineField({
      name: "orderNotifyEmails",
      title: "Emails de notificación de pedidos",
      description: "Recibirán un aviso cada vez que entre un nuevo pedido.",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "organization",
      title: "Organización",
      type: "object",
      fields: [
        { name: "phone", title: "Teléfono principal", type: "string" },
        { name: "whatsapp", title: "Número WhatsApp (con código país)", type: "string" },
        { name: "email", title: "Email de contacto", type: "string" },
        { name: "sameAs", title: "Redes sociales (URLs)", type: "array", of: [{ type: "url" }] },
      ],
    }),
  ],
  preview: { select: { title: "siteName" }, prepare: ({ title }) => ({ title: title ?? "General" }) },
});
