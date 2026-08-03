import { useState } from "react";
import { useClient } from "sanity";
import { useToast } from "@sanity/ui";

export function CreditCashbackAction(props: any) {
  const client = useClient({ apiVersion: "2025-01-01" });
  const toast = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const doc = props.draft ?? props.published;

  if (!doc || doc._type !== "order") return null;
  if (doc.status !== "delivered") return null;

  return {
    label: isRunning ? "Acreditando…" : "💰 Acreditar cashback",
    disabled: isRunning,
    onHandle: async () => {
      setIsRunning(true);
      try {
        const existing = await client.fetch(
          `*[_type == "walletTransaction" && order._ref == $id][0]{_id}`,
          { id: doc._id }
        );
        if (existing) {
          toast.push({ status: "warning", title: "Este pedido ya tiene cashback acreditado." });
          setIsRunning(false);
          props.onComplete();
          return;
        }

        const settings = await client.fetch(
          `*[_type == "cashbackSettings"][0]{ enabled, percent }`
        );
        if (!settings?.enabled) {
          toast.push({ status: "warning", title: "El cashback está desactivado en Configuración." });
          setIsRunning(false);
          props.onComplete();
          return;
        }

        const email = doc.customer?.email;
        if (!email) {
          toast.push({ status: "error", title: "El pedido no tiene email de cliente." });
          setIsRunning(false);
          props.onComplete();
          return;
        }

        const percent = settings.percent ?? 0;
        const amount = Math.round(((doc.total ?? 0) * percent) / 100 * 100) / 100;

        if (amount > 0) {
          await client.create({
            _type: "walletTransaction",
            customerEmail: email,
            order: { _type: "reference", _ref: doc._id, _weak: true },
            amount,
            status: "available",
            note: `${percent}% del pedido #${doc.orderNumber ?? ""}`,
            createdAt: new Date().toISOString(),
          });
        }

        toast.push({ status: "success", title: `Cashback acreditado: $${amount.toFixed(2)}` });
        props.onComplete();
      } catch (err) {
        console.error("Error acreditando cashback:", err);
        toast.push({ status: "error", title: "Ocurrió un error al acreditar el cashback." });
      } finally {
        setIsRunning(false);
      }
    },
  };
}
