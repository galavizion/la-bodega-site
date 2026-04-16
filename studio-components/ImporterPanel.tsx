import React from "react";

export function ImporterPanel() {
  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: "16px",
        padding: "40px",
        textAlign: "center" as const,
      },
    },
    React.createElement("div", { style: { fontSize: "48px" } }, "📥"),
    React.createElement("h2", { style: { margin: 0, fontSize: "20px" } }, "Importar productos desde Excel"),
    React.createElement(
      "p",
      { style: { margin: 0, opacity: 0.6, maxWidth: "400px", lineHeight: 1.6 } },
      "Carga un archivo ",
      React.createElement("strong", null, ".xlsx / .xls / .csv"),
      " para crear o actualizar productos en Sanity."
    ),
    React.createElement(
      "a",
      {
        href: "/admin/importar",
        target: "_blank",
        rel: "noopener noreferrer",
        style: {
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
        },
      },
      "Abrir importador →"
    )
  );
}
