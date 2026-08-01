import type { APIRoute } from "astro";
import { createClient } from "@sanity/client";
import { signToken, makeSessionCookie } from "../../../lib/auth";

export const prerender = false;

const sanity = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? "a7b3q6z9",
  dataset:   import.meta.env.PUBLIC_SANITY_DATASET   ?? "production",
  apiVersion: "2025-01-01",
  token: import.meta.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let body: { email?: string; code?: string };
  try { body = await request.json(); } catch { return json({ error: "JSON inválido" }, 400); }

  const email = String(body.email ?? "").trim().toLowerCase();
  const code  = String(body.code  ?? "").trim();

  if (!email || !code) return json({ error: "Email y código requeridos" }, 400);

  const MAX_ATTEMPTS = 5;

  // Buscar el código activo más reciente para este email (sin importar si el
  // dígito enviado coincide, para poder contar intentos fallidos contra él).
  const active = await sanity.fetch<{ _id: string; code: string; expiresAt: string; attempts?: number } | null>(
    `*[_type == "authCode" && email == $email && used != true] | order(_createdAt desc)[0]{ _id, code, expiresAt, attempts }`,
    { email }
  ).catch(() => null);

  if (!active) return json({ error: "Código incorrecto o expirado." }, 400);

  if (new Date(active.expiresAt) < new Date()) {
    await sanity.patch(active._id).set({ used: true }).commit().catch(() => {});
    return json({ error: "El código ha expirado. Solicita uno nuevo." }, 400);
  }

  if ((active.attempts ?? 0) >= MAX_ATTEMPTS) {
    await sanity.patch(active._id).set({ used: true }).commit().catch(() => {});
    return json({ error: "Demasiados intentos incorrectos. Solicita un nuevo código." }, 429);
  }

  if (active.code !== code) {
    await sanity.patch(active._id).set({ attempts: (active.attempts ?? 0) + 1 }).commit().catch(() => {});
    const remaining = MAX_ATTEMPTS - ((active.attempts ?? 0) + 1);
    return json({
      error: remaining > 0
        ? `Código incorrecto. Te quedan ${remaining} intento${remaining === 1 ? "" : "s"}.`
        : "Demasiados intentos incorrectos. Solicita un nuevo código.",
    }, 400);
  }

  const match = active;

  // Marcar como usado
  await sanity.patch(match._id).set({ used: true }).commit().catch(() => {});

  // Buscar nombre del cliente en su último pedido
  const lastOrder = await sanity.fetch<{ name?: string } | null>(
    `*[_type == "order" && customer.email == $email] | order(createdAt desc)[0]{ "name": customer.name }`,
    { email }
  ).catch(() => null);

  const token = await signToken({ email, name: lastOrder?.name ?? "" });
  const cookie = makeSessionCookie(token);

  return json({ ok: true }, 200, { "Set-Cookie": cookie });
};
