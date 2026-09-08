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

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let body: { email?: string; "cf-turnstile-response"?: string };
  try { body = await request.json(); } catch { return json({ error: "JSON inválido" }, 400); }

  // ── Turnstile ──────────────────────────────────────────────────────────────
  const secretKey = import.meta.env.TURNSTILE_SECRET_KEY;
  if (secretKey) {
    const token = String(body["cf-turnstile-response"] ?? "");
    if (!token) return json({ error: "Verifica que no eres un robot." }, 400);
    const fd = new FormData();
    fd.append("secret", secretKey);
    fd.append("response", token);
    const check = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: fd });
    const result: any = await check.json().catch(() => ({}));
    if (!result.success) return json({ error: "Verificación fallida. Intenta de nuevo." }, 400);
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) return json({ error: "Email inválido" }, 400);

  let ip = "";
  try { ip = clientAddress ?? ""; } catch { ip = ""; }
  if (!ip) ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";

  // No permitir más de 5 códigos por IP en 10 minutos (evita usar el endpoint como relay de correo)
  if (ip) {
    const recentFromIp = await sanity.fetch<number>(
      `count(*[_type == "authCode" && ip == $ip && dateTime(_createdAt) > dateTime(now()) - 600])`,
      { ip }
    ).catch(() => 0);
    if (recentFromIp >= 5) {
      return json({ error: "Demasiadas solicitudes. Intenta de nuevo más tarde." }, 429);
    }
  }

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
  await sanity.create({ _type: "authCode", email, ip, code, expiresAt, used: false });

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
