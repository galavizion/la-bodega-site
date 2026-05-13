/**
 * Importador de WordPress → Sanity
 *
 * Uso:
 *   SANITY_TOKEN=skXXXXX node scripts/import-wordpress.mjs wordpress-export.xml
 *
 * El token lo obtienes en:
 *   https://sanity.io/manage → tu proyecto → API → Tokens → Add API token (Editor)
 *
 * El XML lo exportas desde WordPress:
 *   Herramientas → Exportar → Todas las entradas → Descargar
 */

import { readFileSync } from "fs";
import { createClient } from "@sanity/client";
import { randomUUID } from "crypto";

// ── Config ────────────────────────────────────────────────────────────────────
const PROJECT_ID = "a7b3q6z9";
const DATASET    = "production";
const TOKEN      = process.env.SANITY_TOKEN;

if (!TOKEN) {
  console.error("❌ Falta SANITY_TOKEN. Ejecútalo así:");
  console.error("   SANITY_TOKEN=skXXXXX node scripts/import-wordpress.mjs archivo.xml");
  process.exit(1);
}

const xmlFile = process.argv[2];
if (!xmlFile) {
  console.error("❌ Falta el archivo XML. Uso: node scripts/import-wordpress.mjs wordpress.xml");
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset:   DATASET,
  token:     TOKEN,
  apiVersion: "2025-01-01",
  useCdn: false,
});

// ── Helpers XML ───────────────────────────────────────────────────────────────
function extractTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!m) return "";
  const val = m[1].trim();
  // Strip CDATA wrapper if present
  const cdata = val.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return cdata ? cdata[1].trim() : val;
}

function extractCDATA(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

function extractAll(xml, tag) {
  const results = [];
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  let m;
  while ((m = re.exec(xml)) !== null) results.push(m[1].trim());
  return results;
}

function htmlEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8230;/g, "…")
    .replace(/&nbsp;/g, " ");
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function key() {
  return randomUUID().replace(/-/g, "").slice(0, 12);
}

