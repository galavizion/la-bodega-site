import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params }) => {
  const { code } = params;

  if (!code || !/^\d{5}$/.test(code)) {
    return new Response(JSON.stringify({ error: 'Código postal inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = import.meta.env.COPOMEX_TOKEN ?? 'testtest';

  try {
    const res = await fetch(
      `https://api.copomex.com/query/info_cp/${code}?token=${token}`,
      { next: { revalidate: 86400 } } as RequestInit
    );

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Error al consultar Copomex' }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();

    // Copomex returns { response: { ... } } or { error: true, error_message: "..." }
    if (data.error) {
      return new Response(
        JSON.stringify({ error: data.error_message ?? 'Código postal no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Copomex puede devolver un array de { error, response: {...} } o un solo objeto
    const raw = data.response ?? data;
    const items: any[] = Array.isArray(raw) ? raw : [raw];

    // Cada elemento puede tener sus datos directamente o dentro de .response
    const normalized = items.map((r: any) => r?.response ?? r);

    const colonias = normalized
      .map((r: any) => r?.asentamiento ?? r?.d_asenta ?? null)
      .filter(Boolean);

    const first = normalized[0] ?? {};

    return new Response(
      JSON.stringify({
        colonias,
        municipio: first.municipio ?? first.D_mnpio ?? "",
        estado:    first.estado    ?? first.d_estado ?? "",
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400',
        },
      }
    );
  } catch {
    return new Response(JSON.stringify({ error: 'Error de conexión con Copomex' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
