import { defineField, defineType } from "sanity";

export const customerProfile = defineType({
  name: "customerProfile",
  title: "Perfil de cliente",
  type: "document",
  fields: [
    defineField({ name: "email",   type: "string", title: "Email",    readOnly: true }),
    defineField({ name: "name",    type: "string", title: "Nombre" }),
    defineField({ name: "phone",   type: "string", title: "Teléfono" }),
    defineField({ name: "company", type: "string", title: "Empresa" }),
    defineField({ name: "address", type: "string", title: "Dirección" }),
    defineField({ name: "city",    type: "string", title: "Ciudad" }),
    defineField({ name: "state",   type: "string", title: "Estado" }),
    defineField({ name: "zip",     type: "string", title: "Código postal" }),
  ],
  preview: {
    select: { title: "name", subtitle: "email" },
  },
});
