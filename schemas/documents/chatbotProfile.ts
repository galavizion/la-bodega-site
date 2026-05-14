import { defineField, defineType } from "sanity";

export const chatbotProfile = defineType({
  name: "chatbotProfile",
  title: "Chatbot IA",
  type: "document",
  groups: [
    { name: "identity", title: "Identidad" },
    { name: "knowledge", title: "Conocimiento" },
    { name: "behavior", title: "Comportamiento" },
  ],
  fields: [
    defineField({ name: "name", title: "Nombre del asistente", type: "string", group: "identity", initialValue: "Sparkly Fire" }),
    defineField({ name: "greeting", title: "Mensaje de bienvenida", type: "text", rows: 2, group: "identity",
      initialValue: "¡Hola! Soy Sparkly Fire, asistente de La Bodega del Instalador. ¿En qué puedo ayudarte hoy?" }),
    defineField({ name: "avatarEmoji", title: "Emoji / Avatar", type: "string", group: "identity", initialValue: "🔥",
      description: "Un emoji que aparece en el botón del chat" }),

    defineField({ name: "businessDescription", title: "Descripción del negocio", type: "text", rows: 4, group: "knowledge",
      description: "Describe a qué se dedica la empresa, a quién sirve, qué la diferencia." }),
    defineField({ name: "services", title: "Servicios y productos principales", type: "array", group: "knowledge",
      of: [{ type: "string" }], options: { layout: "tags" },
      description: "Lista rápida de lo que ofrecen (el bot también puede buscar en el catálogo)." }),
    defineField({ name: "faq", title: "Preguntas frecuentes", type: "array", group: "knowledge",
      of: [{
        type: "object",
        title: "Pregunta",
        fields: [
          { name: "question", title: "Pregunta", type: "string" },
          { name: "answer",   title: "Respuesta", type: "text", rows: 3 },
        ],
        preview: { select: { title: "question" } },
      }],
    }),
    defineField({ name: "extraContext", title: "Información adicional", type: "text", rows: 5, group: "knowledge",
      description: "Política de envíos, formas de pago, zonas de cobertura, garantías, etc." }),

    defineField({ name: "tone", title: "Tono de respuesta", type: "string", group: "behavior",
      options: { list: [
        { title: "Profesional y formal", value: "formal" },
        { title: "Amigable y cercano", value: "friendly" },
        { title: "Técnico y preciso",   value: "technical" },
      ], layout: "radio" }, initialValue: "friendly" }),
    defineField({ name: "enableCart", title: "Puede agregar productos al carrito", type: "boolean", group: "behavior", initialValue: true }),
    defineField({ name: "enableSearch", title: "Puede buscar en el catálogo", type: "boolean", group: "behavior", initialValue: true }),
    defineField({ name: "whatsappFallback", title: "Número WhatsApp para escalar", type: "string", group: "behavior",
      description: "Si el usuario quiere hablar con una persona, el bot da este número." }),
  ],
  preview: {
    select: { title: "name", subtitle: "greeting" },
  },
});
