import type { APIRoute } from "astro";
import { pool } from "../../../lib/db";

export const GET: APIRoute = async ({ url }) => {
  const period = url.searchParams.get("period") === "month" ? "month" : "week";

  const { rows } = await pool.query(
    `select p.name, max(s.score) as best
     from game_scores s
     join game_players p on p.id = s.player_id
     where s.created_at >= date_trunc($1, now())
     group by p.id, p.name
     order by best desc
     limit 10`,
    [period]
  );

  return new Response(JSON.stringify({ period, leaderboard: rows }), {
    headers: { "Content-Type": "application/json" },
  });
};
