import type { APIRoute } from "astro";
import { pool } from "../../../lib/db";

const COOKIE_NAME = "game_player";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año

export const POST: APIRoute = async ({ request, cookies }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400 });
  }

  const score = Number(body?.score);
  if (!Number.isFinite(score) || score < 0 || score > 1_000_000) {
    return new Response(JSON.stringify({ error: "Puntaje inválido" }), { status: 400 });
  }

  const name = String(body?.name ?? "").trim().slice(0, 60);
  const phoneRaw = String(body?.phone ?? "").replace(/\D/g, "");

  let playerId = cookies.get(COOKIE_NAME)?.value || null;

  const client = await pool.connect();
  try {
    if (playerId) {
      const { rows } = await client.query("select id, name from game_players where id = $1", [playerId]);
      if (rows.length === 0) playerId = null;
      else if (name && name !== rows[0].name) {
        await client.query("update game_players set name = $1 where id = $2", [name, playerId]);
      }
    }

    if (!playerId) {
      if (!name || phoneRaw.length < 10) {
        return new Response(JSON.stringify({ error: "Falta nombre o teléfono válido" }), { status: 400 });
      }

      const { rows } = await client.query(
        `insert into game_players (phone, name) values ($1, $2)
         on conflict (phone) do update set name = excluded.name
         returning id`,
        [phoneRaw, name]
      );
      playerId = rows[0].id;

      cookies.set(COOKIE_NAME, playerId!, {
        path: "/",
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "lax",
      });
    }

    await client.query("insert into game_scores (player_id, score) values ($1, $2)", [playerId, score]);

    const { rows: bestRows } = await client.query(
      `select max(score) as best from game_scores
       where player_id = $1 and created_at >= date_trunc('week', now())`,
      [playerId]
    );

    return new Response(JSON.stringify({ ok: true, bestThisWeek: Number(bestRows[0]?.best ?? score) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    client.release();
  }
};
