import type { APIRoute } from "astro";
import OpenAI from "openai";
import { createClient } from "@sanity/client";

export const prerender = false;

const sanity = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? "a7b3q6z9",
  dataset:   import.meta.env.PUBLIC_SANITY_DATASET   ?? "production",
  apiVersion: "2025-01-01",
  useCdn: true,
});

const TONE_MAP: Record<string, string> = {
  formal:    "Responde de manera profesional y formal.",
  friendly:  "Responde de manera amigable y cercana, usando un tono cálido.",
  technical: "Responde de manera técnica y precisa, con terminología especializada.",
};

function buildSystemPrompt(profile: any): string {
  const tone = TONE_MAP[profile?.tone ?? "friendly"];
  const faqBlock = (profile?.faq ?? []).map((f: any) =>
    `P: ${f.question}\nR: ${f.answer}`
  ).join("\n\n");

  return `Eres ${profile?.name ?? "Sparkly Fire"}, el asistente virtual de La Bodega del Instalador.
${tone}

## Sobre el negocio
${profile?.businessDescription ?? "Empresa especializada en sistemas contra incendios."}

## Productos y servicios
${(profile?.services ?? []).join(", ") || "Sistemas contra incendios, tuberías, válvulas, accesorios."}

## Información adicional
${profile?.extraContext ?? ""}

${faqBlock ? `## Preguntas frecuentes\n${faqBlock}` : ""}

## Reglas importantes
- Responde siempre en español.
- Si no sabes algo con certeza, dilo honestamente.
- Si el usuario quiere hablar con una persona usa la herramienta whatsapp_fallback.
- Sé conciso: respuestas de máximo 3 párrafos o usa listas cuando sea útil.
- Si te preguntan por un producto específico, usa search_products para buscarlo.
- Si te preguntan por servicios, información de la empresa, franquicias, guías, o cualquier tema que no sea un producto directo, usa search_content para buscarlo en el sitio.
- Cuando el usuario quiera cotizar o agregar al carrito, usa add_to_cart con los productos encontrados.`;
}

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_products",
      description: "Busca productos en el catálogo por nombre, categoría o descripción.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Término de búsqueda, ej: 'codo 2 pulgadas' o 'válvula mariposa'" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_to_cart",
      description: "Agrega uno o más productos al carrito del cliente.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id:    { type: "string", description: "ID del producto (_id de Sanity)" },
                title: { type: "string" },
                slug:  { type: "string" },
                price: { type: "number", description: "Precio en MXN" },
                qty:   { type: "number", description: "Cantidad" },
                image: { type: "string" },
              },
              required: ["id", "title", "slug", "price", "qty"],
            },
          },
        },
        required: ["items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_content",
      description: "Busca en las páginas, landings, blog y contenido general del sitio. Úsalo para preguntas sobre servicios, franquicias, guías, la empresa, apoyo social, o cualquier información que no sea un producto del catálogo.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Término de búsqueda, ej: 'franquicia' o 'instalación de rociadores'" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "whatsapp_fallback",
      description: "Proporciona el enlace de WhatsApp para que el usuario hable con un agente humano.",
      parameters: { type: "object", properties: {} },
    },
  },
];

async function runSearchContent(query: string): Promise<string> {
  const q = `*${query}*`;

  const [pages, posts] = await Promise.all([
    sanity.fetch<any[]>(
      `*[_type == "page" && (
        title match $q ||
        pt::text(sections[].content) match $q ||
        pt::text(sections[].body) match $q ||
        seo.description match $q
      )][0...5]{
        title,
        "slug": slug.current,
        "pageType": pageType,
        "excerpt": seo.description,
        "text": pt::text(sections[0].content)
      }`,
      { q }
    ).catch(() => [] as any[]),

    sanity.fetch<any[]>(
      `*[_type == "post" && (
        title match $q ||
        pt::text(body) match $q ||
        excerpt match $q
      )][0...5]{
        title,
        "slug": slug.current,
        excerpt,
        "text": pt::text(body[0..2])
      }`,
      { q }
    ).catch(() => [] as any[]),
  ]);

  const results: string[] = [];

  pages.forEach(p => {
    const url = `/${p.slug ?? ""}`;
    const snippet = (p.excerpt || p.text || "").slice(0, 200);
    results.push(`**${p.title}** (${url})\n${snippet}`);
  });

  posts.forEach(p => {
    const url = `/blog/${p.slug ?? ""}`;
    const snippet = (p.excerpt || p.text || "").slice(0, 200);
    results.push(`**${p.title}** (${url})\n${snippet}`);
  });

  if (!results.length) return "No encontré contenido relevante en el sitio para esa búsqueda.";
  return results.join("\n\n---\n\n");
}

async function runSearchProducts(query: string, markupFactor: number): Promise<string> {
  const results = await sanity.fetch<any[]>(
    `*[_type == "catalogItem" && published == true && (
      title match $q || excerpt match $q || pt::text(body) match $q
    )][0...6]{
      _id, title, "slug": slug.current, price, priceLabel,
      "imageUrl": coalesce(mainImage.asset->url, imageUrl),
      "variantPrice": variants[0].price
    }`,
    { q: `*${query}*` }
  ).catch(() => [] as any[]);

  if (!results.length) return "No encontré productos que coincidan con esa búsqueda.";

  return results.map(p => {
    const raw = p.price ?? p.variantPrice;
    const priceStr = raw != null
      ? `$${(raw * markupFactor).toLocaleString("es-MX", { maximumFractionDigits: 2 })} MXN`
      : p.priceLabel || "Cotización";
    return `- **${p.title}** | Precio: ${priceStr} | slug: ${p.slug} | id: ${p._id}`;
  }).join("\n");
}

export const POST: APIRoute = async ({ request }) => {
  const key = import.meta.env.OPENAI_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY no configurada" }), { status: 500 });
  }

  let body: { messages?: any[]; markupFactor?: number };
  try { body = await request.json(); } catch { return new Response("Bad request", { status: 400 }); }

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = body.messages ?? [];
  const markupFactor = body.markupFactor ?? 1.265;

  // Cargar perfil del bot
  const profile = await sanity.fetch(`*[_type == "chatbotProfile"][0]`).catch(() => null);
  const whatsappFallback = profile?.whatsappFallback ?? "";
  const enableCart   = profile?.enableCart   !== false;
  const enableSearch = profile?.enableSearch !== false;

  const activeTools = tools.filter(t => {
    const name = t.type === "function" ? t.function.name : "";
    if (name === "add_to_cart"    && !enableCart)   return false;
    if (name === "search_products" && !enableSearch) return false;
    return true;
  });

  const openai = new OpenAI({ apiKey: key });

  const systemMsg: OpenAI.Chat.Completions.ChatCompletionMessageParam = {
    role: "system",
    content: buildSystemPrompt(profile),
  };

  const allMessages = [systemMsg, ...messages];

  // Agentic loop: hasta 3 rondas de tool calls
  let cartActions: any[] = [];

  for (let round = 0; round < 3; round++) {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: allMessages,
      tools: activeTools,
      tool_choice: "auto",
      max_tokens: 600,
      temperature: 0.7,
    });

    const choice = completion.choices[0];
    const msg = choice.message;
    allMessages.push(msg as any);

    if (choice.finish_reason !== "tool_calls" || !msg.tool_calls?.length) {
      // Respuesta final
      return new Response(
        JSON.stringify({
          content: msg.content ?? "",
          cartActions,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Ejecutar tool calls
    for (const tc of msg.tool_calls) {
      if (tc.type !== "function") continue;
      let result = "";
      const fnName = tc.function.name;
      const args = JSON.parse(tc.function.arguments || "{}");

      if (fnName === "search_products") {
        result = await runSearchProducts(args.query, markupFactor);
      } else if (fnName === "search_content") {
        result = await runSearchContent(args.query);
      } else if (fnName === "add_to_cart") {
        cartActions = args.items ?? [];
        result = `Listo, voy a agregar ${cartActions.length} producto(s) al carrito.`;
      } else if (fnName === "whatsapp_fallback") {
        const num = whatsappFallback.replace(/\D/g, "");
        result = num
          ? `Número de WhatsApp: https://wa.me/${num}`
          : "Por favor contáctanos directamente para atención personalizada.";
      }

      allMessages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: result,
      });
    }
  }

  return new Response(JSON.stringify({ content: "No pude completar la solicitud.", cartActions: [] }), {
    headers: { "Content-Type": "application/json" },
  });
};
