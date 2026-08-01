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
