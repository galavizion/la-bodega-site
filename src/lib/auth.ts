const SECRET = import.meta.env.AUTH_SECRET ?? "dev-secret-bodega-change-in-prod";

async function hmacKey(usage: KeyUsage[]) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usage
  );
}

export async function signToken(payload: Record<string, unknown>): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
  const data = JSON.stringify({ ...payload, exp });
  const key = await hmacKey(["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${btoa(data)}.${btoa(String.fromCharCode(...new Uint8Array(sig)))}`;
}

export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const [b64data, b64sig] = token.split(".");
    if (!b64data || !b64sig) return null;
    const data = atob(b64data);
    const key = await hmacKey(["verify"]);
    const sig = Uint8Array.from(atob(b64sig), (c) => c.charCodeAt(0));
    const ok = await crypto.subtle.verify("HMAC", key, sig, new TextEncoder().encode(data));
    if (!ok) return null;
    const p = JSON.parse(data) as Record<string, unknown>;
    if ((p.exp as number) < Math.floor(Date.now() / 1000)) return null;
    return p;
  } catch {
    return null;
  }
}

export async function getSession(
  request: Request
): Promise<{ email: string; name?: string } | null> {
  const cookie = request.headers.get("cookie") ?? "";
  const m = /bodega_session=([^;]+)/.exec(cookie);
  if (!m) return null;
  const payload = await verifyToken(decodeURIComponent(m[1]));
  if (!payload?.email) return null;
  return { email: payload.email as string, name: payload.name as string | undefined };
}

export function makeSessionCookie(token: string): string {
  const secure = import.meta.env.PROD ? "; Secure" : "";
  return `bodega_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}${secure}`;
}

export function clearSessionCookie(): string {
  return "bodega_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
}
