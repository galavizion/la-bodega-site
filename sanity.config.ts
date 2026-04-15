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
          .title("Panel")
          .items([
            // ── Configuración ──────────────────────────
            S.listItem()
              .title("⚙️ Configuración del sitio")
              .id("siteSettings")
              .child(
                S.document()
                  .schemaType("siteSettings")
                  .documentId("siteSettings")
              ),

            S.divider(),

            // ── Páginas ────────────────────────────────
            S.listItem()
              .title("📄 Páginas")
              .child(
                S.list()
                  .title("Páginas")
                  .items([
                    S.listItem()
                      .title("🏠 Home")
                      .child(
                        S.documentList()
                          .title("Home")
                          .filter('_type == "page" && pageType == "home"')
                      ),
                    S.listItem()
                      .title("📋 Servicios / Landings")
                      .child(
                        S.documentList()
                          .title("Servicios y Landings")
                          .filter('_type == "page" && pageType in ["service","landing"]')
                      ),
                    S.listItem()
                      .title("➕ Todas las páginas")
                      .child(S.documentTypeList("page").title("Páginas")),
                  ])
              ),

            // ── Blog ───────────────────────────────────
            S.listItem()
              .title("✍️ Blog")
              .child(
                S.list()
                  .title("Blog")
                  .items([
                    S.documentTypeListItem("post").title("Artículos"),
                    S.documentTypeListItem("author").title("Autores"),
                    S.documentTypeListItem("category").title("Categorías"),
                  ])
              ),

            S.divider(),

            // ── Tienda ─────────────────────────────────
            S.listItem()
              .title("🛒 Tienda")
              .child(
                S.list()
                  .title("Tienda")
                  .items([
                    S.listItem()
                      .title("📦 Productos")
                      .child(S.documentTypeList("catalogItem").title("Productos")),
                    S.listItem()
                      .title("🏷️ Categorías de producto")
                      .child(S.documentTypeList("productCategory").title("Categorías")),
                    S.listItem()
                      .title("🧾 Pedidos")
                      .child(
                        S.list()
                          .title("Pedidos")
                          .items([
                            S.listItem()
                              .title("⏳ Pendientes")
                              .child(
                                S.documentList()
                                  .title("Pendientes")
                                  .filter('_type == "order" && status == "pending"')
                              ),
                            S.listItem()
                              .title("✅ Confirmados")
                              .child(
                                S.documentList()
                                  .title("Confirmados")
                                  .filter('_type == "order" && status == "confirmed"')
                              ),
                            S.listItem()
                              .title("🚚 Enviados")
                              .child(
                                S.documentList()
                                  .title("Enviados")
                                  .filter('_type == "order" && status == "shipped"')
                              ),
                            S.listItem()
                              .title("📋 Todos los pedidos")
                              .child(S.documentTypeList("order").title("Todos los pedidos")),
                          ])
                      ),
                    S.listItem()
                      .title("📥 Importar productos (Excel)")
                      .child(
                        S.component()
                          .title("Importar desde Excel")
                          .component(() => null) // placeholder — se maneja en /admin/importar
                      ),
                  ])
              ),
          ]),
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
});
