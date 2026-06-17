import React, { useState, useEffect, useCallback } from "react";
import { useClient } from "sanity";

type Product = {
  _id: string;
  title: string;
  brand?: string;
  tags?: string[];
  published?: boolean;
  variantCount: number;
  imgUrl?: string;
};

export function ProductManagerPanel() {
  const client = useClient({ apiVersion: "2025-01-01" });

  const [products, setProducts]   = useState<Product[]>([]);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [loading, setLoading]     = useState(true);
  const [working, setWorking]     = useState(false);
  const [confirm, setConfirm]     = useState<"delete" | null>(null);
  const [tagFilter, setTagFilter]       = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "hidden">("all");
  const [searchQuery, setSearchQuery]   = useState("");
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    client
      .fetch<Product[]>(
        `*[_type=="catalogItem"] | order(_createdAt desc) {
          _id, title, brand, tags, published,
          "variantCount": count(variants),
          "imgUrl": coalesce(coverImage.asset->url, imageUrl)
        }`
      )
      .then((data) => { setProducts(data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [client]);

  useEffect(() => { load(); }, [load]);

  const allTags = [...new Set(products.flatMap((p) => p.tags ?? []))].sort();

  const filteredProducts = products.filter((p) => {
    if (statusFilter === "published" && p.published === false) return false;
    if (statusFilter === "hidden"    && p.published !== false) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (p.title ?? "").toLowerCase().includes(q) || (p.brand ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(selected.size === filteredProducts.length ? new Set() : new Set(filteredProducts.map((p) => p._id)));
  };

  const selectByTag = () => {
    if (!tagFilter) return;
    setSelected((prev) => {
      const next = new Set(prev);
      products.filter((p) => (p.tags ?? []).includes(tagFilter)).forEach((p) => next.add(p._id));
      return next;
    });
  };

  // ── Ocultar (published = false) ──────────────────────
  const unpublishSelected = async () => {
    setWorking(true);
    try {
      const tx = client.transaction();
      [...selected].forEach((id) => tx.patch(id, { set: { published: false } }));
      await tx.commit();
      const count = selected.size;
      setProducts((prev) => prev.map((p) => selected.has(p._id) ? { ...p, published: false } : p));
      setSelected(new Set());
      showToast(`✅ ${count} producto${count !== 1 ? "s" : ""} ocultado${count !== 1 ? "s" : ""}`, true);
    } catch (e: any) {
      showToast(`❌ Error: ${e?.message ?? "Error desconocido"}`, false);
    }
    setWorking(false);
  };

  // ── Publicar (published = true) ──────────────────────
  const publishSelected = async () => {
    setWorking(true);
    try {
      const tx = client.transaction();
      [...selected].forEach((id) => tx.patch(id, { set: { published: true } }));
      await tx.commit();
      const count = selected.size;
      setProducts((prev) => prev.map((p) => selected.has(p._id) ? { ...p, published: true } : p));
      setSelected(new Set());
      showToast(`✅ ${count} producto${count !== 1 ? "s" : ""} publicado${count !== 1 ? "s" : ""}`, true);
    } catch (e: any) {
      showToast(`❌ Error: ${e?.message ?? "Error desconocido"}`, false);
    }
    setWorking(false);
  };

  // ── Eliminar ─────────────────────────────────────────
  const deleteSelected = async () => {
    setWorking(true);
    setConfirm(null);
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
    setWorking(false);
  };

  // ── Normalizar ───────────────────────────────────────
  const normalizeSelected = async () => {
    setWorking(true);
    try {
      const selectedIds = Array.from(selected);
      // Extraer todo el documento para revisar sus campos
      const fullDocs = await client.fetch(`*[_id in $ids]`, { ids: selectedIds });

      const DICTIONARY: Record<string, string> = {
        "Fire Sprinkler": "Rociador contra incendio",
        "Wall Plate": "Placa de escudete",
        "Escutcheon": "Escudete",
        "FDC": "Toma siamesa",
        "Hose Valve": "Válvula para manguera",
        "Check Valve": "Válvula de retención",
        "Butterfly Valve": "Válvula mariposa",
        "Alarm Check Valve": "Válvula check de alarma",
        "Grooved": "Ranurado",
        "Threaded": "Roscado",
        "Ductile Iron": "Hierro dúctil",
      };

      const normalizeText = (text?: string) => {
        if (!text) return text;
        let newText = text;
        for (const [en, es] of Object.entries(DICTIONARY)) {
          const regex = new RegExp(`\\b${en}\\b`, 'gi');
          newText = newText.replace(regex, (match) => {
            if (match === match.toUpperCase() && match.length > 1) return es.toUpperCase();
            if (match === match.toLowerCase()) return es.toLowerCase();
            if (match[0] === match[0].toUpperCase()) return es.charAt(0).toUpperCase() + es.slice(1).toLowerCase();
            return es;
          });
        }
        return newText;
      };

      let normalizedCount = 0;
      const tx = client.transaction();

      fullDocs.forEach((doc: any) => {
        let hasChanges = false;
        const patch: any = {};

        if (doc.title) {
          const newTitle = normalizeText(doc.title);
          if (newTitle !== doc.title) { patch.title = newTitle; hasChanges = true; }
        }

        if (doc.excerpt) {
          const newExcerpt = normalizeText(doc.excerpt);
          if (newExcerpt !== doc.excerpt) { patch.excerpt = newExcerpt; hasChanges = true; }
        }

        if (doc.variants && Array.isArray(doc.variants)) {
          const newVariants = doc.variants.map((variant: any) => {
            let varChanged = false;
            const newVar = { ...variant };
            
            if (newVar.label) {
              const newLabel = normalizeText(newVar.label);
              if (newLabel !== newVar.label) { newVar.label = newLabel; varChanged = true; }
            }
            
            if (newVar.specifications && Array.isArray(newVar.specifications)) {
              newVar.specifications = newVar.specifications.map((spec: any) => {
                let specChanged = false;
                const newSpec = { ...spec };
                if (newSpec.label) {
                  const newLabel = normalizeText(newSpec.label);
                  if (newLabel !== newSpec.label) { newSpec.label = newLabel; specChanged = true; }
                }
                if (newSpec.value) {
                  const newValue = normalizeText(newSpec.value);
                  if (newValue !== newSpec.value) { newSpec.value = newValue; specChanged = true; }
                }
                if (specChanged) varChanged = true;
                return newSpec;
              });
            }
            if (varChanged) hasChanges = true;
            return newVar;
          });

          if (hasChanges) { patch.variants = newVariants; }
        }

        if (hasChanges) {
          tx.patch(doc._id, { set: patch });
          normalizedCount++;
        }
      });

      if (normalizedCount > 0) {
        await tx.commit();
        showToast(`✅ ${normalizedCount} producto(s) normalizado(s)`, true);
        load();
      } else {
        showToast(`ℹ️ Ningún producto necesitaba normalización`, true);
      }
      setSelected(new Set());
    } catch (e: any) {
      showToast(`❌ Error al normalizar: ${e?.message ?? "Error desconocido"}`, false);
    }
    setWorking(false);
  };

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Estilos ──────────────────────────────────────────
  const wrap: React.CSSProperties       = { padding: "24px", fontFamily: "system-ui, sans-serif", height: "100%", overflowY: "auto" };
  const toolbar: React.CSSProperties    = { display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "16px" };
  const btn = (bg: string, color = "#fff", disabled = false): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: "6px",
    padding: "8px 14px", borderRadius: "6px", border: "none",
    fontSize: "13px", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
    background: bg, color, opacity: disabled ? 0.4 : 1,
  });
  const badge: React.CSSProperties      = { background: "#4275ff", color: "#fff", borderRadius: "99px", padding: "2px 10px", fontSize: "12px", fontWeight: 700 };
  const table: React.CSSProperties      = { width: "100%", borderCollapse: "collapse", fontSize: "13px" };
  const th: React.CSSProperties         = { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid rgba(0,0,0,.08)", fontSize: "11px", textTransform: "uppercase", opacity: 0.5, fontWeight: 600 };
  const tdBase = (sel: boolean): React.CSSProperties => ({ textAlign: "left", padding: "7px 10px", borderBottom: "1px solid rgba(0,0,0,.06)", background: sel ? "rgba(66,117,255,.08)" : "transparent", verticalAlign: "middle" });
  const tagStyle: React.CSSProperties   = { display: "inline-block", background: "rgba(0,0,0,.07)", borderRadius: "4px", padding: "1px 6px", fontSize: "11px", margin: "1px" };
  const overlay: React.CSSProperties    = { position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" };
  const modal: React.CSSProperties      = { background: "#fff", borderRadius: "10px", padding: "28px", maxWidth: "380px", width: "90%" };
  const toastStyle = (ok: boolean): React.CSSProperties => ({
    position: "fixed", bottom: "24px", right: "24px", padding: "12px 20px",
    borderRadius: "8px", fontSize: "14px", fontWeight: 600,
    background: ok ? "#22c55e" : "#ef4444", color: "#fff", zIndex: 200,
  });

  const none = selected.size === 0 || working;
  const selUnpublished = [...selected].some((id) => products.find((p) => p._id === id)?.published !== false);
  const selPublished   = [...selected].some((id) => products.find((p) => p._id === id)?.published === false);

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
          checked: filteredProducts.length > 0 && filteredProducts.every(p => selected.has(p._id)),
          onChange: selectAll,
          style: { width: "15px", height: "15px", accentColor: "#4275ff" },
        }),
        "Todos"
      ),

      React.createElement("input", {
        type: "search",
        placeholder: "Buscar por nombre o marca…",
        value: searchQuery,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value),
        style: { padding: "7px 10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "13px", minWidth: "200px", flex: 1 },
      }),

      React.createElement(
        "select",
        {
          value: tagFilter,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setTagFilter(e.target.value),
          style: { padding: "7px 10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "13px", cursor: "pointer" },
        },
        React.createElement("option", { value: "" }, "— Filtrar por grupo —"),
        ...allTags.map((t) => React.createElement("option", { key: t, value: t }, t))
      ),

      React.createElement("button", { onClick: selectByTag, disabled: !tagFilter, style: btn("rgba(0,0,0,.08)", "#333", !tagFilter) }, "Sel. grupo"),

      // Status filter pills
      ...(["all", "published", "hidden"] as const).map((f) =>
        React.createElement(
          "button",
          {
            key: f,
            onClick: () => setStatusFilter(f),
            style: {
              padding: "6px 12px", borderRadius: "20px", border: "none",
              fontSize: "12px", fontWeight: 600, cursor: "pointer",
              background: statusFilter === f
                ? (f === "hidden" ? "#f59e0b" : f === "published" ? "#16a34a" : "#4275ff")
                : "rgba(0,0,0,.08)",
              color: statusFilter === f ? "#fff" : "#555",
            },
          },
          f === "all" ? `Todos (${products.length})` :
          f === "published" ? `Públicos (${products.filter(p => p.published !== false).length})` :
          `Ocultos (${products.filter(p => p.published === false).length})`
        )
      ),

      React.createElement("span", { style: { flex: 1 } }),

      selected.size > 0 && React.createElement("span", { style: badge }, `${selected.size} sel.`),

      // Ocultar
      React.createElement(
        "button",
        { onClick: unpublishSelected, disabled: none || !selUnpublished, style: btn("#f59e0b", "#fff", none || !selUnpublished) },
        working ? "…" : "👁 Ocultar"
      ),

      // Publicar
      React.createElement(
        "button",
        { onClick: publishSelected, disabled: none || !selPublished, style: btn("#16a34a", "#fff", none || !selPublished) },
        working ? "…" : "✅ Publicar"
      ),

      // Normalizar
      React.createElement(
        "button",
        { onClick: normalizeSelected, disabled: none, style: btn("#8b5cf6", "#fff", none) },
        working ? "…" : "✨ Normalizar"
      ),

      // Eliminar
      React.createElement(
        "button",
        { onClick: () => setConfirm("delete"), disabled: none, style: btn("#ef4444", "#fff", none) },
        "🗑 Eliminar"
      ),

      React.createElement("button", { onClick: load, style: btn("rgba(0,0,0,.07)", "#333") }, "↻")
    ),

    // Tabla
    loading
      ? React.createElement("div", { style: { textAlign: "center", padding: "60px", opacity: 0.4 } }, "Cargando…")
      : React.createElement(
          "div",
          { style: { border: "1px solid rgba(0,0,0,.1)", borderRadius: "8px", overflow: "hidden" } },
          React.createElement(
            "table",
            { style: table },
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                null,
                React.createElement("th", { style: { ...th, width: "32px" } }),
                React.createElement("th", { style: { ...th, width: "52px" } }),  // imagen
                React.createElement("th", { style: th }, "Nombre"),
                React.createElement("th", { style: th }, "Marca"),
                React.createElement("th", { style: th }, "Tags"),
                React.createElement("th", { style: { ...th, width: "70px" } }, "Var."),
                React.createElement("th", { style: { ...th, width: "90px" } }, "Estado")
              )
            ),
            React.createElement(
              "tbody",
              null,
              filteredProducts.length === 0
                ? React.createElement("tr", null, React.createElement("td", { colSpan: 7, style: { textAlign: "center", padding: "40px", opacity: 0.4 } }, "Sin productos"))
                : filteredProducts.map((p) => {
                    const sel = selected.has(p._id);
                    const isPublished = p.published !== false;
                    return React.createElement(
                      "tr",
                      { key: p._id, style: { opacity: isPublished ? 1 : 0.45 } },

                      // Checkbox
                      React.createElement("td", { style: tdBase(sel) },
                        React.createElement("input", {
                          type: "checkbox",
                          checked: sel,
                          onChange: () => toggle(p._id),
                          style: { width: "15px", height: "15px", accentColor: "#4275ff" },
                        })
                      ),

                      // Imagen
                      React.createElement("td", { style: tdBase(sel) },
                        p.imgUrl
                          ? React.createElement("img", {
                              src: `${p.imgUrl}?w=80&h=80&fit=crop&auto=format`,
                              alt: p.title ?? "",
                              style: { width: "44px", height: "44px", objectFit: "contain", background: "#f3f4f6", display: "block" },
                            })
                          : React.createElement("div", {
                              style: { width: "44px", height: "44px", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" },
                            }, "📦")
                      ),

                      // Título
                      React.createElement("td", { style: { ...tdBase(sel), fontWeight: 600, maxWidth: "220px" } },
                        React.createElement("span", { style: { display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, p.title ?? "—")
                      ),

                      // Marca
                      React.createElement("td", { style: { ...tdBase(sel), color: "#6b7280" } }, p.brand ?? "—"),

                      // Tags
                      React.createElement("td", { style: tdBase(sel) },
                        (p.tags ?? []).length
                          ? (p.tags ?? []).map((t) => React.createElement("span", { key: t, style: tagStyle }, t))
                          : React.createElement("span", { style: { opacity: 0.3 } }, "—")
                      ),

                      // Variantes
                      React.createElement("td", { style: { ...tdBase(sel), opacity: 0.6, textAlign: "center" } }, `${p.variantCount ?? 0}`),

                      // Estado
                      React.createElement("td", { style: tdBase(sel) },
                        isPublished
                          ? React.createElement("span", { style: { color: "#16a34a", fontWeight: 700, fontSize: "12px" } }, "● Público")
                          : React.createElement("span", { style: { color: "#f59e0b", fontWeight: 700, fontSize: "12px" } }, "● Oculto")
                      )
                    );
                  })
            )
          )
        ),

    // Modal confirmación eliminar
    confirm === "delete" && React.createElement(
      "div",
      { style: overlay, onClick: () => setConfirm(null) },
      React.createElement(
        "div",
        { style: modal, onClick: (e: React.MouseEvent) => e.stopPropagation() },
        React.createElement("h3", { style: { margin: "0 0 10px", fontSize: "18px" } }, "¿Eliminar productos?"),
        React.createElement("p", { style: { margin: "0 0 6px", opacity: 0.6, lineHeight: 1.6, fontSize: "14px" } },
          `Se eliminarán ${selected.size} producto${selected.size !== 1 ? "s" : ""} de forma permanente.`
        ),
        React.createElement("p", { style: { margin: "0 0 24px", fontSize: "13px", color: "#f59e0b", fontWeight: 600 } },
          "💡 Tip: usa «Ocultar» para quitarlos del sitio sin borrarlos."
        ),
        React.createElement(
          "div",
          { style: { display: "flex", gap: "10px", justifyContent: "flex-end" } },
          React.createElement("button", { onClick: () => setConfirm(null), style: btn("rgba(0,0,0,.08)", "#333") }, "Cancelar"),
          React.createElement("button", { onClick: deleteSelected, style: btn("#ef4444") }, "Sí, eliminar")
        )
      )
    ),

    // Toast
    toast && React.createElement("div", { style: toastStyle(toast.ok) }, toast.msg)
  );
}
