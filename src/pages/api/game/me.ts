import type { APIRoute } from "astro";
import { pool } from "../../../lib/db";

const COOKIE_NAME = "game_player";

export const GET: APIRoute = async ({ cookies }) => {
  const playerId = cookies.get(COOKIE_NAME)?.value;
  if (!playerId) {
    return new Response(JSON.stringify({ name: null }), { headers: { "Content-Type": "application/json" } });
  }

  const { rows } = await pool.query("select name from game_players where id = $1", [playerId]);
  return new Response(JSON.stringify({ name: rows[0]?.name ?? null }), {
    headers: { "Content-Type": "application/json" },
  });
};
