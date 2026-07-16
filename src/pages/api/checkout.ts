import type { APIRoute } from "astro";
import { createClient } from "@sanity/client";
import { Resend } from "resend";
import { resolveMarkup } from "../../lib/pricing";

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

  const { customer, items, paymentMethod, total, deliveryMethod, pickupBranchId, pickupBranchName, _hp_website, "cf-turnstile-response": tsToken } = body;

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

  const catalogOnlyMode = await sanity
    .fetch<boolean>(`coalesce(*[_type=="siteSettingsShop"][0].catalogOnlyMode, false)`)
    .catch(() => false);
  if (catalogOnlyMode) {
    return json({ error: "La tienda está en modo catálogo. Las compras están deshabilitadas." }, 403);
  }

  if (!customer?.name?.trim() || !customer?.email?.trim() || !customer?.phone?.trim()) {
    return json({ error: "Nombre, email y teléfono son obligatorios" }, 400);
  }
  if (!Array.isArray(items) || items.length === 0) {
    return json({ error: "El carrito está vacío" }, 400);
  }

  // ── Resolver referencias y precios por slug ─────────
  const baseSlugOf = (s: string) => s.replace(/--caja$/, "");
  const baseSlugs = [...new Set(
    items.map((it: any) => baseSlugOf(String(it.slug || ""))).filter(Boolean)
  )];

  type ProductRow = {
    _id: string; slug: string; price?: number; boxUnitsPerBox?: number;
    catMarkup?: number | null; catBoxMarkup?: number | null;
    parentMarkup?: number | null; parentBoxMarkup?: number | null;
  };
  const productMap: Record<string, ProductRow> = {};
  if (baseSlugs.length) {
    const found = await sanity.fetch<ProductRow[]>(
      `*[_type=="catalogItem" && slug.current in $slugs]{
        _id, "slug": slug.current, price,
        "boxUnitsPerBox": boxOption.unitsPerBox,
        "catMarkup": category->markupPercent,
        "catBoxMarkup": category->boxMarkupPercent,
        "parentMarkup": category->parent->markupPercent,
        "parentBoxMarkup": category->parent->boxMarkupPercent
      }`,
      { slugs: baseSlugs }
    ).catch(() => []);
    found.forEach((p) => { productMap[p.slug] = p; });
  }

  const refs: Record<string, string> = {};
  Object.values(productMap).forEach((p) => { refs[p.slug] = p._id; });

  const num = orderNumber();
  const now = new Date().toISOString();
  const ceil = (n: number) => Math.ceil(n);

  const [shopSettings, siteSettings] = await Promise.all([
    sanity
      .fetch<{ shippingCost: number; freeShippingThreshold: number; currency: string; usdRate: number; markupPercent: number; boxMarkupPercent: number; ivaEnabled: boolean; ivaPercent: number }>(
        `*[_type=="siteSettingsShop"][0]{
          "shippingCost": coalesce(shippingCost, 0),
          "freeShippingThreshold": coalesce(freeShippingThreshold, 0),
          "currency": coalesce(currency, "USD"),
          "usdRate": coalesce(usdRate, 17),
          "markupPercent": coalesce(markupPercent, 26.5),
          "boxMarkupPercent": coalesce(boxMarkupPercent, 0),
          "ivaEnabled": coalesce(ivaEnabled, false),
          "ivaPercent": coalesce(ivaPercent, 16)
        }`
      )
      .catch(() => ({ shippingCost: 0, freeShippingThreshold: 0, currency: "USD", usdRate: 17, markupPercent: 26.5, boxMarkupPercent: 0, ivaEnabled: false, ivaPercent: 16 })),
    sanity
      .fetch<{ whatsapp?: string; payment?: { bankName?: string; accountHolder?: string; clabe?: string; accountNumber?: string } }>(
        `*[_type=="siteSettings"][0]{ "whatsapp": organization.whatsapp, payment }`
      )
      .catch(() => ({ whatsapp: undefined, payment: undefined })),
  ]);

  // ── Precio calculado en servidor ─────────────────────
  const serverUnitPrice = (slug: string): number | null => {
    const base = baseSlugOf(slug);
    const isBox = slug.endsWith("--caja");
    const prod = productMap[base];
    if (!prod?.price) return null;
    const { unit, box } = resolveMarkup(
      { markupPercent: prod.catMarkup, boxMarkupPercent: prod.catBoxMarkup, parentMarkupPercent: prod.parentMarkup, parentBoxMarkupPercent: prod.parentBoxMarkup },
      { markupPercent: shopSettings.markupPercent, boxMarkupPercent: shopSettings.boxMarkupPercent }
    );
    const raw = shopSettings.currency === "USD" ? prod.price * shopSettings.usdRate : prod.price;
    if (isBox && prod.boxUnitsPerBox) return ceil(raw * prod.boxUnitsPerBox * (1 + box / 100));
    return ceil(raw * (1 + unit / 100));
  };

  const calcTotal = ceil(
    items.reduce((acc: number, it: any) => {
      const price = serverUnitPrice(String(it.slug || "")) ?? ceil(Number(it.price ?? 0));
      return acc + price * Number(it.qty ?? 1);
    }, 0)
  );

  const isPickup   = deliveryMethod === "pickup";
  const hasBoxItem = Array.isArray(items) && items.some((it: any) => it.isBox === true);
  const shippingAmount =
    isPickup || hasBoxItem
      ? 0
      : shopSettings.freeShippingThreshold > 0 && calcTotal >= shopSettings.freeShippingThreshold
        ? 0
        : shopSettings.shippingCost;
  const ivaAmount = shopSettings.ivaEnabled ? ceil(calcTotal * (shopSettings.ivaPercent / 100)) : 0;
  const grandTotal = ceil(calcTotal + shippingAmount + ivaAmount);

  // ── Crear pedido en Sanity ───────────────────────────
  let created: { _id: string };
  try {
    created = await sanity.create({
      _type: "order",
      orderNumber: num,
      status: paymentMethod === "transfer" ? "awaiting_payment" : "pending",
      createdAt: now,
      paymentMethod:   paymentMethod ?? "transfer",
      deliveryMethod:  deliveryMethod ?? "shipping",
      ...(pickupBranchId ? { pickupBranch: { _type: "reference", _ref: pickupBranchId } } : {}),
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
        const base = baseSlugOf(String(it.slug || ""));
        const ref  = productMap[base]?._id;
        const unitPrice = serverUnitPrice(String(it.slug || "")) ?? ceil(Number(it.price ?? 0));
        return {
          _key: crypto.randomUUID(),
          ...(ref ? { product: { _type: "reference", _ref: ref } } : {}),
          variantLabel: String(it.title ?? ""),
          quantity:  Number(it.qty ?? 1),
          unitPrice,
        };
      }),
      subtotal: calcTotal,
      shipping: shippingAmount,
      iva:      ivaAmount,
      total:    grandTotal,
    });
  } catch (e: any) {
    return json({ error: e?.message ?? "Error al guardar el pedido" }, 500);
  }

  // ── Notificación por email ───────────────────────────
  // Para MercadoPago el correo se manda desde /api/mp-webhook una vez confirmado el pago
  if (paymentMethod === "mercadopago") {
    return json({ success: true, orderId: created._id, orderNumber: num, shipping: shippingAmount, iva: ivaAmount, total: grandTotal });
  }

  const resendKey = import.meta.env.RESEND_API_KEY;
  const notifyFromSanity = await sanity
    .fetch<string[] | null>(`*[_type == "siteSettings"][0].orderNotifyEmails`)
    .catch(() => null);
  const envEmail = import.meta.env.NOTIFY_EMAIL;
  const notifyEmails: string[] = [
    ...(notifyFromSanity?.filter(Boolean) ?? []),
    ...(envEmail && !notifyFromSanity?.includes(envEmail) ? [envEmail] : []),
  ];
  if (resendKey) {
    const resend = new Resend(resendKey);
    const fmt = (n: number) => `$${n.toLocaleString("es-MX", { maximumFractionDigits: 2 })} MXN`;
    const rows = items.map((it: any) => {
      const sub = Number(it.price ?? 0) * Number(it.qty ?? 1);
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${it.title}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center">${it.qty ?? 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right">${fmt(sub)}</td>
      </tr>`;
    }).join("");

    const shippingRow = `<tr>
      <td colspan="2" style="padding:6px 12px">Envío</td>
      <td style="padding:6px 12px;text-align:right">${shippingAmount === 0 ? "Gratis" : fmt(shippingAmount)}</td>
    </tr>`;
    const ivaRow = ivaAmount > 0 ? `<tr>
      <td colspan="2" style="padding:6px 12px">IVA (${shopSettings.ivaPercent}%)</td>
      <td style="padding:6px 12px;text-align:right">${fmt(ivaAmount)}</td>
    </tr>` : "";
    const totalRow = `<tr style="background:#f8fafc">
      <td colspan="2" style="padding:10px 12px;font-weight:700">TOTAL</td>
      <td style="padding:10px 12px;font-weight:700;text-align:right">${fmt(grandTotal)}</td>
    </tr>`;
    const itemsTable = `<table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#f8fafc">
        <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;opacity:.6">Producto</th>
        <th style="padding:8px 12px;text-align:center;font-size:11px;text-transform:uppercase;opacity:.6">Cant.</th>
        <th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;opacity:.6">Subtotal</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>${shippingRow}${ivaRow}${totalRow}</tfoot>
    </table>`;

    const waPhone = (siteSettings?.whatsapp ?? "528121087053").replace(/\D/g, "");
    const customerWaPhone = String(customer.phone ?? "").replace(/\D/g, "");
    const waMsg = encodeURIComponent(`Hola ${customer.name}, te contactamos de La Bodega del Instalador sobre tu pedido #${num} por ${fmt(grandTotal)}.`);
    const waLink = `https://wa.me/${customerWaPhone}?text=${waMsg}`;

    // ── Correo al admin ─────────────────────────────────────
    if (notifyEmails.length > 0) {
      const adminHtml = `
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
              <tr><td style="padding:6px 0;font-weight:600">Pago</td><td>${paymentMethod === "transfer" ? "Transferencia / Depósito" : (paymentMethod || "N/A")}</td></tr>
              <tr><td style="padding:6px 0;font-weight:600">Entrega</td><td>${deliveryMethod === "pickup" ? `Recoger en sucursal${pickupBranchName ? `: ${pickupBranchName}` : ""}` : "Envío a domicilio"}</td></tr>
            </table>
            ${itemsTable}
            ${customerWaPhone ? `<div style="margin-top:24px;text-align:center">
              <a href="${waLink}" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600">
                💬 Contactar por WhatsApp
              </a>
            </div>` : ""}
          </div>
          <div style="background:#f8fafc;padding:12px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;font-size:12px;color:#94a3b8;text-align:center">
            ${new Date(now).toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}
          </div>
        </div>`;

      await resend.emails.send({
        from: "La Bodega del Instalador <noreply@labodegadelinstalador.net>",
        to: notifyEmails,
        subject: `[Pedido] #${num} — ${customer.name} · ${fmt(grandTotal)}`,
        html: adminHtml,
        replyTo: customer.email || undefined,
      }).catch(() => {});
    }

    // ── Correo de confirmación al cliente ───────────────────
    const pay = siteSettings?.payment ?? {};
    const hasBankData = pay.bankName || pay.accountHolder || pay.clabe || pay.accountNumber;
    const bankSection = paymentMethod === "transfer" && hasBankData ? `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px 24px;margin-top:20px">
        <p style="margin:0 0 12px;font-weight:700;color:#166534">Datos para tu transferencia</p>
        <table style="font-size:14px;border-collapse:collapse">
          ${pay.bankName      ? `<tr><td style="padding:4px 16px 4px 0;opacity:.7">Banco</td><td style="font-weight:600">${pay.bankName}</td></tr>` : ""}
          ${pay.accountHolder ? `<tr><td style="padding:4px 16px 4px 0;opacity:.7">Titular</td><td style="font-weight:600">${pay.accountHolder}</td></tr>` : ""}
          ${pay.clabe         ? `<tr><td style="padding:4px 16px 4px 0;opacity:.7">CLABE</td><td style="font-family:monospace;font-weight:600">${pay.clabe}</td></tr>` : ""}
          ${pay.accountNumber ? `<tr><td style="padding:4px 16px 4px 0;opacity:.7">No. cuenta</td><td style="font-family:monospace;font-weight:600">${pay.accountNumber}</td></tr>` : ""}
          <tr><td style="padding:4px 16px 4px 0;opacity:.7">Referencia</td><td style="font-weight:600">Pedido ${num}</td></tr>
        </table>
        <p style="margin:14px 0 0;font-size:13px;color:#166534">Una vez realizado el pago, envía tu comprobante por WhatsApp al <a href="https://wa.me/${waPhone}" style="color:#166534">+${waPhone}</a>.</p>
      </div>` : "";

    const clientHtml = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#0f8604;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="margin:0;color:#fff;font-size:20px">¡Pedido recibido! #${num}</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:14px">La Bodega del Instalador</p>
        </div>
        <div style="background:#fff;padding:24px 32px;border:1px solid #e2e8f0;border-top:none">
          <p style="margin:0 0 20px;font-size:15px">Hola <strong>${customer.name}</strong>, confirmamos que recibimos tu pedido. Aquí está el resumen:</p>
          ${itemsTable}
          ${bankSection}
          <div style="margin-top:24px;text-align:center">
            <a href="https://labodegadelinstalador.net/mi-cuenta/" style="display:inline-block;background:#0f8604;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600">
              Ver mis pedidos
            </a>
          </div>
        </div>
        <div style="background:#f8fafc;padding:12px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;font-size:12px;color:#94a3b8;text-align:center">
          ${new Date(now).toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}
        </div>
      </div>`;

    await resend.emails.send({
      from: "La Bodega del Instalador <noreply@labodegadelinstalador.net>",
      to: [customer.email],
      subject: `Confirmación de pedido #${num} — La Bodega del Instalador`,
      html: clientHtml,
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
