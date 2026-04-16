import type { APIRoute } from "astro";
import { createClient } from "@sanity/client";
import { Resend } from "resend";

export const prerender = false;

const sanity = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET,
  apiVersion: "2025-01-01",
  token: import.meta.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

const resend = new Resend(import.meta.env.RESEND_API_KEY);

const FORM_LABELS: Record<string, string> = {
  contact:    "Contacto general",
  quote:      "Solicitud de cotización",
  newsletter: "Suscripción",
};

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400 });
  }

  const { formType, page, ...fields } = body;

  const name    = String(fields.nombre    ?? fields.name    ?? "").trim();
  const email   = String(fields.correo    ?? fields.email   ?? "").trim();
  const phone   = String(fields.teléfono  ?? fields.telefono ?? fields.phone ?? "").trim();
  const message = String(fields.mensaje   ?? fields.message ?? "").trim();

  const data = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => ({ _type: "object" as const, _key: k, key: k, value: String(v) }));

  // ── 1. Guardar en Sanity ────────────────────────────────────────────────────
  try {
    await sanity.create({
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
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Error al guardar" }), { status: 500 });
  }

  // ── 2. Enviar email via Resend ──────────────────────────────────────────────
  const notifyEmail = import.meta.env.NOTIFY_EMAIL;
  if (import.meta.env.RESEND_API_KEY && notifyEmail) {
    const formLabel = FORM_LABELS[formType] ?? formType ?? "Formulario";

    // Tabla HTML con todos los campos
    const rows = data
      .map(({ key, value }) => `
        <tr>
          <td style="padding:8px 12px;font-weight:600;text-transform:capitalize;border-bottom:1px solid #f1f5f9;white-space:nowrap">${key}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${value}</td>
        </tr>`)
      .join("");

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#ef4444;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="margin:0;color:#fff;font-size:20px">📬 Nuevo ${formLabel}</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:14px">La Bodega del Instalador · ${page ?? "/"}</p>
        </div>
        <div style="background:#fff;padding:24px 32px;border:1px solid #e2e8f0;border-top:none">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            ${rows}
          </table>
        </div>
        <div style="background:#f8fafc;padding:16px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;font-size:12px;color:#94a3b8;text-align:center">
          Enviado el ${new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}
        </div>
      </div>`;

    await resend.emails.send({
      from: "La Bodega del Instalador <noreply@labodegadelinstalador.net>",
      to: notifyEmail,
      subject: `[La Bodega] ${formLabel}${name ? ` — ${name}` : ""}`,
      html,
      replyTo: email || undefined,
    }).catch(() => {
      // No bloqueamos la respuesta si el email falla
    });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