// ── HTML → Portable Text ──────────────────────────────────────────────────────
function htmlToBlocks(html) {
  if (!html) return [];
  const blocks = [];

  // Reemplaza <br> con saltos de línea y normaliza
  html = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  // Extraer bloques de nivel (headings, párrafos, listas)
  const blockRe = /<(h[1-6]|p|ul|ol|blockquote|pre)(?: [^>]*)?>([\\s\\S]*?)<\/\1>/gi;
  let lastIndex = 0;
  let match;

  // Texto suelto antes del primer bloque
  function addTextBlock(text, style = "normal") {
    text = htmlEntities(stripTags(text)).trim();
    if (!text) return;
    blocks.push({
      _type: "block",
      _key: key(),
      style,
      children: [{ _type: "span", _key: key(), text, marks: [] }],
      markDefs: [],
    });
  }

  // Separa por tags de bloque conocidos
  const sections = html.split(/(<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>|<p[^>]*>[\s\S]*?<\/p>|<ul[^>]*>[\s\S]*?<\/ul>|<ol[^>]*>[\s\S]*?<\/ol>|<blockquote[^>]*>[\s\S]*?<\/blockquote>)/gi);

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    // Heading
    const hMatch = trimmed.match(/^<(h[1-6])[^>]*>([\s\S]*?)<\/h[1-6]>$/i);
    if (hMatch) {
      addTextBlock(hMatch[2], hMatch[1].toLowerCase());
      continue;
    }

    // Párrafo
    const pMatch = trimmed.match(/^<p[^>]*>([\s\S]*?)<\/p>$/i);
    if (pMatch) {
      addTextBlock(pMatch[1], "normal");
      continue;
    }

    // Blockquote
    const bqMatch = trimmed.match(/^<blockquote[^>]*>([\s\S]*?)<\/blockquote>$/i);
    if (bqMatch) {
      addTextBlock(bqMatch[1], "blockquote");
      continue;
    }

    // Lista
    const ulMatch = trimmed.match(/^<(ul|ol)[^>]*>([\s\S]*?)<\/(?:ul|ol)>$/i);
    if (ulMatch) {
      const listStyle = ulMatch[1].toLowerCase() === "ol" ? "number" : "bullet";
      const items = [...ulMatch[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
      for (const li of items) {
        const text = htmlEntities(stripTags(li[1])).trim();
        if (!text) continue;
        blocks.push({
          _type: "block",
          _key: key(),
          style: "normal",
          listItem: listStyle,
          level: 1,
          children: [{ _type: "span", _key: key(), text, marks: [] }],
          markDefs: [],
        });
      }
      continue;
    }

    // Texto plano sin tags de bloque
    const plain = htmlEntities(stripTags(trimmed)).trim();
    if (plain) {
      blocks.push({
        _type: "block",
        _key: key(),
        style: "normal",
        children: [{ _type: "span", _key: key(), text: plain, marks: [] }],
        markDefs: [],
      });
    }
  }

  return blocks;
}

// ── Parsear categorías de un <item> ───────────────────────────────────────────
function parseCategories(itemXml) {
  const cats = [];
  const re = /<category domain="category"[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/category>/gi;
  let m;
  while ((m = re.exec(itemXml)) !== null) cats.push(m[1].trim());
  return cats;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`📂 Leyendo ${xmlFile}…`);
  const xml = readFileSync(xmlFile, "utf-8");

  // Extraer items
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  const items = [];
  let m;
  while ((m = itemRe.exec(xml)) !== null) items.push(m[1]);

  // Filtrar solo posts publicados
  const posts = items.filter((item) => {
    const postType = extractTag(item, "wp:post_type");
    const status   = extractTag(item, "wp:status");
    return postType === "post" && status === "publish";
  });

  console.log(`✅ ${posts.length} artículos publicados encontrados`);

  // ── Categorías: crear primero en Sanity ────────────────────────────────────
  const categoryMap = {}; // nombre → _id en Sanity

  const allCatNames = new Set();
  for (const item of posts) {
    for (const cat of parseCategories(item)) allCatNames.add(cat);
  }

  console.log(`📁 Creando ${allCatNames.size} categorías…`);
  for (const catName of allCatNames) {
    const slug = catName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const doc = {
      _type: "category",
      title: catName,
      slug: { _type: "slug", current: slug },
    };
    try {
      // Buscar si ya existe
      const existing = await client.fetch(
        `*[_type=="category" && slug.current==$slug][0]._id`,
        { slug }
      );
      if (existing) {
        categoryMap[catName] = existing;
      } else {
        const created = await client.create(doc);
        categoryMap[catName] = created._id;
        console.log(`  ✔ Categoría: ${catName}`);
      }
    } catch (e) {
      console.warn(`  ⚠ No se pudo crear categoría "${catName}": ${e.message}`);
    }
  }

  // ── Importar posts ─────────────────────────────────────────────────────────
  let created = 0, skipped = 0, errors = 0;

  for (const item of posts) {
    const title   = htmlEntities(extractTag(item, "title"));
    const slug    = extractTag(item, "wp:post_name") || title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const content = extractCDATA(item, "content:encoded");
    const excerpt = extractCDATA(item, "excerpt:encoded");
    const dateStr = extractTag(item, "wp:post_date");

    if (!title || !slug) { skipped++; continue; }

    // Verificar si ya existe
    try {
      const exists = await client.fetch(
        `*[_type=="post" && slug.current==$slug][0]._id`,
        { slug }
      );
      if (exists) {
        console.log(`  ⏭ Ya existe: ${slug}`);
        skipped++;
        continue;
      }
    } catch (_) {}

    // Categorías del post
    const catNames = parseCategories(item);
    const categoriesRefs = catNames
      .filter((n) => categoryMap[n])
      .map((n) => ({ _type: "reference", _ref: categoryMap[n], _key: key() }));

    const doc = {
      _type: "post",
      title,
      slug: { _type: "slug", current: slug },
      excerpt: htmlEntities(stripTags(excerpt)).slice(0, 300) || undefined,
      publishedAt: dateStr ? new Date(dateStr).toISOString() : undefined,
      body: htmlToBlocks(content),
      categories: categoriesRefs.length ? categoriesRefs : undefined,
    };

    try {
      await client.create(doc);
      console.log(`  ✔ ${title}`);
      created++;
    } catch (e) {
      console.error(`  ❌ Error en "${title}": ${e.message}`);
      errors++;
    }
  }

  console.log(`\n🎉 Listo: ${created} importados, ${skipped} omitidos, ${errors} errores`);
}

main().catch((e) => { console.error(e); process.exit(1); });
