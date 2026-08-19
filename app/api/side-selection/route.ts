import { appendScore, getSessionId, json, sessionCookie } from "../_lib";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { side?: string; reason?: string } | null;
  if (body?.side !== "against" || !body.reason) return json({ error: "invalid_selection" }, { status: 400 });
  const sessionId = getSessionId(request);
  if (!(await appendScore("against", 1, `reason:${body.reason}`, sessionId))) return json({ error: "storage_unavailable" }, { status: 503 });
  return json({ ok: true }, { headers: { "set-cookie": sessionCookie(sessionId) } });
}
