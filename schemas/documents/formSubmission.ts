import { defineField, defineType } from "sanity";

export const formSubmission = defineType({
  name: "formSubmission",
  title: "Envío de formulario",
  type: "document",
  fields: [
    defineField({ name: "formType",  title: "Tipo",    type: "string" }),
    defineField({ name: "name",      title: "Nombre",  type: "string" }),
    defineField({ name: "email",     title: "Correo",  type: "string" }),
    defineField({ name: "phone",     title: "Teléfono", type: "string" }),
    defineField({ name: "message",   title: "Mensaje", type: "text" }),
    defineField({
      name: "data",
      title: "Datos completos",
      type: "array",
      of: [{ type: "object", fields: [
        { name: "key",   title: "Campo", type: "string" },
        { name: "value", title: "Valor", type: "string" },
      ]}],
    }),
    defineField({ name: "submittedAt", title: "Fecha de envío", type: "datetime" }),
    defineField({ name: "page",        title: "Página de origen", type: "string" }),
    defineField({
      name: "status",
      title: "Estado",
      type: "string",
      options: {
        list: [
          { title: "Nuevo",      value: "new" },
          { title: "Revisado",   value: "reviewed" },
          { title: "Respondido", value: "replied" },
          { title: "Archivado",  value: "archived" },
        ],
      },
      initialValue: "new",
    }),
  ],
  orderings: [
    { title: "Más recientes", name: "dateDesc", by: [{ field: "submittedAt", direction: "desc" }] },
  ],
  preview: {
    select: { title: "name", subtitle: "email" },
  },
});
