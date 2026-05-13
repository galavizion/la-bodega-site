import { defineField, defineType } from "sanity";

export const siteSettingsFooter = defineType({
  name: "siteSettingsFooter",
  title: "Footer",
  type: "document",
  fields: [
    defineField({
      name: "footerMatriz",
      title: "Datos de Matriz / CEDIS principal",
      type: "object",
      fields: [
        { name: "colTitle",  title: "Título de columna (ej: Contacto)", type: "string", initialValue: "Contacto" },
        { name: "name",      title: "Nombre (ej: CEDIS MONTERREY)",     type: "string" },
        { name: "address",   title: "Dirección",                        type: "string" },
        { name: "phone",     title: "Teléfono",                         type: "string" },
      ],
    }),
    defineField({ name: "footerCategoriesTitle", title: "Título columna Categorías", type: "string", initialValue: "Categorías" }),
    defineField({ name: "footerNavTitle",        title: "Título columna Menú",       type: "string", initialValue: "Menú" }),
    defineField({ name: "footerSocialTitle",     title: "Título columna Redes",      type: "string", initialValue: "Síguenos" }),
    defineField({
      name: "footerBranches",
      title: "Sucursales",
      type: "array",
      description: "Máximo 4 sucursales para el segundo renglón del footer",
      of: [
        {
          type: "object",
          fields: [
            { name: "name",    title: "Nombre de sucursal",    type: "string" },
            { name: "url",     title: "URL (clic en título)",  type: "string" },
            { name: "address", title: "Dirección",             type: "string" },
            { name: "phone",   title: "Teléfono",              type: "string" },
          ],
          preview: { select: { title: "name", subtitle: "phone" } },
        },
      ],
    }),
    defineField({ name: "footerCtaLabel",    title: "Texto del botón CTA (footer)", type: "string" }),
    defineField({ name: "footerCtaUrl",      title: "URL del botón CTA (footer)",   type: "string" }),
    defineField({ name: "footerCopyright",   title: "Texto de copyright",           type: "string" }),
  ],
  preview: { prepare: () => ({ title: "Footer" }) },
});
