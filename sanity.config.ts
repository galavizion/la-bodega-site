import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemas";

export default defineConfig({
  projectId: "a7b3q6z9",
  dataset: "production",
  title: "La Bodega del Instalador",
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Contenido")
          .items([
            S.listItem()
              .title("Configuración del sitio")
              .id("siteSettings")
              .child(
                S.document()
                  .schemaType("siteSettings")
                  .documentId("siteSettings")
              ),
            S.divider(),
            S.documentTypeListItem("page").title("Páginas"),
            S.documentTypeListItem("post").title("Artículos (Blog)"),
            S.documentTypeListItem("catalogItem").title("Catálogo"),
            S.divider(),
            S.documentTypeListItem("author").title("Autores"),
            S.documentTypeListItem("category").title("Categorías"),
          ]),
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
});
