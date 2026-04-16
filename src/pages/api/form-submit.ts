import type { APIRoute } from "astro";
import { createClient } from "@sanity/client";

export const prerender = false;

const client = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET,
  apiVersion: "2025-01-01",
  token: import.meta.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400 });
  }

  const { formType, page, ...fields } = body;

  // Extraer campos comunes
  const name    = String(fields.nombre   ?? fields.name    ?? "").trim();
  const email   = String(fields.correo   ?? fields.email   ?? "").trim();
  const phone   = String(fields.teléfono ?? fields.telefono ?? fields.phone ?? "").trim();
  const message = String(fields.mensaje  ?? fields.message ?? "").trim();

  // Construir array de datos completos
  const data = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => ({ _type: "object" as const, _key: k, key: k, value: String(v) }));

  try {
    await client.create({
      _type: "formSubmission",
      formType: formType ?? "contact",
      name,
      email,
      phone,
      message,
      data,
      page: page ?? "",
      submittedAt: new Date().toISOString(),
      status: "new",
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Error al guardar" }), { status: 500 });
  }
};
