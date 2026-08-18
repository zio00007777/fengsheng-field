import { db, appendScore, getSessionId, json, sessionCookie } from "../../_lib";

export async function POST(request: Request) {
  const sessionId = getSessionId(request);
  const database = db();
  if (database) {
    const last = await database.prepare("SELECT created_at FROM support_stick_claims WHERE session_id = ? ORDER BY created_at DESC LIMIT 1").bind(sessionId).first<{ created_at: number }>();
    if (last && Date.now() - Number(last.created_at) < 3600000) return json({ error: "cooldown", nextAt: Number(last.created_at) + 3600000 }, { status: 429, headers: { "set-cookie": sessionCookie(sessionId) } });
    await database.prepare("INSERT INTO support_stick_claims (id, session_id, created_at) VALUES (?, ?, ?)").bind(crypto.randomUUID(), sessionId, Date.now()).run();
  }
  await appendScore("support", 1, "support_stick", sessionId);
  return json({ ok: true, value: 1 }, { headers: { "set-cookie": sessionCookie(sessionId) } });
}
