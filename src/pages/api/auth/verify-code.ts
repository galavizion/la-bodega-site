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

  // Buscar código válido
  const match = await sanity.fetch<{ _id: string; expiresAt: string } | null>(
    `*[_type == "authCode" && email == $email && code == $code && used != true][0]{ _id, expiresAt }`,
    { email, code }
  ).catch(() => null);

  if (!match) return json({ error: "Código incorrecto o expirado." }, 400);
  if (new Date(match.expiresAt) < new Date()) return json({ error: "El código ha expirado." }, 400);

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
