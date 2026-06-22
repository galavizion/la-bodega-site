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

    const info = data.response ?? data;
    const colonias: string[] = Array.isArray(info)
      ? info.map((r: { asentamiento: string }) => r.asentamiento)
      : [info.asentamiento];

    const first = Array.isArray(info) ? info[0] : info;

    return new Response(
      JSON.stringify({
        colonias,
        municipio: first.municipio,
        estado: first.estado,
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
