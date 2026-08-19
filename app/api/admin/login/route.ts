import { json } from "../../_lib";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { token?: string } | null;
  const configured = process.env.ADMIN_TOKEN ?? process.env.ADMIN_PASSWORD;
  if (!configured || body?.token !== configured) return json({ error: "invalid_admin_token" }, { status: 401 });
  return json({ ok: true }, { headers: { "set-cookie": `fj_admin=${configured}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800` } });
}
