import { useState } from "react";

const PAYMENT_LABELS: Record<string, string> = {
  transfer: "Transferencia",
  cash: "Efectivo",
  card: "Tarjeta",
  whatsapp: "WhatsApp / Manual",
  mercadopago: "MercadoPago",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  awaiting_payment: "Esperando Pago (Transferencia)",
  confirmed: "Confirmado",
  processing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  deleted: "Eliminado",
};

const fmt = (n: number) => `$${(n ?? 0).toLocaleString("es-MX", { maximumFractionDigits: 2 })} MXN`;

export function DownloadOrderPdfAction(props: any) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const doc = props.draft ?? props.published;

  if (!doc || doc._type !== "order") return null;

  return {
    label: "Descargar PDF",
    onHandle: async () => {
      try {
        const [{ default: jsPDF }, autoTableModule] = await Promise.all([
          import("jspdf"),
          import("jspdf-autotable"),
        ]);
        const autoTable = (autoTableModule as any).default ?? (autoTableModule as any);

        const pdf = new jsPDF();
        const orderNumber = doc.orderNumber ?? "---";
        const customer = doc.customer ?? {};
        const items = doc.items ?? [];
        const createdAt = doc.createdAt ? new Date(doc.createdAt).toLocaleString("es-MX") : "";

        pdf.setFontSize(16);
        pdf.text("La Bodega del Instalador", 14, 18);
        pdf.setFontSize(11);
        pdf.text(`Pedido #${orderNumber}`, 14, 26);
        pdf.setFontSize(9);
        pdf.setTextColor(120);
        pdf.text(createdAt, 14, 32);
        pdf.setTextColor(0);

        pdf.setFontSize(10);
        const infoLines = [
          `Estado: ${STATUS_LABELS[doc.status] ?? doc.status ?? "—"}`,
          `Cliente: ${customer.name ?? "—"}${customer.company ? ` (${customer.company})` : ""}`,
          `Email: ${customer.email ?? "—"}`,
          `Teléfono: ${customer.phone ?? "—"}`,
          `Entrega: ${doc.deliveryMethod === "pickup" ? "Recoger en sucursal" : "Envío a domicilio"}`,
          ...(doc.deliveryMethod !== "pickup"
            ? [`Dirección: ${[customer.address, customer.city, customer.state, customer.zip].filter(Boolean).join(", ") || "—"}`]
            : []),
          `Método de pago: ${PAYMENT_LABELS[doc.paymentMethod] ?? doc.paymentMethod ?? "—"}`,
        ];
        let y = 42;
        infoLines.forEach((line) => {
          pdf.text(line, 14, y);
          y += 6;
        });

        autoTable(pdf, {
          startY: y + 4,
          head: [["Producto", "Cant.", "Precio unit.", "Subtotal"]],
          body: items.map((it: any) => [
            it.variantLabel || "Producto",
            String(it.quantity ?? 1),
            fmt(it.unitPrice ?? 0),
            fmt((it.unitPrice ?? 0) * (it.quantity ?? 1)),
          ]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [15, 134, 4] },
        });

        const finalY = (pdf as any).lastAutoTable?.finalY ?? y + 20;
        pdf.setFontSize(10);
        pdf.text(`Subtotal: ${fmt(doc.subtotal ?? 0)}`, 140, finalY + 10);
        pdf.text(`Envío: ${fmt(doc.shipping ?? 0)}`, 140, finalY + 16);
        pdf.setFontSize(11);
        pdf.text(`Total: ${fmt(doc.total ?? 0)}`, 140, finalY + 24);

        pdf.save(`pedido-${orderNumber}.pdf`);
        props.onComplete();
      } catch (err) {
        console.error("Error generando PDF del pedido:", err);
        setDialogOpen(true);
      }
    },
    dialog: dialogOpen && ({
      type: "dialog",
      header: "Error al generar PDF",
      content: "Ocurrió un error al generar el PDF del pedido. Intenta de nuevo.",
      onClose: () => setDialogOpen(false),
    } as const),
  };
}
