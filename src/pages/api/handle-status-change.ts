import type { APIRoute } from "astro";
import { Resend } from "resend";
import { createClient } from "@sanity/client";
import { logNotification } from "../../lib/notifications";

export const prerender = false;

const resendKey = import.meta.env.RESEND_API_KEY;
const webhookSecret = import.meta.env.SANITY_WEBHOOK_SECRET;

const sanity = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? "a7b3q6z9",
  dataset:   import.meta.env.PUBLIC_SANITY_DATASET   ?? "production",
  apiVersion: "2025-01-01",
  token: import.meta.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

/**
 * Este endpoint es llamado por un Webhook de Sanity cada vez que un pedido se actualiza.
 * Su función es notificar al cliente sobre cambios de estado importantes.
 */
export const POST: APIRoute = async ({ request }) => {
  // 1. Seguridad: Validar que la petición viene de Sanity
  if (webhookSecret && request.headers.get("Authorization") !== `Bearer ${webhookSecret}`) {
    return new Response("No autorizado", { status: 401 });
  }

  if (!resendKey) {
    console.warn("RESEND_API_KEY no configurada. No se enviarán correos.");
    return new Response("OK", { status: 200 });
  }

  try {
    const payload = await request.json();
    const before = payload.before; // Estado del documento ANTES del cambio
    const after = payload.after;   // Estado del documento DESPUÉS del cambio

    // Si no hay cambio de estado, no hacemos nada
    if (!before || !after || before.status === after.status) {
      return new Response("Sin cambios de estado", { status: 200 });
    }

    const { customer, orderNumber, confirmationToken, shippingInfo, items, subtotal, shipping, iva, total } = after;

    // 2. Lógica de notificación según el nuevo estado
    if (after.status === "confirmed" && before.status !== "confirmed") {
      // Solo para confirmaciones manuales (Studio) — MercadoPago ya manda su
      // propio correo de confirmación desde /api/mp-webhook al aprobar el pago.
      if (after.paymentMethod !== "mercadopago") {
        await sendConfirmedEmail({
          to: customer.email,
          name: customer.name,
          orderNumber,
          confirmationToken,
          items,
          subtotal,
          shipping,
          iva,
          total,
        });
        await logNotification(sanity, after._id, "confirmed", customer.email);
      }
    } else if (after.status === "shipped" && before.status !== "shipped") {
      await sendShippedEmail({
        to: customer.email,
        name: customer.name,
        orderNumber,
        confirmationToken,
        shippingProvider: shippingInfo?.provider,
        trackingNumber: shippingInfo?.trackingNumber,
        trackingUrl: shippingInfo?.trackingUrl,
      });
      await logNotification(sanity, after._id, "shipped", customer.email);
    } else if (after.status === "delivered" && before.status !== "delivered") {
      // Opcional: Podrías enviar un correo de "Pedido Entregado"
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error procesando webhook de Sanity:", error);
    return new Response("Error interno", { status: 500 });
  }
};


interface ShippedEmailProps {
  to: string;
  name: string;
  orderNumber: string;
  confirmationToken?: string;
  shippingProvider?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

async function sendShippedEmail(props: ShippedEmailProps) {
  const { to, name, orderNumber, confirmationToken, shippingProvider, trackingNumber, trackingUrl } = props;
  const pdfLink = `https://www.labodegadelinstalador.net/api/pedido/${orderNumber}/pdf?t=${confirmationToken ?? ""}`;
  const resend = new Resend(resendKey);

  let trackingHtml = "";
  if (shippingProvider && trackingNumber) {
    const link = trackingUrl ? `<a href="${trackingUrl}" style="color:#166534;font-weight:700">Rastrear paquete</a>` : "Visita el sitio de la paquetería.";
    trackingHtml = `
      <div style="margin-top:24px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;">
        <p style="margin:0 0 8px;font-weight:700;color:#166534">Información de envío:</p>
        <p style="margin:0 0 4px;font-size:14px;color:#166534"><strong>Paquetería:</strong> ${shippingProvider}</p>
        <p style="margin:0 0 12px;font-size:14px;color:#166534"><strong>Número de guía:</strong> ${trackingNumber}</p>
        <p style="margin:0;font-size:14px;color:#166534">${link}</p>
      </div>`;
  }

  const clientHtml = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#111827">
      <div style="background:#111827;padding:24px 32px;border-radius:12px 12px 0 0">
        <h1 style="margin:0;color:#FFD700;font-size:20px">🚚 ¡Tu pedido #${orderNumber} va en camino!</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,.75);font-size:14px">La Bodega del Instalador</p>
      </div>
      <div style="background:#fff;padding:24px 32px;border:1px solid #e2e8f0;border-top:none">
        <p style="margin:0 0 20px;font-size:15px">Hola <strong>${name}</strong>, te confirmamos que tu pedido ha sido enviado.</p>
        ${trackingHtml}
        <div style="margin-top:24px;text-align:center">
          <a href="${pdfLink}" style="display:inline-block;color:#111827;text-decoration:underline;font-size:14px;font-weight:600">
            Descargar PDF del pedido
          </a>
        </div>
      </div>
      <div style="background:#f8fafc;padding:12px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;font-size:12px;color:#94a3b8;text-align:center">
        Gracias por tu compra.
      </div>
    </div>`;

  await resend.emails.send({
    from: "La Bodega del Instalador <noreply@labodegadelinstalador.net>",
    to: [to],
    subject: `Tu pedido #${orderNumber} ha sido enviado`,
    html: clientHtml,
  }).catch(console.error);
}

