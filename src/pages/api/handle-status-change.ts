import type { APIRoute } from "astro";
import { Resend } from "resend";

export const prerender = false;

const resendKey = import.meta.env.RESEND_API_KEY;
const webhookSecret = import.meta.env.SANITY_WEBHOOK_SECRET;

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

    const { customer, orderNumber, shippingInfo } = after;

    // 2. Lógica de notificación según el nuevo estado
    if (after.status === "shipped" && before.status !== "shipped") {
      await sendShippedEmail({
        to: customer.email,
        name: customer.name,
        orderNumber,
        shippingProvider: shippingInfo?.provider,
        trackingNumber: shippingInfo?.trackingNumber,
        trackingUrl: shippingInfo?.trackingUrl,
      });
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
  shippingProvider?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

async function sendShippedEmail(props: ShippedEmailProps) {
  const { to, name, orderNumber, shippingProvider, trackingNumber, trackingUrl } = props;
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
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#0284c7;padding:24px 32px;border-radius:12px 12px 0 0">
        <h1 style="margin:0;color:#fff;font-size:20px">🚚 ¡Tu pedido #${orderNumber} va en camino!</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:14px">La Bodega del Instalador</p>
      </div>
      <div style="background:#fff;padding:24px 32px;border:1px solid #e2e8f0;border-top:none">
        <p style="margin:0 0 20px;font-size:15px">Hola <strong>${name}</strong>, te confirmamos que tu pedido ha sido enviado.</p>
        ${trackingHtml}
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