export async function GET() {
  const urls = [
    "https://TU-DOMINIO.com/",
    "https://TU-DOMINIO.com/seo",
    "https://TU-DOMINIO.com/google-ads",
    "https://TU-DOMINIO.com/cro",
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `<url>
  <loc>${url}</loc>
  <changefreq>weekly</changefreq>
  <priority>${url.endsWith("/") ? "1.0" : "0.8"}</priority>
</url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}