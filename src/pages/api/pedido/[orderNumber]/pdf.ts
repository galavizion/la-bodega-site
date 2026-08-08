import type { APIRoute } from "astro";
import { createClient } from "@sanity/client";
import { buildOrderPdf } from "../../../../lib/orderPdf";

export const prerender = false;

const sanity = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? "a7b3q6z9",
  dataset:   import.meta.env.PUBLIC_SANITY_DATASET   ?? "production",
  apiVersion: "2025-01-01",
  token: import.meta.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

export const GET: APIRoute = async ({ params, url }) => {
  const orderNumber = params.orderNumber;
  if (!orderNumber) return new Response("Pedido no encontrado", { status: 404 });

  const token = url.searchParams.get("t") ?? "";

  const order = await sanity
    .fetch<any>(
      `*[_type=="order" && orderNumber==$num][0]{
        orderNumber, status, createdAt, confirmationToken, paymentMethod, mpPaymentId,
        deliveryMethod, notes, shippingInfo, "pickupBranchName": pickupBranch->name,
        customer, items[]{ variantLabel, quantity, unitPrice },
        subtotal, shipping, iva, total, cashbackApplied
      }`,
      { num: orderNumber }
    )
    .catch(() => null);

  if (!order) return new Response("Pedido no encontrado", { status: 404 });

  // Pedidos creados antes de este campo no tienen token — se dejan pasar
  // para no romper links viejos ya enviados por correo.
  if (order.confirmationToken && order.confirmationToken !== token) {
    return new Response("No autorizado", { status: 401 });
  }

  const pdf = buildOrderPdf(order);
  const bytes = pdf.output("arraybuffer");

  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="pedido-${orderNumber}.pdf"`,
    },
  });
};
