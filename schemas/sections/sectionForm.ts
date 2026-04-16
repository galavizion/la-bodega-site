import { defineField, defineType } from "sanity";

export const sectionForm = defineType({
  name: "sectionForm",
  title: "Formulario de contacto",
  type: "object",
  fields: [
    defineField({ name: "title",          title: "Título",            type: "string" }),
    defineField({ name: "subtitle",       title: "Subtítulo",         type: "string" }),
    defineField({ name: "submitLabel",    title: "Texto del botón",   type: "string", initialValue: "Enviar mensaje" }),
    defineField({ name: "successMessage", title: "Mensaje de éxito",  type: "string", initialValue: "¡Mensaje recibido! Te contactamos pronto." }),
    defineField({
      name: "formType",
      title: "Tipo de formulario",
      type: "string",
      options: {
        list: [
          { title: "Contacto general", value: "contact" },
          { title: "Solicitar cotización", value: "quote" },
          { title: "Suscripción",      value: "newsletter" },
        ],
        layout: "radio",
      },
      initialValue: "contact",
    }),
    defineField({
      name: "fields",
      title: "Campos del formulario",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "type",
              title: "Tipo de campo",
              type: "string",
              options: {
                list: [
                  { title: "Texto",           value: "text" },
                  { title: "Email",           value: "email" },
                  { title: "Teléfono",        value: "tel" },
                  { title: "Área de texto",   value: "textarea" },
                  { title: "Selección",       value: "select" },
                ],
              },
            },
            { name: "label",       title: "Etiqueta",     type: "string" },
            { name: "placeholder", title: "Placeholder",  type: "string" },
            { name: "required",    title: "Requerido",    type: "boolean", initialValue: false },
            {
              name: "options",
              title: "Opciones (solo para Selección, una por línea)",
              type: "text",
              rows: 3,
              description: 'Ej: "Sprinklers\\nDetectores\\nExtintores"',
            },
          ],
          preview: {
            select: { title: "label", subtitle: "type" },
          },
        },
      ],
      initialValue: [
        { _type: "object", type: "text",  label: "Nombre",  placeholder: "Tu nombre",        required: true  },
        { _type: "object", type: "email", label: "Correo",  placeholder: "correo@empresa.com", required: true  },
        { _type: "object", type: "tel",   label: "Teléfono", placeholder: "55 1234 5678",      required: false },
        { _type: "object", type: "textarea", label: "Mensaje", placeholder: "¿En qué te podemos ayudar?", required: true },
      ],
    }),
    defineField({
      name: "whatsappFallback",
      title: "Botón alternativo de WhatsApp",
      type: "object",
      fields: [
        { name: "enabled", title: "Activar", type: "boolean", initialValue: false },
        { name: "phone",   title: "Número (con código de país, ej: 5215512345678)", type: "string" },
        { name: "label",   title: "Texto del botón", type: "string", initialValue: "O escríbenos por WhatsApp" },
      ],
    }),
    defineField({
      name: "settings",
      title: "Configuración",
      type: "object",
      fields: [{ name: "sectionId", title: "ID de sección (anchor)", type: "string" }],
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title: title || "Formulario", subtitle: "sectionForm" }),
  },
});
