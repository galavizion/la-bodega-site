import { defineField, defineType } from "sanity";

export const authCode = defineType({
  name: "authCode",
  title: "Código de acceso",
  type: "document",
  fields: [
    defineField({ name: "email",     type: "string",   title: "Email" }),
    defineField({ name: "code",      type: "string",   title: "Código" }),
    defineField({ name: "expiresAt", type: "string",   title: "Expira" }),
    defineField({ name: "used",      type: "boolean",  title: "Usado", initialValue: false }),
    defineField({ name: "attempts",  type: "number",   title: "Intentos fallidos", initialValue: 0 }),
  ],
});
