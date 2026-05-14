import type { APIRoute } from "astro";
import { createClient } from "@sanity/client";
import { getSession } from "../../../lib/auth";

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
  const session = await getSession(request);
  if (!session) return json({ error: "No autorizado" }, 401);

  let body: Record<string, string>;
  try { body = await request.json(); } catch { return json({ error: "JSON inválido" }, 400); }

  const { name, phone, company, address, city, state, zip } = body;

  // Buscar si ya existe un perfil
  const existing = await sanity.fetch<{ _id: string } | null>(
    `*[_type == "customerProfile" && email == $email][0]{ _id }`,
    { email: session.email }
  ).catch(() => null);

  const data = {
    name:    String(name    ?? "").trim(),
    phone:   String(phone   ?? "").trim(),
    company: String(company ?? "").trim(),
    address: String(address ?? "").trim(),
    city:    String(city    ?? "").trim(),
    state:   String(state   ?? "").trim(),
    zip:     String(zip     ?? "").trim(),
  };

  if (existing) {
    await sanity.patch(existing._id).set(data).commit();
  } else {
    await sanity.create({ _type: "customerProfile", email: session.email, ...data });
  }

  return json({ ok: true });
};
