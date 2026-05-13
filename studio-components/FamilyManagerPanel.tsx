import React, { useState, useEffect, useCallback } from "react";
import { useClient } from "sanity";

type Product = {
  _id: string;
  title: string;
  sku?: string;
  familySlug?: string;
  isFamilyRepresentative?: boolean;
  imgUrl?: string;
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

export function FamilyManagerPanel() {
  const client = useClient({ apiVersion: "2025-01-01" });

  const [products, setProducts]       = useState<Product[]>([]);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [loading, setLoading]         = useState(true);
  const [working, setWorking]         = useState(false);
  const [familyInput, setFamilyInput] = useState("");
  const [filterMode, setFilterMode]   = useState<"all" | "grouped" | "ungrouped">("all");
  const [collapsed, setCollapsed]     = useState<Set<string>>(new Set());
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    client
      .fetch<Product[]>(
        `*[_type=="catalogItem"] | order(familySlug asc, title asc) {
          _id, title, sku, familySlug, isFamilyRepresentative,
          "imgUrl": coalesce(coverImage.asset->url, imageUrl)
        }`
      )
      .then((d) => { setProducts(d ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [client]);

  useEffect(() => { load(); }, [load]);

  // ── Computed ─────────────────────────────────────────
  const filtered = products.filter((p) => {
    if (filterMode === "grouped")   return !!p.familySlug;
    if (filterMode === "ungrouped") return !p.familySlug;
    return true;
  });

  const familyMap = new Map<string, Product[]>();
  const ungrouped: Product[] = [];
  filtered.forEach((p) => {
    if (p.familySlug) {
      if (!familyMap.has(p.familySlug)) familyMap.set(p.familySlug, []);
      familyMap.get(p.familySlug)!.push(p);
    } else {
      ungrouped.push(p);
    }
  });
  const sortedFamilies = [...familyMap.entries()].sort(([a], [b]) => a.localeCompare(b));

  const countGrouped   = products.filter((p) => !!p.familySlug).length;
  const countUngrouped = products.filter((p) => !p.familySlug).length;

  // ── Selection ────────────────────────────────────────
  const toggle = (id: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const none = selected.size === 0 || working;
  const selOne = selected.size === 1 ? products.find((p) => p._id === [...selected][0]) : null;
  const canMarkPrincipal = !!selOne?.familySlug;

  // ── Actions ──────────────────────────────────────────
  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const assignFamily = async () => {
    const slug = slugify(familyInput);
    if (!slug || none) return;
    setWorking(true);
    try {
      const tx = client.transaction();
      [...selected].forEach((id) => tx.patch(id, { set: { familySlug: slug } }));
      await tx.commit();
      const count = selected.size;
      setProducts((prev) => prev.map((p) => selected.has(p._id) ? { ...p, familySlug: slug } : p));
      setSelected(new Set());
      showToast(`✅ ${count} producto${count !== 1 ? "s" : ""} asignados a "${slug}"`, true);
    } catch (e: any) {
      showToast(`❌ ${e?.message ?? "Error desconocido"}`, false);
    }
    setWorking(false);
  };

  const markPrincipal = async () => {
    if (!selOne?.familySlug) return;
    setWorking(true);
    try {
      const tx = client.transaction();
      products
        .filter((p) => p.familySlug === selOne.familySlug && p._id !== selOne._id)
        .forEach((p) => tx.patch(p._id, { set: { isFamilyRepresentative: false } }));
      tx.patch(selOne._id, { set: { isFamilyRepresentative: true } });
      await tx.commit();
      const family = selOne.familySlug;
      setProducts((prev) =>
        prev.map((p) =>
          p.familySlug === family ? { ...p, isFamilyRepresentative: p._id === selOne._id } : p
        )
      );
      setSelected(new Set());
      showToast(`✅ "${selOne.title}" es ahora el principal de "${family}"`, true);
    } catch (e: any) {
      showToast(`❌ ${e?.message ?? "Error desconocido"}`, false);
    }
    setWorking(false);
  };

  const removeFromFamily = async () => {
    if (none) return;
    setWorking(true);
    try {
      const tx = client.transaction();
      [...selected].forEach((id) =>
        tx.patch(id, { unset: ["familySlug", "isFamilyRepresentative"] })
      );
      await tx.commit();
      const count = selected.size;
      setProducts((prev) =>
        prev.map((p) => selected.has(p._id) ? { ...p, familySlug: undefined, isFamilyRepresentative: false } : p)
      );
      setSelected(new Set());
      showToast(`✅ ${count} producto${count !== 1 ? "s" : ""} quitados de su familia`, true);
    } catch (e: any) {
      showToast(`❌ ${e?.message ?? "Error desconocido"}`, false);
    }
    setWorking(false);
  };

  const toggleCollapse = (slug: string) =>
    setCollapsed((prev) => { const n = new Set(prev); n.has(slug) ? n.delete(slug) : n.add(slug); return n; });

  // ── Styles ───────────────────────────────────────────
  const wrap: React.CSSProperties    = { padding: "24px", fontFamily: "system-ui, sans-serif", height: "100%", overflowY: "auto" };
  const toolbar: React.CSSProperties = { display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "16px" };
  const btn = (bg: string, color = "#fff", off = false): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px",
    borderRadius: "6px", border: "none", fontSize: "13px", fontWeight: 600,
    cursor: off ? "not-allowed" : "pointer", background: bg, color, opacity: off ? 0.4 : 1,
  });
  const pill = (active: boolean, color: string): React.CSSProperties => ({
    padding: "6px 12px", borderRadius: "20px", border: "none", fontSize: "12px",
    fontWeight: 600, cursor: "pointer",
    background: active ? color : "rgba(0,0,0,.08)", color: active ? "#fff" : "#555",
  });
  const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid rgba(0,0,0,.08)", fontSize: "11px", textTransform: "uppercase" as const, opacity: 0.5, fontWeight: 600 };
  const td = (sel: boolean): React.CSSProperties => ({ textAlign: "left", padding: "7px 10px", borderBottom: "1px solid rgba(0,0,0,.06)", background: sel ? "rgba(66,117,255,.08)" : "transparent", verticalAlign: "middle" });
  const toastSt = (ok: boolean): React.CSSProperties => ({ position: "fixed", bottom: "24px", right: "24px", padding: "12px 20px", borderRadius: "8px", fontSize: "14px", fontWeight: 600, background: ok ? "#22c55e" : "#ef4444", color: "#fff", zIndex: 200 });
  const statCard: React.CSSProperties = { background: "#fff", border: "1px solid rgba(0,0,0,.1)", borderRadius: "8px", padding: "12px 20px", minWidth: "110px" };
  const fhdr: React.CSSProperties = { display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", background: "rgba(66,117,255,.05)", borderBottom: "1px solid rgba(66,117,255,.12)", borderTop: "2px solid rgba(66,117,255,.18)", cursor: "pointer", userSelect: "none" as const };

  return React.createElement("div", { style: wrap },

    // ── Stats ──────────────────────────────────────────
    React.createElement("div", { style: { display: "flex", gap: "14px", marginBottom: "20px", flexWrap: "wrap" } },
      [
        { label: "Familias",    val: familyMap.size,      color: "#4275ff" },
        { label: "Agrupados",   val: countGrouped,         color: "#16a34a" },
        { label: "Sin familia", val: countUngrouped,       color: "#f59e0b" },
        { label: "Total",       val: products.length,      color: "#6b7280" },
      ].map(({ label, val, color }) =>
        React.createElement("div", { key: label, style: statCard },
          React.createElement("div", { style: { fontSize: "26px", fontWeight: 800, color } }, String(val)),
          React.createElement("div", { style: { fontSize: "11px", opacity: 0.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" } }, label)
        )
      )
    ),

    // ── Toolbar ────────────────────────────────────────
    React.createElement("div", { style: toolbar },
      // Filter pills
      React.createElement("button", { onClick: () => setFilterMode("all"),       style: pill(filterMode === "all",       "#4275ff") }, `Todos (${products.length})`),
      React.createElement("button", { onClick: () => setFilterMode("grouped"),   style: pill(filterMode === "grouped",   "#16a34a") }, `Agrupados (${countGrouped})`),
      React.createElement("button", { onClick: () => setFilterMode("ungrouped"), style: pill(filterMode === "ungrouped", "#f59e0b") }, `Sin familia (${countUngrouped})`),

      React.createElement("span", { style: { flex: 1 } }),

      selected.size > 0 && React.createElement("span", { style: { background: "#4275ff", color: "#fff", borderRadius: "99px", padding: "2px 10px", fontSize: "12px", fontWeight: 700 } }, `${selected.size} sel.`),

      // Family slug input
      React.createElement("input", {
        type: "text",
        value: familyInput,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setFamilyInput(e.target.value),
        onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter") assignFamily(); },
        placeholder: "slug-de-familia",
        style: { padding: "7px 10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "13px", width: "180px" },
      }),
      React.createElement("button", { onClick: assignFamily, disabled: none || !familyInput.trim(), style: btn("#4275ff", "#fff", none || !familyInput.trim()) }, "🏷 Asignar"),
      React.createElement("button", { onClick: markPrincipal, disabled: !canMarkPrincipal || working, style: btn("#16a34a", "#fff", !canMarkPrincipal || working) }, "⭐ Principal"),
      React.createElement("button", { onClick: removeFromFamily, disabled: none, style: btn("rgba(0,0,0,.08)", "#333", none) }, "✕ Quitar"),
      React.createElement("button", { onClick: load, style: btn("rgba(0,0,0,.07)", "#333") }, "↻"),
    ),

    // ── Help tip ──────────────────────────────────────
    React.createElement("p", { style: { fontSize: "12px", opacity: 0.5, marginBottom: "14px", lineHeight: 1.6 } },
      "Selecciona productos → escribe un slug de familia → Asignar. Luego selecciona 1 solo y click en ⭐ Principal para definir cuál aparece en el catálogo."
    ),

    // ── Table ─────────────────────────────────────────
    loading
      ? React.createElement("div", { style: { textAlign: "center", padding: "60px", opacity: 0.4 } }, "Cargando…")
      : React.createElement("div", { style: { border: "1px solid rgba(0,0,0,.1)", borderRadius: "8px", overflow: "hidden" } },
          React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: "13px" } },
            React.createElement("thead", null,
              React.createElement("tr", null,
                React.createElement("th", { style: { ...th, width: "32px" } }),
                React.createElement("th", { style: { ...th, width: "48px" } }),
                React.createElement("th", { style: th }, "Producto"),
                React.createElement("th", { style: th }, "SKU"),
                React.createElement("th", { style: th }, "Familia"),
                React.createElement("th", { style: { ...th, width: "100px" } }, "Rol"),
              )
            ),
            React.createElement("tbody", null,

              // Families
              ...sortedFamilies.flatMap(([fSlug, fProds]) => {
                const isCol = collapsed.has(fSlug);
                const hasPrincipal = fProds.some((p) => p.isFamilyRepresentative);
                const rows: React.ReactElement[] = [
                  React.createElement("tr", { key: `hdr-${fSlug}` },
                    React.createElement("td", { colSpan: 6, style: { padding: 0 } },
                      React.createElement("div", { style: fhdr, onClick: () => toggleCollapse(fSlug) },
                        React.createElement("span", { style: { fontSize: "11px", opacity: 0.6 } }, isCol ? "▶" : "▼"),
                        React.createElement("strong", { style: { fontSize: "13px" } }, `📦 ${fSlug}`),
                        React.createElement("span", { style: { background: "#4275ff", color: "#fff", borderRadius: "99px", padding: "1px 8px", fontSize: "11px", fontWeight: 700 } }, `${fProds.length}`),
                        !hasPrincipal && React.createElement("span", { style: { background: "#f59e0b", color: "#fff", borderRadius: "4px", padding: "1px 6px", fontSize: "10px", fontWeight: 700 } }, "⚠ sin principal"),
                      )
                    )
                  ),
                ];
                if (!isCol) {
                  fProds.forEach((p) => {
                    const sel = selected.has(p._id);
                    rows.push(
                      React.createElement("tr", { key: p._id },
                        React.createElement("td", { style: td(sel) }, React.createElement("input", { type: "checkbox", checked: sel, onChange: () => toggle(p._id), style: { width: "15px", height: "15px", accentColor: "#4275ff" } })),
                        React.createElement("td", { style: td(sel) },
                          p.imgUrl
                            ? React.createElement("img", { src: `${p.imgUrl}?w=80&h=80&fit=crop&auto=format`, alt: p.title, style: { width: "38px", height: "38px", objectFit: "contain", background: "#f3f4f6", display: "block" } })
                            : React.createElement("div", { style: { width: "38px", height: "38px", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px" } }, "📦")
                        ),
                        React.createElement("td", { style: { ...td(sel), fontWeight: 600, maxWidth: "260px" } }, React.createElement("span", { style: { display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, p.title ?? "—")),
                        React.createElement("td", { style: { ...td(sel), color: "#6b7280", fontFamily: "monospace", fontSize: "12px" } }, p.sku ?? "—"),
                        React.createElement("td", { style: { ...td(sel), color: "#4275ff", fontSize: "12px", fontFamily: "monospace" } }, p.familySlug ?? "—"),
                        React.createElement("td", { style: td(sel) },
                          p.isFamilyRepresentative
                            ? React.createElement("span", { style: { background: "#16a34a", color: "#fff", borderRadius: "4px", padding: "2px 7px", fontSize: "11px", fontWeight: 700 } }, "⭐ Principal")
                            : React.createElement("span", { style: { fontSize: "11px", opacity: 0.35 } }, "variante")
                        ),
                      )
                    );
                  });
                }
                return rows;
              }),

              // Ungrouped
              ungrouped.length > 0 && React.createElement("tr", { key: "hdr-ung" },
                React.createElement("td", { colSpan: 6, style: { padding: "6px 10px", background: "rgba(0,0,0,.03)", borderBottom: "1px solid rgba(0,0,0,.06)", fontSize: "11px", fontWeight: 700, opacity: 0.45, textTransform: "uppercase", letterSpacing: ".06em" } },
                  `Sin familia — ${ungrouped.length} producto${ungrouped.length !== 1 ? "s" : ""}`
                )
              ),
              ...ungrouped.map((p) => {
                const sel = selected.has(p._id);
                return React.createElement("tr", { key: p._id },
                  React.createElement("td", { style: td(sel) }, React.createElement("input", { type: "checkbox", checked: sel, onChange: () => toggle(p._id), style: { width: "15px", height: "15px", accentColor: "#4275ff" } })),
                  React.createElement("td", { style: td(sel) },
                    p.imgUrl
                      ? React.createElement("img", { src: `${p.imgUrl}?w=80&h=80&fit=crop&auto=format`, alt: p.title, style: { width: "38px", height: "38px", objectFit: "contain", background: "#f3f4f6", display: "block" } })
                      : React.createElement("div", { style: { width: "38px", height: "38px", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px" } }, "📦")
                  ),
                  React.createElement("td", { style: { ...td(sel), fontWeight: 600, maxWidth: "260px" } }, React.createElement("span", { style: { display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, p.title ?? "—")),
                  React.createElement("td", { style: { ...td(sel), color: "#6b7280", fontFamily: "monospace", fontSize: "12px" } }, p.sku ?? "—"),
                  React.createElement("td", { style: td(sel) }, React.createElement("span", { style: { opacity: 0.25 } }, "—")),
                  React.createElement("td", { style: td(sel) }),
                );
              })
            )
          )
        ),

    toast && React.createElement("div", { style: toastSt(toast.ok) }, toast.msg)
  );
}
