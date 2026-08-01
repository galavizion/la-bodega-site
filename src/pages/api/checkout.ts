import type { APIRoute } from "astro";
import { createClient } from "@sanity/client";
import { Resend } from "resend";
import { resolveMarkup } from "../../lib/pricing";
import { getSession } from "../../lib/auth";

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

  const { customer, items, paymentMethod, total, deliveryMethod, pickupBranchId, pickupBranchName, useCashback, _hp_website, "cf-turnstile-response": tsToken } = body;

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
    _id: string; slug: string; price?: number; variantPrice?: number; boxUnitsPerBox?: number;
    catMarkup?: number | null; catBoxMarkup?: number | null;
    parentMarkup?: number | null; parentBoxMarkup?: number | null;
    disableMarkup?: boolean | null;
  };
  const productMap: Record<string, ProductRow> = {};
  if (baseSlugs.length) {
    const found = await sanity.fetch<ProductRow[]>(
      `*[_type=="catalogItem" && slug.current in $slugs]{
        _id, "slug": slug.current, price,
        "variantPrice": variants[price != null][0].price,
        "boxUnitsPerBox": boxOption.unitsPerBox,
        "catMarkup": category->markupPercent,
        "catBoxMarkup": category->boxMarkupPercent,
        "parentMarkup": category->parent->markupPercent,
        "parentBoxMarkup": category->parent->boxMarkupPercent,
        disableMarkup
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
  const confirmationToken = crypto.randomUUID();

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
      .fetch<{
        whatsapp?: string;
        payment?: {
          bankName?: string; accountHolder?: string; clabe?: string; accountNumber?: string;
          reference?: string; instructions?: string; proofWhatsapp?: boolean;
        };
      }>(
        `{
          "whatsapp": coalesce(*[_type=="siteSettingsGeneral"][0].organization.whatsapp, *[_type=="siteSettings"][0].organization.whatsapp),
          "payment": *[_type=="siteSettingsPayment"][0]{
            bankName, accountHolder, clabe, accountNumber, reference, instructions, proofWhatsapp
          }
        }`
      )
      .catch(() => ({ whatsapp: undefined, payment: undefined })),
  ]);

  // ── Precio calculado en servidor ─────────────────────
  // Nunca confiar en el precio que manda el navegador: siempre se recalcula
  // desde Sanity, usando price del producto o, si no existe, el de su variante.
  // Devuelve null solo cuando el slug no corresponde a ningún producto real
  // (en ese caso se rechaza el pedido más abajo, en vez de confiar en el cliente).
  // Si el producto existe pero no tiene precio numérico (solo priceLabel /
  // cotización), se cobra 0 — nunca el precio que mande el navegador.
  const serverUnitPrice = (slug: string): number | null => {
    const base = baseSlugOf(slug);
    const isBox = slug.endsWith("--caja");
    const prod = productMap[base];
    if (!prod) return null;
    const basePrice = prod.price ?? prod.variantPrice;
    if (basePrice == null) return 0;
    const { unit, box } = resolveMarkup(
      { markupPercent: prod.catMarkup, boxMarkupPercent: prod.catBoxMarkup, parentMarkupPercent: prod.parentMarkup, parentBoxMarkupPercent: prod.parentBoxMarkup },
      { markupPercent: shopSettings.markupPercent, boxMarkupPercent: shopSettings.boxMarkupPercent },
      { disableMarkup: prod.disableMarkup }
    );
    const raw = shopSettings.currency === "USD" ? basePrice * shopSettings.usdRate : basePrice;
    if (isBox && prod.boxUnitsPerBox) return ceil(raw * prod.boxUnitsPerBox * (1 + box / 100));
    return ceil(raw * (1 + unit / 100));
  };

  // ── Validar que cada item del carrito corresponda a un producto real ──
  const unknownSlugs = items
    .map((it: any) => String(it.slug || ""))
    .filter((slug: string) => serverUnitPrice(slug) === null);
  if (unknownSlugs.length) {
    return json({ error: `Producto no encontrado o ya no disponible: ${unknownSlugs.join(", ")}` }, 400);
  }

  const calcTotal = ceil(
    items.reduce((acc: number, it: any) => {
      const price = serverUnitPrice(String(it.slug || "")) ?? 0;
      return acc + price * Number(it.qty ?? 1);
    }, 0)
  );

  const isPickup   = deliveryMethod === "pickup";
  // Verificado contra Sanity (no se confía en el flag it.isBox que manda el navegador):
  // solo cuenta como "caja" si el slug lo indica y el producto realmente tiene esa opción configurada.
  const hasBoxItem = items.some((it: any) => {
    const slug = String(it.slug || "");
    if (!slug.endsWith("--caja")) return false;
    return !!productMap[baseSlugOf(slug)]?.boxUnitsPerBox;
  });
  const shippingAmount =
    isPickup || hasBoxItem
      ? 0
      : shopSettings.freeShippingThreshold > 0 && calcTotal >= shopSettings.freeShippingThreshold
        ? 0
        : shopSettings.shippingCost;
  const ivaAmount = shopSettings.ivaEnabled ? ceil(calcTotal * (shopSettings.ivaPercent / 100)) : 0;
  const grandTotal = ceil(calcTotal + shippingAmount + ivaAmount);

  // ── Cashback: solo si hay sesión activa y coincide con el email del pedido ──
  // El monto NUNCA se toma del cliente — siempre se recalcula del saldo real en Sanity.
  const session = await getSession(request);
  let cashbackApplied = 0;
  const sessionEmail = session?.email?.trim().toLowerCase();
  const customerEmail = String(customer.email ?? "").trim().toLowerCase();
  if (useCashback === true && sessionEmail && sessionEmail === customerEmail) {
    const balance = await sanity
      .fetch<number>(
        `math::sum(*[_type=="walletTransaction" && customerEmail==$email && status != "reverted"].amount)`,
        { email: sessionEmail }
      )
      .catch(() => 0);
    cashbackApplied = Math.min(Math.max(balance ?? 0, 0), grandTotal);
  }
  const netTotal = ceil(grandTotal - cashbackApplied);

  // ── Crear pedido en Sanity ───────────────────────────
  let created: { _id: string };
  try {
    created = await sanity.create({
      _type: "order",
      orderNumber: num,
      confirmationToken,
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
        colonia: String(customer.colonia ?? "").trim(),
        city:    String(customer.city    ?? "").trim(),
        state:   String(customer.state   ?? "").trim(),
        zip:     String(customer.zip     ?? "").trim(),
      },
      items: items.map((it: any) => {
        const base = baseSlugOf(String(it.slug || ""));
        const ref  = productMap[base]?._id;
        const unitPrice = serverUnitPrice(String(it.slug || "")) ?? 0;
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
      total:    netTotal,
      cashbackApplied,
    });
  } catch (e: any) {
    return json({ error: e?.message ?? "Error al guardar el pedido" }, 500);
  }

  if (cashbackApplied > 0) {
    await sanity.create({
      _type: "walletTransaction",
      customerEmail: sessionEmail,
      order: { _type: "reference", _ref: created._id, _weak: true },
      amount: -cashbackApplied,
      status: "redeemed",
      note: `Usado en pedido #${num}`,
      createdAt: now,
    }).catch((e) => console.error("Error al registrar redención de cashback:", e));
  }

  // ── Notificación por email ───────────────────────────
  // Para MercadoPago el correo se manda desde /api/mp-webhook una vez confirmado el pago
  if (paymentMethod === "mercadopago") {
    return json({ success: true, orderId: created._id, orderNumber: num, confirmationToken, shipping: shippingAmount, iva: ivaAmount, total: netTotal, cashbackApplied });
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
      const sub = (serverUnitPrice(String(it.slug || "")) ?? 0) * Number(it.qty ?? 1);
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
    const cashbackRow = cashbackApplied > 0 ? `<tr>
      <td colspan="2" style="padding:6px 12px;color:#166534">Cashback aplicado</td>
      <td style="padding:6px 12px;text-align:right;color:#166534">-${fmt(cashbackApplied)}</td>
    </tr>` : "";
    const totalRow = `<tr style="background:#f8fafc">
      <td colspan="2" style="padding:10px 12px;font-weight:700">TOTAL A PAGAR</td>
      <td style="padding:10px 12px;font-weight:700;text-align:right">${fmt(netTotal)}</td>
    </tr>`;
    const itemsTable = `<table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#f8fafc">
        <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;opacity:.6">Producto</th>
        <th style="padding:8px 12px;text-align:center;font-size:11px;text-transform:uppercase;opacity:.6">Cant.</th>
        <th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;opacity:.6">Subtotal</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>${shippingRow}${ivaRow}${cashbackRow}${totalRow}</tfoot>
    </table>`;

    const waPhone = (siteSettings?.whatsapp ?? "528121087053").replace(/\D/g, "");
    const customerWaPhone = String(customer.phone ?? "").replace(/\D/g, "");
    const waMsg = encodeURIComponent(`Hola ${customer.name}, te contactamos de La Bodega del Instalador sobre tu pedido #${num} por ${fmt(netTotal)}.`);
    const waLink = `https://wa.me/${customerWaPhone}?text=${waMsg}`;

    // ── Correo al admin ─────────────────────────────────────
    if (notifyEmails.length > 0) {
      const adminHtml = `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#111827">
          <div style="background:#111827;padding:24px 32px;border-radius:12px 12px 0 0">
            <h1 style="margin:0;color:#FFD700;font-size:20px">🛒 Nuevo pedido #${num}</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,.75);font-size:14px">La Bodega del Instalador</p>
          </div>
          <div style="background:#fff;padding:24px 32px;border:1px solid #e2e8f0;border-top:none">
            <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;color:#111827">
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
        subject: `[Pedido] #${num} — ${customer.name} · ${fmt(netTotal)}`,
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
          <tr><td style="padding:4px 16px 4px 0;opacity:.7">Referencia</td><td style="font-weight:600">${pay.reference || `Pedido ${num}`}</td></tr>
        </table>
        <p style="margin:14px 0 0;font-size:13px;color:#166534">${pay.instructions || "Una vez realizado el pago, envía tu comprobante para confirmar tu pedido."}</p>
        ${pay.proofWhatsapp !== false ? `<p style="margin:8px 0 0;font-size:13px;color:#166534">Envíalo por WhatsApp al <a href="https://wa.me/${waPhone}" style="color:#166534">+${waPhone}</a>.</p>` : ""}
      </div>` : "";

    const clientHtml = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#111827">
        <div style="background:#111827;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="margin:0;color:#FFD700;font-size:20px">¡Pedido recibido! #${num}</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,.75);font-size:14px">La Bodega del Instalador</p>
        </div>
        <div style="background:#fff;padding:24px 32px;border:1px solid #e2e8f0;border-top:none">
          <p style="margin:0 0 20px;font-size:15px">Hola <strong>${customer.name}</strong>, confirmamos que recibimos tu pedido. Aquí está el resumen:</p>
          ${itemsTable}
          ${bankSection}
          <div style="margin-top:24px;text-align:center">
            <a href="https://labodegadelinstalador.net/mi-cuenta/" style="display:inline-block;background:#111827;color:#FFD700;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600">
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

  return json({ success: true, orderId: created._id, orderNumber: num, confirmationToken, shipping: shippingAmount, total: netTotal, cashbackApplied });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
