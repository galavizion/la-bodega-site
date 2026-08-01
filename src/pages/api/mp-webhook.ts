import type { APIRoute } from "astro";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@sanity/client";
import { Resend } from "resend";
import { logNotification } from "../../lib/notifications";

export const prerender = false;

const sanity = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? "a7b3q6z9",
  dataset:   import.meta.env.PUBLIC_SANITY_DATASET   ?? "production",
  apiVersion: "2025-01-01",
  token: import.meta.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

export const POST: APIRoute = async ({ request }) => {
  const accessToken = import.meta.env.MP_ACCESS_TOKEN;
  if (!accessToken) return ok();

  let body: any;
  try { body = await request.json(); } catch { return ok(); }

  if (body?.type !== "payment" || !body?.data?.id) return ok();

  try {
    const client  = new MercadoPagoConfig({ accessToken });
    const payment = await new Payment(client).get({ id: String(body.data.id) });

    const orderNumber = payment.external_reference;
    if (!orderNumber) return ok();

    const order = await sanity.fetch<any>(
      `*[_type=="order" && orderNumber==$num][0]{
        _id, status, createdAt, paymentMethod, deliveryMethod, "pickupBranchName": pickupBranch->name,
        customer, items[]{ variantLabel, quantity, unitPrice },
        subtotal, shipping, iva, total
      }`,
      { num: orderNumber }
    ).catch(() => null);

    if (!order) return ok();

    if (payment.status === "approved") {
      await sanity.patch(order._id)
        .set({ status: "confirmed", mpPaymentId: String(body.data.id) })
        .commit();
      await sendConfirmationEmails(order, orderNumber);
    } else if (["rejected", "cancelled"].includes(payment.status ?? "")) {
      await sanity.patch(order._id).set({ status: "cancelled" }).commit();
    }
  } catch (e: any) {
    console.error("Error procesando webhook de MercadoPago:", e?.message ?? String(e));
    // Siempre respondemos 200 para que MP no reintente indefinidamente, pero ahora el error queda registrado.
  }

  return ok();
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function ok() {
  return new Response("ok", { status: 200 });
}

const fmt = (n: number) => `$${Math.ceil(n).toLocaleString("es-MX")} MXN`;

function buildItemsTable(items: any[], shipping: number, total: number, iva: number = 0) {
  const rows = items.map((it: any) => {
    const sub = Math.ceil(Number(it.unitPrice ?? 0)) * Number(it.quantity ?? 1);
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${it.variantLabel}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center">${it.quantity ?? 1}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right">${fmt(sub)}</td>
    </tr>`;
  }).join("");

  return `<table style="width:100%;border-collapse:collapse;font-size:14px">
    <thead><tr style="background:#f8fafc">
      <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;opacity:.6">Producto</th>
      <th style="padding:8px 12px;text-align:center;font-size:11px;text-transform:uppercase;opacity:.6">Cant.</th>
      <th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;opacity:.6">Subtotal</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="padding:6px 12px">Envío</td>
        <td style="padding:6px 12px;text-align:right">${shipping === 0 ? "Gratis" : fmt(shipping)}</td>
      </tr>
      ${iva > 0 ? `<tr>
        <td colspan="2" style="padding:6px 12px">IVA</td>
        <td style="padding:6px 12px;text-align:right">${fmt(iva)}</td>
      </tr>` : ""}
      <tr style="background:#f8fafc">
        <td colspan="2" style="padding:10px 12px;font-weight:700">TOTAL</td>
        <td style="padding:10px 12px;font-weight:700;text-align:right">${fmt(total)}</td>
      </tr>
    </tfoot>
  </table>`;
}

async function sendConfirmationEmails(order: any, orderNumber: string) {
  const resendKey = import.meta.env.RESEND_API_KEY;
  if (!resendKey) return;

  const resend = new Resend(resendKey);
  const { customer, items, shipping, iva, total, deliveryMethod, pickupBranchName } = order;
  const now = new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" });

  const [notifyFromSanity, siteSettings] = await Promise.all([
    sanity.fetch<string[] | null>(`coalesce(*[_type=="siteSettingsGeneral"][0].orderNotifyEmails, *[_type=="siteSettings"][0].orderNotifyEmails)`).catch(() => null),
    sanity.fetch<{ whatsapp?: string }>(`coalesce(*[_type=="siteSettingsGeneral"][0], *[_type=="siteSettings"][0]){ "whatsapp": organization.whatsapp }`).catch(() => ({ whatsapp: undefined })),
  ]);

  const envEmail = import.meta.env.NOTIFY_EMAIL;
  const notifyEmails: string[] = [
    ...(notifyFromSanity?.filter(Boolean) ?? []),
    ...(envEmail && !notifyFromSanity?.includes(envEmail) ? [envEmail] : []),
  ];

  const waPhone        = (siteSettings?.whatsapp ?? "528121087053").replace(/\D/g, "");
  const customerWaPhone = String(customer.phone ?? "").replace(/\D/g, "");
  const waMsg  = encodeURIComponent(`Hola ${customer.name}, te contactamos de La Bodega del Instalador sobre tu pedido #${orderNumber} por ${fmt(total)}.`);
  const waLink = `https://wa.me/${customerWaPhone}?text=${waMsg}`;
  const itemsTable = buildItemsTable(items, shipping, total, iva);

  const entrega = deliveryMethod === "pickup"
    ? `Recoger en sucursal${pickupBranchName ? `: ${pickupBranchName}` : ""}`
    : "Envío a domicilio";

  // ── Correo al admin ──────────────────────────────────
  if (notifyEmails.length > 0) {
    const adminHtml = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#111827">
        <div style="background:#111827;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="margin:0;color:#FFD700;font-size:20px">💳 Pago confirmado — #${orderNumber}</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,.75);font-size:14px">La Bodega del Instalador</p>
        </div>
        <div style="background:#fff;padding:24px 32px;border:1px solid #e2e8f0;border-top:none">
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;color:#111827">
            <tr><td style="padding:6px 0;font-weight:600;width:140px">Pedido</td><td>#${orderNumber}</td></tr>
            <tr><td style="padding:6px 0;font-weight:600">Cliente</td><td>${customer.name}</td></tr>
            <tr><td style="padding:6px 0;font-weight:600">Email</td><td>${customer.email}</td></tr>
            <tr><td style="padding:6px 0;font-weight:600">Teléfono</td><td>${customer.phone}</td></tr>
            <tr><td style="padding:6px 0;font-weight:600">Pago</td><td>MercadoPago ✅</td></tr>
            <tr><td style="padding:6px 0;font-weight:600">Entrega</td><td>${entrega}</td></tr>
          </table>
          ${itemsTable}
          ${customerWaPhone ? `<div style="margin-top:24px;text-align:center">
            <a href="${waLink}" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600">
              💬 Contactar por WhatsApp
            </a>
          </div>` : ""}
        </div>
        <div style="background:#f8fafc;padding:12px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;font-size:12px;color:#94a3b8;text-align:center">${now}</div>
      </div>`;

    await resend.emails.send({
      from: "La Bodega del Instalador <noreply@labodegadelinstalador.net>",
      to: notifyEmails,
      subject: `[Pedido confirmado] #${orderNumber} — ${customer.name} · ${fmt(total)}`,
      html: adminHtml,
      replyTo: customer.email || undefined,
    }).catch(console.error);
    await logNotification(sanity, order._id, "admin_payment_confirmed", notifyEmails.join(", "));
  }

  // ── Correo al cliente ────────────────────────────────
  const clientHtml = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#111827">
      <div style="background:#111827;padding:24px 32px;border-radius:12px 12px 0 0">
        <h1 style="margin:0;color:#FFD700;font-size:20px">¡Pago recibido! Pedido #${orderNumber}</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,.75);font-size:14px">La Bodega del Instalador</p>
      </div>
      <div style="background:#fff;padding:24px 32px;border:1px solid #e2e8f0;border-top:none">
        <p style="margin:0 0 20px;font-size:15px">Hola <strong>${customer.name}</strong>, confirmamos que recibimos tu pago. En breve procesaremos tu pedido.</p>
        ${itemsTable}
        <div style="margin-top:24px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;">
          <p style="margin:0;font-size:14px;color:#166534">
            ¿Tienes dudas? Escríbenos al
            <a href="https://wa.me/${waPhone}" style="color:#166534;font-weight:700">+${waPhone}</a>
          </p>
        </div>
      </div>
      <div style="background:#f8fafc;padding:12px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;font-size:12px;color:#94a3b8;text-align:center">${now}</div>
    </div>`;

  await resend.emails.send({
    from: "La Bodega del Instalador <noreply@labodegadelinstalador.net>",
    to: [customer.email],
    subject: `¡Pago confirmado! Pedido #${orderNumber} — La Bodega del Instalador`,
    html: clientHtml,
  }).catch(console.error);
  await logNotification(sanity, order._id, "payment_confirmed", customer.email);
}
