import type { APIRoute } from "astro";
import { createClient } from "@sanity/client";

export const prerender = false;

const sanity = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? "a7b3q6z9",
  dataset:   import.meta.env.PUBLIC_SANITY_DATASET   ?? "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

type CouponRow = {
  percent: number;
  active: boolean;
  validFrom?: string;
  validUntil?: string;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount?: number;
};

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return json({ valid: false, error: "JSON inválido" }, 400);
  }

  const code = String(body.code ?? "").trim().toUpperCase();
  const subtotal = Number(body.subtotal ?? 0);

  if (!code) {
    return json({ valid: false, error: "Escribe un código de cupón" }, 400);
  }

  const row = await sanity
    .fetch<CouponRow | null>(
      `*[_type=="coupon" && upper(code)==$code][0]{ percent, active, validFrom, validUntil, minOrderAmount, maxUses, usedCount }`,
      { code }
    )
    .catch(() => null);

  if (!row) {
    return json({ valid: false, error: "Cupón no encontrado" }, 404);
  }
  if (row.active === false) {
    return json({ valid: false, error: "Este cupón ya no está activo" }, 400);
  }
  const now = Date.now();
  if (row.validFrom && now < new Date(row.validFrom).getTime()) {
    return json({ valid: false, error: "Este cupón todavía no está vigente" }, 400);
  }
  if (row.validUntil && now > new Date(row.validUntil).getTime()) {
    return json({ valid: false, error: "Este cupón ya expiró" }, 400);
  }
  if (row.maxUses != null && (row.usedCount ?? 0) >= row.maxUses) {
    return json({ valid: false, error: "Este cupón ya alcanzó su límite de usos" }, 400);
  }
  if (row.minOrderAmount != null && subtotal < row.minOrderAmount) {
    return json({ valid: false, error: `Compra mínima de $${row.minOrderAmount.toLocaleString("es-MX")} MXN para usar este cupón` }, 400);
  }

  const percent = row.percent ?? 0;
  const discount = Math.min(Math.ceil((subtotal * percent) / 100), subtotal);

  return json({ valid: true, code, percent, discount });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
