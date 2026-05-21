import type { APIRoute } from "astro";
import MercadoPago, { Preference } from "mercadopago";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const accessToken = import.meta.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return json({ error: "MercadoPago no configurado" }, 500);
  }

  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }

  const { items, orderNumber, siteUrl } = body;
  if (!Array.isArray(items) || !items.length || !orderNumber) {
    return json({ error: "Datos incompletos" }, 400);
  }

  const base = siteUrl ?? "https://www.labodegadelinstalador.net";

  try {
    const client = new MercadoPago({ accessToken });
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: items.map((it: any) => ({
          id:         it.slug ?? it.title,
          title:      String(it.title ?? "Producto"),
          quantity:   Number(it.qty ?? 1),
          unit_price: Math.round(Number(it.price ?? 0) * 100) / 100,
          currency_id: "MXN",
        })),
        external_reference: orderNumber,
        back_urls: {
          success: `${base}/confirmacion/${orderNumber}/`,
          pending: `${base}/confirmacion/${orderNumber}/`,
          failure: `${base}/checkout/`,
        },
        auto_return: "approved",
        statement_descriptor: "La Bodega del Instalador",
      },
    });

    return json({
      preferenceId: result.id,
      initPoint:    result.init_point,
      sandboxPoint: result.sandbox_init_point,
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
