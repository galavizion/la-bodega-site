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

function orderNumber(): string {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const r = String(Math.floor(1000 + Math.random() * 9000));
  return `BOD-${d}-${r}`;
}

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }

  const { customer, items, paymentMethod, total, deliveryMethod, pickupBranchName, _hp_website, "cf-turnstile-response": tsToken } = body;

  // ── Honeypot ───────────────────────────────────────────────────────────────
  if (_hp_website) {
    return json({ success: true, orderId: "bot", orderNumber: "BOT-0000" });
  }

  // ── Turnstile (solo en producción) ────────────────────────────────────────
  const secretKey = import.meta.env.TURNSTILE_SECRET_KEY;
  if (secretKey && import.meta.env.PROD) {
    if (!tsToken) {
      return json({ error: "Verifica que no eres un robot." }, 400);
    }
    const fd = new FormData();
    fd.append("secret", secretKey);
    fd.append("response", String(tsToken));
    const check = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: fd });
    const result: any = await check.json().catch(() => ({}));
    if (!result.success) {
      return json({ error: "Verificación fallida. Intenta de nuevo." }, 400);
    }
  }

  if (!customer?.name?.trim() || !customer?.email?.trim() || !customer?.phone?.trim()) {
    return json({ error: "Nombre, email y teléfono son obligatorios" }, 400);
  }
  if (!Array.isArray(items) || items.length === 0) {
    return json({ error: "El carrito está vacío" }, 400);
  }

  // ── Resolver referencias por slug ───────────────────
  const slugs: string[] = items.map((it: any) => it.slug).filter(Boolean);
  const refs: Record<string, string> = {};
  if (slugs.length) {
    const found = await sanity.fetch<{ _id: string; slug: string }[]>(
      `*[_type=="catalogItem" && slug.current in $slugs]{ _id, "slug": slug.current }`,
      { slugs }
    ).catch(() => []);
    found.forEach((p) => { refs[p.slug] = p._id; });
  }

  const num = orderNumber();
  const now = new Date().toISOString();
  const calcTotal = Number(total ?? 0) ||
    items.reduce((acc: number, it: any) => acc + Number(it.price ?? 0) * Number(it.qty ?? 1), 0);

  const shopSettings = await sanity
    .fetch<{ shippingCost: number; freeShippingThreshold: number }>(
      `{ "shippingCost": coalesce(*[_type=="siteSettingsShop"][0].shippingCost, 0), "freeShippingThreshold": coalesce(*[_type=="siteSettingsShop"][0].freeShippingThreshold, 0) }`
    )
    .catch(() => ({ shippingCost: 0, freeShippingThreshold: 0 }));

  const isPickup   = deliveryMethod === "pickup";
  const hasBoxItem = Array.isArray(items) && items.some((it: any) => it.isBox === true);
  const shippingAmount =
    isPickup || hasBoxItem
      ? 0
      : shopSettings.freeShippingThreshold > 0 && calcTotal >= shopSettings.freeShippingThreshold
        ? 0
        : shopSettings.shippingCost;
  const grandTotal = calcTotal + shippingAmount;

  // ── Crear pedido en Sanity ───────────────────────────
  let created: { _id: string };
  try {
    created = await sanity.create({
      _type: "order",
      orderNumber: num,
      status: "pending",
      createdAt: now,
      paymentMethod:   paymentMethod ?? "transfer",
      deliveryMethod:  deliveryMethod ?? "shipping",
      ...(pickupBranchName ? { pickupBranch: String(pickupBranchName).trim() } : {}),
      customer: {
        name:    String(customer.name).trim(),
        company: String(customer.company ?? "").trim() || undefined,
        email:   String(customer.email).trim(),
        phone:   String(customer.phone).trim(),
        address: String(customer.address ?? "").trim(),
        city:    String(customer.city    ?? "").trim(),
        state:   String(customer.state   ?? "").trim(),
        zip:     String(customer.zip     ?? "").trim(),
      },
      items: items.map((it: any) => {
        const ref = refs[it.slug];
        return {
          _key: crypto.randomUUID(),
          ...(ref ? { product: { _type: "reference", _ref: ref } } : {}),
          variantLabel: String(it.title ?? ""),
          quantity:  Number(it.qty   ?? 1),
          unitPrice: Number(it.price ?? 0),
        };
      }),
      subtotal: calcTotal,
      shipping: shippingAmount,
      total:    grandTotal,
    });
  } catch (e: any) {
    return json({ error: e?.message ?? "Error al guardar el pedido" }, 500);
  }

  // ── Notificación por email ───────────────────────────
  const resendKey = import.meta.env.RESEND_API_KEY;
  const notifyFromSanity = await sanity
    .fetch<string[] | null>(`*[_type == "siteSettings"][0].orderNotifyEmails`)
    .catch(() => null);
  const envEmail = import.meta.env.NOTIFY_EMAIL;
  const notifyEmails: string[] = [
    ...(notifyFromSanity?.filter(Boolean) ?? []),
    ...(envEmail && !notifyFromSanity?.includes(envEmail) ? [envEmail] : []),
  ];
  if (resendKey && notifyEmails.length > 0) {
    const resend = new Resend(resendKey);
    const rows = items.map((it: any) => {
      const sub = Number(it.price ?? 0) * Number(it.qty ?? 1);
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${it.title}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center">${it.qty ?? 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right">$${sub.toLocaleString("es-MX")} MXN</td>
      </tr>`;
    }).join("");

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#0f8604;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="margin:0;color:#fff;font-size:20px">🛒 Nuevo pedido #${num}</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:14px">La Bodega del Instalador</p>
        </div>
        <div style="background:#fff;padding:24px 32px;border:1px solid #e2e8f0;border-top:none">
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
            <tr><td style="padding:6px 0;font-weight:600;width:140px">Pedido</td><td>#${num}</td></tr>
            <tr><td style="padding:6px 0;font-weight:600">Cliente</td><td>${customer.name}</td></tr>
            <tr><td style="padding:6px 0;font-weight:600">Email</td><td>${customer.email}</td></tr>
            <tr><td style="padding:6px 0;font-weight:600">Teléfono</td><td>${customer.phone}</td></tr>
            <tr><td style="padding:6px 0;font-weight:600">Pago</td><td>${paymentMethod === "transfer" ? "Transferencia / Depósito" : paymentMethod}</td></tr>
            <tr><td style="padding:6px 0;font-weight:600">Entrega</td><td>${deliveryMethod === "pickup" ? `Recoger en sucursal${pickupBranchName ? `: ${pickupBranchName}` : ""}` : "Envío a domicilio"}</td></tr>
          </table>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead>
              <tr style="background:#f8fafc">
                <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;opacity:.6">Producto</th>
                <th style="padding:8px 12px;text-align:center;font-size:11px;text-transform:uppercase;opacity:.6">Cant.</th>
                <th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;opacity:.6">Subtotal</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding:6px 12px">Envío</td>
                <td style="padding:6px 12px;text-align:right">${shippingAmount === 0 ? "Gratis" : `$${shippingAmount.toLocaleString("es-MX")} MXN`}</td>
              </tr>
              <tr style="background:#f8fafc">
                <td colspan="2" style="padding:10px 12px;font-weight:700">TOTAL</td>
                <td style="padding:10px 12px;font-weight:700;text-align:right">$${grandTotal.toLocaleString("es-MX")} MXN</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div style="background:#f8fafc;padding:12px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;font-size:12px;color:#94a3b8;text-align:center">
          ${new Date(now).toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}
        </div>
      </div>`;

    await resend.emails.send({
      from: "La Bodega del Instalador <noreply@labodegadelinstalador.net>",
      to: notifyEmails,
      subject: `[Pedido] #${num} — ${customer.name} · $${grandTotal.toLocaleString("es-MX")} MXN`,
      html,
      replyTo: customer.email || undefined,
    }).catch(() => {});
  }

  return json({ success: true, orderId: created._id, orderNumber: num, shipping: shippingAmount, total: grandTotal });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
