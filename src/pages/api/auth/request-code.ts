import type { APIRoute } from "astro";
import { createClient } from "@sanity/client";
import { Resend } from "resend";

export const prerender = false;

const sanity = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? "a7b3q6z9",
  dataset:   import.meta.env.PUBLIC_SANITY_DATASET   ?? "production",
  apiVersion: "2025-01-01",
  token: import.meta.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

export const POST: APIRoute = async ({ request }) => {
  let body: { email?: string };
  try { body = await request.json(); } catch { return json({ error: "JSON inválido" }, 400); }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) return json({ error: "Email inválido" }, 400);

  // No permitir pedir otro código antes de 30s (evita spam al correo del usuario)
  const lastCode = await sanity.fetch<{ _createdAt: string } | null>(
    `*[_type == "authCode" && email == $email] | order(_createdAt desc)[0]{ _createdAt }`,
    { email }
  ).catch(() => null);
  if (lastCode && Date.now() - new Date(lastCode._createdAt).getTime() < 30_000) {
    return json({ error: "Espera unos segundos antes de solicitar otro código." }, 429);
  }

  // Generar código de 6 dígitos, válido 15 minutos
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Invalidar códigos anteriores del mismo email
  const old = await sanity.fetch<{ _id: string }[]>(
    `*[_type == "authCode" && email == $email && used != true]{ _id }`,
    { email }
  ).catch(() => []);
  if (old.length) {
    const tx = sanity.transaction();
    old.forEach((d) => tx.patch(d._id, { set: { used: true } }));
    await tx.commit().catch(() => {});
  }

  // Crear nuevo código
  await sanity.create({ _type: "authCode", email, code, expiresAt, used: false });

  // Enviar email
  const resendKey = import.meta.env.RESEND_API_KEY;
  if (resendKey) {
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: "La Bodega del Instalador <noreply@labodegadelinstalador.net>",
      to: email,
      subject: `Tu código de acceso: ${code}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h1 style="font-size:22px;margin:0 0 8px">🔐 Tu código de acceso</h1>
          <p style="color:#6b7280;margin:0 0 28px">La Bodega del Instalador</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:28px;text-align:center;margin-bottom:24px">
            <p style="font-size:13px;color:#6b7280;margin:0 0 12px;text-transform:uppercase;letter-spacing:.08em">Código de verificación</p>
            <p style="font-size:48px;font-weight:900;letter-spacing:.18em;margin:0;color:#111">${code}</p>
            <p style="font-size:12px;color:#9ca3af;margin:16px 0 0">Válido por 15 minutos</p>
          </div>
          <p style="font-size:13px;color:#9ca3af;text-align:center">Si no solicitaste este código, puedes ignorar este correo.</p>
        </div>`,
    }).catch(() => {});
  }

  return json({ ok: true });
};
