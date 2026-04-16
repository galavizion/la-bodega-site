import React, { useState, useEffect, useCallback } from "react";
import { useClient } from "sanity";

type Product = {
  _id: string;
  title: string;
  brand?: string;
  tags?: string[];
  published?: boolean;
  variantCount: number;
};

const S: React.CSSProperties = {};

export function ProductManagerPanel() {
  const client = useClient({ apiVersion: "2025-01-01" });

  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [tagFilter, setTagFilter] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    client
      .fetch<Product[]>(
        `*[_type=="catalogItem"] | order(_createdAt desc) {
          _id, title, brand, tags, published,
          "variantCount": count(variants)
        }`
      )
      .then((data) => { setProducts(data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [client]);

  useEffect(() => { load(); }, [load]);

  const allTags = [...new Set(products.flatMap((p) => p.tags ?? []))].sort();

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(selected.size === products.length ? new Set() : new Set(products.map((p) => p._id)));
  };

  const selectByTag = () => {
    if (!tagFilter) return;
    setSelected((prev) => {
      const next = new Set(prev);
      products.filter((p) => (p.tags ?? []).includes(tagFilter)).forEach((p) => next.add(p._id));
      return next;
    });
  };

  const deleteSelected = async () => {
    setDeleting(true);
    setConfirm(false);
    try {
      const tx = client.transaction();
      [...selected].forEach((id) => tx.delete(id));
      await tx.commit();
      const count = selected.size;
      setProducts((prev) => prev.filter((p) => !selected.has(p._id)));
      setSelected(new Set());
      showToast(`✅ ${count} producto${count !== 1 ? "s" : ""} eliminado${count !== 1 ? "s" : ""}`, true);
    } catch (e: any) {
      showToast(`❌ Error: ${e?.message ?? "Error desconocido"}`, false);
    }
    setDeleting(false);
  };

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Estilos inline ──────────────────────────────────
  const wrap: React.CSSProperties = { padding: "24px", fontFamily: "system-ui, sans-serif", height: "100%", overflowY: "auto" };
  const toolbar: React.CSSProperties = { display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginBottom: "16px" };
  const btn = (bg: string, color = "#fff"): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: "6px",
    padding: "8px 14px", borderRadius: "8px", border: "none",
    fontSize: "13px", fontWeight: 600, cursor: "pointer", background: bg, color,
  });
  const badge: React.CSSProperties = {
    background: "#4275ff", color: "#fff", borderRadius: "99px",
    padding: "2px 10px", fontSize: "12px", fontWeight: 700,
  };
  const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: "13px" };
  const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(0,0,0,.08)", fontSize: "11px", textTransform: "uppercase", opacity: 0.5, fontWeight: 600 };
  const td = (sel: boolean): React.CSSProperties => ({ textAlign: "left", padding: "9px 12px", borderBottom: "1px solid rgba(0,0,0,.06)", background: sel ? "rgba(66,117,255,.08)" : "transparent" });
  const tag: React.CSSProperties = { display: "inline-block", background: "rgba(0,0,0,.07)", borderRadius: "4px", padding: "1px 6px", fontSize: "11px", margin: "1px" };
  const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" };
  const modal: React.CSSProperties = { background: "#fff", borderRadius: "14px", padding: "28px", maxWidth: "380px", width: "90%" };
  const toastStyle = (ok: boolean): React.CSSProperties => ({
    position: "fixed", bottom: "24px", right: "24px", padding: "12px 20px",
    borderRadius: "10px", fontSize: "14px", fontWeight: 600,
    background: ok ? "#22c55e" : "#ef4444", color: "#fff", zIndex: 200,
  });

  return React.createElement(
    "div",
    { style: wrap },

    // Toolbar
    React.createElement(
      "div",
      { style: toolbar },

      React.createElement(
        "label",
        { style: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" } },
        React.createElement("input", {
          type: "checkbox",
          checked: products.length > 0 && selected.size === products.length,
          onChange: selectAll,
          style: { width: "15px", height: "15px", accentColor: "#4275ff" },
        }),
        "Seleccionar todos"
      ),

      React.createElement(
        "select",
        {
          value: tagFilter,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setTagFilter(e.target.value),
          style: { padding: "7px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px", cursor: "pointer" },
        },
        React.createElement("option", { value: "" }, "— Filtrar por grupo —"),
        ...allTags.map((t) => React.createElement("option", { key: t, value: t }, t))
      ),

      React.createElement(
        "button",
        { onClick: selectByTag, disabled: !tagFilter, style: btn("rgba(0,0,0,.08)", "#333") },
        "Seleccionar grupo"
      ),

      React.createElement("span", { style: { flex: 1 } }),

      selected.size > 0 && React.createElement("span", { style: badge }, `${selected.size} seleccionado${selected.size !== 1 ? "s" : ""}`),

      React.createElement(
        "button",
        {
          onClick: () => setConfirm(true),
          disabled: selected.size === 0 || deleting,
          style: { ...btn("#ef4444"), opacity: selected.size === 0 || deleting ? 0.4 : 1, cursor: selected.size === 0 || deleting ? "not-allowed" : "pointer" },
        },
        deleting ? "Eliminando…" : "🗑 Eliminar seleccionados"
      ),

      React.createElement(
        "button",
        { onClick: load, style: btn("rgba(0,0,0,.07)", "#333") },
        "↻ Recargar"
      )
    ),

    // Tabla
    loading
      ? React.createElement("div", { style: { textAlign: "center", padding: "60px", opacity: 0.4 } }, "Cargando productos…")
      : React.createElement(
          "div",
          { style: { border: "1px solid rgba(0,0,0,.1)", borderRadius: "12px", overflow: "hidden" } },
          React.createElement(
            "table",
            { style: table },
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                null,
                React.createElement("th", { style: { ...th, width: "36px" } }),
                React.createElement("th", { style: th }, "Nombre"),
                React.createElement("th", { style: th }, "Marca"),
                React.createElement("th", { style: th }, "Tags"),
                React.createElement("th", { style: th }, "Variantes"),
                React.createElement("th", { style: th }, "Estado")
              )
            ),
            React.createElement(
              "tbody",
              null,
              products.length === 0
                ? React.createElement("tr", null, React.createElement("td", { colSpan: 6, style: { textAlign: "center", padding: "40px", opacity: 0.4 } }, "Sin productos"))
                : products.map((p) =>
                    React.createElement(
                      "tr",
                      { key: p._id },
                      React.createElement("td", { style: td(selected.has(p._id)) },
                        React.createElement("input", {
                          type: "checkbox",
                          checked: selected.has(p._id),
                          onChange: () => toggle(p._id),
                          style: { width: "15px", height: "15px", accentColor: "#4275ff" },
                        })
                      ),
                      React.createElement("td", { style: { ...td(selected.has(p._id)), fontWeight: 600 } }, p.title ?? "—"),
                      React.createElement("td", { style: td(selected.has(p._id)) }, p.brand ?? "—"),
                      React.createElement("td", { style: td(selected.has(p._id)) },
                        (p.tags ?? []).length
                          ? (p.tags ?? []).map((t) => React.createElement("span", { key: t, style: tag }, t))
                          : React.createElement("span", { style: { opacity: 0.4 } }, "—")
                      ),
                      React.createElement("td", { style: { ...td(selected.has(p._id)), opacity: 0.6 } }, `${p.variantCount ?? 0}`),
                      React.createElement("td", { style: td(selected.has(p._id)) },
                        p.published
                          ? React.createElement("span", { style: { color: "#16a34a", fontWeight: 600 } }, "● Publicado")
                          : React.createElement("span", { style: { opacity: 0.4 } }, "● Oculto")
                      )
                    )
                  )
            )
          )
        ),

    // Modal confirmación
    confirm && React.createElement(
      "div",
      { style: overlay, onClick: () => setConfirm(false) },
      React.createElement(
        "div",
        { style: modal, onClick: (e: React.MouseEvent) => e.stopPropagation() },
        React.createElement("h3", { style: { margin: "0 0 10px", fontSize: "18px" } }, "¿Eliminar productos?"),
        React.createElement("p", { style: { margin: "0 0 24px", opacity: 0.6, lineHeight: 1.6, fontSize: "14px" } },
          `Se eliminarán ${selected.size} producto${selected.size !== 1 ? "s" : ""} de forma permanente.`
        ),
        React.createElement(
          "div",
          { style: { display: "flex", gap: "10px", justifyContent: "flex-end" } },
          React.createElement("button", { onClick: () => setConfirm(false), style: btn("rgba(0,0,0,.08)", "#333") }, "Cancelar"),
          React.createElement("button", { onClick: deleteSelected, style: btn("#ef4444") }, "Sí, eliminar")
        )
      )
    ),

    // Toast
    toast && React.createElement("div", { style: toastStyle(toast.ok) }, toast.msg)
  );
}
