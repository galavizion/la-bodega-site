import type {} from "react";

export function ImporterPanel() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: "16px",
        padding: "40px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "48px" }}>📥</div>
      <h2 style={{ margin: 0, fontSize: "20px" }}>Importar productos desde Excel</h2>
      <p style={{ margin: 0, opacity: 0.6, maxWidth: "400px", lineHeight: 1.6 }}>
        Carga un archivo <strong>.xlsx / .xls / .csv</strong> para crear o actualizar
        productos en Sanity. Abre la herramienta de importación en una nueva pestaña.
      </p>
      <a
        href="/admin/importar/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 24px",
          borderRadius: "8px",
          background: "#4275ff",
          color: "#fff",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: "15px",
        }}
      >
        Abrir importador →
      </a>
    </div>
  );
}
