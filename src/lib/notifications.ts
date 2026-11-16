import type { SanityClient } from "@sanity/client";

/**
 * Registra en la bitácora del pedido (order.notificationsSent) que se mandó
 * un correo. No lanza si falla — un error aquí nunca debe tumbar el envío
 * del correo en sí.
 */
export async function logNotification(
  sanity: SanityClient,
  orderId: string,
  type: string,
  to: string
): Promise<void> {
  await sanity
    .patch(orderId)
    .setIfMissing({ notificationsSent: [] })
    .append("notificationsSent", [
      { _key: crypto.randomUUID(), type, to, sentAt: new Date().toISOString() },
    ])
    .commit()
    .catch((e) => console.error("Error al registrar notificación en bitácora:", e));
}

/**
 * Envía un mensaje de alerta por Telegram.
 * Requiere TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID en las variables de entorno.
 * No lanza — un fallo aquí nunca debe tumbar el flujo principal.
 */
export async function alertTelegram(message: string): Promise<void> {
  const token = import.meta.env.TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    }),
  }).catch((e) => console.error("Error al enviar alerta por Telegram:", e));
}
