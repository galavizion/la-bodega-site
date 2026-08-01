import type { APIRoute } from "astro";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createClient } from "@sanity/client";

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
  if (!accessToken) {
    return json({ error: "MercadoPago no configurado" }, 500);
  }

  const catalogOnlyMode = await sanity
    .fetch<boolean>(`coalesce(*[_type=="siteSettingsShop"][0].catalogOnlyMode, false)`)
    .catch(() => false);
  if (catalogOnlyMode) {
    return json({ error: "La tienda está en modo catálogo. Las compras están deshabilitadas." }, 403);
  }

  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }

  const { orderNumber, mpSandbox } = body;
  if (!orderNumber) {
    return json({ error: "Datos incompletos" }, 400);
  }

  // ── Obtener total desde Sanity (precio calculado en servidor) ──
  const order = await sanity
    .fetch<{ total: number; subtotal: number; confirmationToken?: string } | null>(
      `*[_type=="order" && orderNumber==$num][0]{ total, subtotal, confirmationToken }`,
      { num: orderNumber }
    )
    .catch(() => null);

  if (!order) return json({ error: "Pedido no encontrado" }, 404);

  const orderTotal = Math.ceil(order.total ?? order.subtotal ?? 0);
  if (orderTotal <= 0) return json({ error: "Total de pedido inválido" }, 400);

  // Siempre el dominio real del sitio — nunca uno que mande el cliente,
  // ya que se usa para el webhook de confirmación de pago (notification_url).
  const base = "https://www.labodegadelinstalador.net";

  try {
    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: orderNumber,
            title: `Pedido #${orderNumber} — La Bodega del Instalador`,
            quantity: 1,
            unit_price: orderTotal,
            currency_id: "MXN",
          },
        ],
        external_reference: orderNumber,
        back_urls: {
          success: `${base}/confirmacion/${orderNumber}/?t=${order.confirmationToken ?? ""}`,
          pending: `${base}/confirmacion/${orderNumber}/?t=${order.confirmationToken ?? ""}`,
          failure: `${base}/checkout/`,
        },
        auto_return: "approved",
        notification_url: `${base}/api/mp-webhook`,
        statement_descriptor: "La Bodega del Instalador",
      },
    });

    const tokenIsSandbox = accessToken.startsWith("TEST-");
    const useSandbox = mpSandbox === true || tokenIsSandbox;
    return json({
      preferenceId: result.id,
      initPoint:    result.init_point,
      sandboxPoint: result.sandbox_init_point,
      useSandbox,
    });
  } catch (e: any) {
    const msg = e?.cause?.message ?? e?.message ?? "Error al crear preferencia";
    return json({ error: msg, detail: String(e) }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
