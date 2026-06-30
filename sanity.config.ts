import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemas";
import { ImporterPanel } from "./studio-components/ImporterPanel";
import { ProductManagerPanel } from "./studio-components/ProductManagerPanel";
import { OrderManagerPanel } from "./schemas/documents/OrderManagerPanel";
import { DuplicatePageAction } from "./studio-components/DuplicatePageAction";
import { FamilyManagerPanel } from "./studio-components/FamilyManagerPanel";

export default defineConfig({
  projectId: "a7b3q6z9",
  dataset: "production",
  title: "La Bodega del Instalador",
  plugins: [
    structureTool({
      structure: async (S, context) => {
        const client = context.getClient({ apiVersion: "2025-01-01" });
        const categories: { _id: string; title: string }[] = await client.fetch(
          `*[_type == "productCategory"] | order(order asc) { _id, title }`
        );
        return S.list()
          .title("Panel")
          .items([
            // ── Configuración ──────────────────────────
            S.listItem()
              .title("⚙️ Configuración del sitio")
              .id("configuracion")
              .child(
                S.list()
                  .title("Configuración del sitio")
                  .items([
                    S.listItem()
                      .title("🌐 General")
                      .child(S.document().schemaType("siteSettingsGeneral").documentId("siteSettingsGeneral")),
                    S.listItem()
                      .title("🧭 Menú")
                      .child(S.document().schemaType("siteSettingsMenu").documentId("siteSettingsMenu")),
                    S.listItem()
                      .title("🔝 Header")
                      .child(S.document().schemaType("siteSettingsHeader").documentId("siteSettingsHeader")),
                    S.listItem()
                      .title("🔻 Footer")
                      .child(S.document().schemaType("siteSettingsFooter").documentId("siteSettingsFooter")),
                    S.listItem()
                      .title("🔍 SEO")
                      .child(S.document().schemaType("siteSettingsSeo").documentId("siteSettingsSeo")),
                    S.listItem()
                      .title("📊 Códigos")
                      .child(S.document().schemaType("siteSettingsCodes").documentId("siteSettingsCodes")),
                  ])
              ),

            S.divider(),

            // ── Secciones guardadas ────────────────────
            S.listItem()
              .title("⭐ Secciones guardadas")
              .child(S.documentTypeList("sharedSection").title("Secciones guardadas")),

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
                          .apiVersion("2025-01-01")
                          .filter('_type == "page" && pageType == "home"')
                      ),
                    S.listItem()
                      .title("📋 Servicios / Landings")
                      .child(
                        S.documentList()
                          .title("Servicios y Landings")
                          .apiVersion("2025-01-01")
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
                      .title("💱 Precios y moneda")
                      .child(S.document().schemaType("siteSettingsShop").documentId("siteSettingsShop")),
                    S.listItem()
                      .title("💳 Métodos de pago")
                      .child(S.document().schemaType("siteSettingsPayment").documentId("siteSettingsPayment")),
                    S.listItem()
                      .title("🏪 Sucursales")
                      .child(S.documentTypeList("branch").title("Sucursales")),

                    S.listItem()
                      .title("📦 Productos")
                      .child(
                        S.list()
                          .title("Productos")
                          .items([
                            S.listItem()
                              .title("📋 Lista de productos")
                              .child(
                                S.list()
                                  .title("Lista de productos")
                                  .items([
                                    S.listItem()
                                      .title("Todos")
                                      .child(S.documentTypeList("catalogItem").title("Todos los productos")),
                                    S.divider(),
                                    S.listItem()
                                      .title("✅ Públicos")
                                      .child(
                                        S.documentList()
                                          .title("Públicos")
                                          .apiVersion("2025-01-01")
                                          .filter('_type == "catalogItem" && published != false')
                                      ),
                                    S.listItem()
                                      .title("👁 Ocultos")
                                      .child(
                                        S.documentList()
                                          .title("Ocultos")
                                          .apiVersion("2025-01-01")
                                          .filter('_type == "catalogItem" && published == false')
                                      ),
                                    S.divider(),
                                    S.listItem()
                                      .title("✔️ Publicados (Sanity)")
                                      .child(
                                        S.documentList()
                                          .title("Publicados en Sanity")
                                          .apiVersion("2025-01-01")
                                          .filter('_type == "catalogItem" && !(_id in path("drafts.**"))')
                                      ),
                                    S.listItem()
                                      .title("📝 Borradores (Sanity)")
                                      .child(
                                        S.documentList()
                                          .title("Borradores en Sanity")
                                          .apiVersion("2025-01-01")
                                          .filter('_type == "catalogItem" && _id in path("drafts.**")')
                                      ),
                                    S.divider(),
                                    S.listItem()
                                      .title("🗂 Por categoría")
                                      .child(
                                        S.list()
                                          .title("Por categoría")
                                          .items(
                                            categories.map((cat) =>
                                              S.listItem()
                                                .title(cat.title)
                                                .id(cat._id)
                                                .child(
                                                  S.documentList()
                                                    .title(cat.title)
                                                    .apiVersion("2025-01-01")
                                                    .filter('_type == "catalogItem" && category._ref == $categoryId')
                                                    .params({ categoryId: cat._id })
                                                )
                                            )
                                          )
                                      ),
                                  ])
                              ),
                            S.listItem()
                              .title("🗂 Seleccionar y eliminar")
                              .child(
                                S.component()
                                  .title("Gestionar productos")
                                  .component(ProductManagerPanel)
                              ),
                            S.listItem()
                              .title("🏷 Familias de producto")
                              .child(
                                S.component()
                                  .title("Familias de producto")
                                  .component(FamilyManagerPanel)
                              ),
                          ])
                      ),
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
                              .title("📋 Todos los pedidos")
                              .child(
                                S.documentList()
                                  .title("Pedidos Actuales")
                                  .apiVersion("2025-01-01")
                                  .filter('_type == "order" && !(status in ["shipped", "delivered", "deleted"])')
                              ),
                            S.listItem()
                              .title("⚙️ Gestionar pedidos en bloque")
                              .child(
                                S.component()
                                  .title("Gestionar Pedidos")
                                  .component(OrderManagerPanel)
                              ),
                            S.divider(),
                            S.listItem()
                              .title("⏳ Pendientes")
                              .child(
                                S.documentList()
                                  .title("Pendientes")
                                  .apiVersion("2025-01-01")
                                  .filter('_type == "order" && status == "pending"')
                              ),
                            S.listItem()
                              .title("✅ Confirmados")
                              .child(
                                S.documentList()
                                  .title("Confirmados")
                                  .apiVersion("2025-01-01")
                                  .filter('_type == "order" && status == "confirmed"')
                              ),
                            S.listItem()
                              .title("📦 En preparación")
                              .child(
                                S.documentList()
                                  .title("En preparación")
                                  .apiVersion("2025-01-01")
                                  .filter('_type == "order" && status == "processing"')
                              ),
                            S.listItem()
                              .title("🚚 Enviados")
                              .child(
                                S.documentList()
                                  .title("Enviados")
                                  .apiVersion("2025-01-01")
                                  .filter('_type == "order" && status == "shipped"')
                              ),
                            S.listItem()
                              .title("🏠 Entregados")
                              .child(
                                S.documentList()
                                  .title("Entregados")
                                  .apiVersion("2025-01-01")
                                  .filter('_type == "order" && status == "delivered"')
                              ),
                            S.listItem()
                              .title("❌ Cancelados")
                              .child(
                                S.documentList()
                                  .title("Cancelados")
                                  .apiVersion("2025-01-01")
                                  .filter('_type == "order" && status == "cancelled"')
                              ),
                            S.divider(),
                            S.listItem()
                              .title("🗑️ Eliminados")
                              .child(
                                S.documentList()
                                  .title("Eliminados")
                                  .apiVersion("2025-01-01")
                                  .filter('_type == "order" && status == "deleted"')
                              ),
                          ])
                      ),
                    S.listItem()
                      .title("🔥 Chatbot IA — Sparkly Fire")
                      .child(S.document().schemaType("chatbotProfile").documentId("chatbotProfile")),
                    S.listItem()
                      .title("📩 Envíos de formulario")
                      .child(S.documentTypeList("formSubmission").title("Envíos")),
                    S.listItem()
                      .title("📥 Importar productos (Excel)")
                      .child(
                        S.component()
                          .title("Importar desde Excel")
                          .component(ImporterPanel)
                      ),
                  ])
              ),
          ]);
      },
    }),
    visionTool(),
  ],
  document: {
    actions: (prev, context) =>
      context.schemaType === "page"
        ? [...prev, DuplicatePageAction]
        : prev,
  },
  schema: {
    types: schemaTypes,
  },
});
