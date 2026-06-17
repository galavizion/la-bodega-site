import { defineField, defineType } from "sanity";

export const branch = defineType({
  name: "branch",
  title: "Sucursal",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Nombre de la sucursal",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "address",
      title: "Dirección",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "phone",
      title: "Teléfono",
      type: "string",
    }),
    defineField({
      name: "hours",
      title: "Horario de atención",
      type: "string",
      description: 'Ej: Lun–Vie 8:00–18:00, Sáb 9:00–14:00',
    }),
    defineField({
      name: "active",
      title: "Sucursal activa",
      type: "boolean",
      initialValue: true,
      description: "Desactiva para ocultar esta sucursal en el checkout sin eliminarla.",
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "address", active: "active" },
    prepare: ({ title, subtitle, active }) => ({
      title: `${active !== false ? "✅" : "❌"} ${title ?? "Sin nombre"}`,
      subtitle: subtitle ?? "",
    }),
  },
  orderings: [
    { title: "Nombre A-Z", name: "nameAsc", by: [{ field: "name", direction: "asc" }] },
  ],
});