interface ConfirmedEmailProps {
  to: string;
  name: string;
  orderNumber: string;
  confirmationToken?: string;
  items?: { variantLabel?: string; quantity?: number; unitPrice?: number; product?: { title?: string } }[];
  subtotal?: number;
  shipping?: number;
  iva?: number;
  total?: number;
}

async function sendConfirmedEmail(props: ConfirmedEmailProps) {
  const { to, name, orderNumber, confirmationToken, items, subtotal, shipping, iva, total } = props;
  const pdfLink = `https://www.labodegadelinstalador.net/api/pedido/${orderNumber}/pdf?t=${confirmationToken ?? ""}`;
  const resend = new Resend(resendKey);
  const fmt = (n: number) => `$${Math.ceil(n).toLocaleString("es-MX")} MXN`;

  const itemsTable = Array.isArray(items) && items.length ? `
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px">
      <thead><tr style="background:#f8fafc">
        <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;opacity:.6">Producto</th>
        <th style="padding:8px 12px;text-align:center;font-size:11px;text-transform:uppercase;opacity:.6">Cant.</th>
        <th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;opacity:.6">Subtotal</th>
      </tr></thead>
      <tbody>
        ${items.map((it) => `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${it.product?.title ?? it.variantLabel ?? "Producto"}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center">${it.quantity ?? 1}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right">${fmt(Math.ceil(Number(it.unitPrice ?? 0)) * Number(it.quantity ?? 1))}</td>
        </tr>`).join("")}
      </tbody>
      <tfoot>
        ${subtotal != null ? `<tr>
          <td colspan="2" style="padding:6px 12px">Subtotal</td>
          <td style="padding:6px 12px;text-align:right">${fmt(subtotal)}</td>
        </tr>` : ""}
        ${shipping != null ? `<tr>
          <td colspan="2" style="padding:6px 12px">Envío</td>
          <td style="padding:6px 12px;text-align:right">${shipping === 0 ? "Gratis" : fmt(shipping)}</td>
        </tr>` : ""}
        ${iva ? `<tr>
          <td colspan="2" style="padding:6px 12px">IVA</td>
          <td style="padding:6px 12px;text-align:right">${fmt(iva)}</td>
        </tr>` : ""}
        ${total != null ? `<tr style="background:#f8fafc">
          <td colspan="2" style="padding:10px 12px;font-weight:700">TOTAL</td>
          <td style="padding:10px 12px;font-weight:700;text-align:right">${fmt(total)}</td>
        </tr>` : ""}
      </tfoot>
    </table>` : "";

  const clientHtml = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#111827">
      <div style="background:#111827;padding:24px 32px;border-radius:12px 12px 0 0">
        <h1 style="margin:0;color:#FFD700;font-size:20px">✅ ¡Pedido confirmado! #${orderNumber}</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,.75);font-size:14px">La Bodega del Instalador</p>
      </div>
      <div style="background:#fff;padding:24px 32px;border:1px solid #e2e8f0;border-top:none">
        <p style="margin:0 0 8px;font-size:15px">Hola <strong>${name}</strong>, confirmamos tu pedido #${orderNumber}. Ya lo estamos preparando.</p>
        ${itemsTable}
        <div style="margin-top:24px;text-align:center">
          <a href="${pdfLink}" style="display:inline-block;color:#111827;text-decoration:underline;font-size:14px;font-weight:600">
            Descargar PDF del pedido
          </a>
        </div>
      </div>
      <div style="background:#f8fafc;padding:12px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;font-size:12px;color:#94a3b8;text-align:center">
        Gracias por tu compra.
      </div>
    </div>`;

  await resend.emails.send({
    from: "La Bodega del Instalador <noreply@labodegadelinstalador.net>",
    to: [to],
    subject: `¡Pedido confirmado! #${orderNumber} — La Bodega del Instalador`,
    html: clientHtml,
  }).catch(console.error);
}