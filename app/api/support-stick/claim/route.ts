import { db, getSessionId, json, sessionCookie } from "../../_lib";

const COOLDOWN_MS = 60 * 60 * 1000;

async function latestClaim(database: D1Database, sessionId: string) {
  return database.prepare("SELECT created_at FROM support_stick_claims WHERE session_id = ? ORDER BY created_at DESC LIMIT 1").bind(sessionId).first<{ created_at: number }>();
}

export async function GET(request: Request) {
  const sessionId = getSessionId(request);
  const database = db();
  const headers = { "set-cookie": sessionCookie(sessionId) };
  if (!database) return json({ error: "storage_not_configured" }, { status: 503, headers });
  try {
    const last = await latestClaim(database, sessionId);
    const nextAt = last ? Number(last.created_at) + COOLDOWN_MS : 0;
    return json({ ok: true, nextAt }, { headers });
  } catch {
    return json({ error: "storage_unavailable" }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  const sessionId = getSessionId(request);
  const database = db();
  const headers = { "set-cookie": sessionCookie(sessionId) };
  if (!database) return json({ error: "storage_not_configured" }, { status: 503, headers });

  const now = Date.now();
  const cutoff = now - COOLDOWN_MS;
  const claimId = crypto.randomUUID();
  const ledgerId = crypto.randomUUID();

  try {
    const results = await database.batch([
      database.prepare("INSERT INTO support_stick_claims (id, session_id, created_at) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM support_stick_claims WHERE session_id = ? AND created_at > ?)").bind(claimId, sessionId, now, sessionId, cutoff),
      database.prepare("INSERT INTO score_ledger (id, side, value, reason, session_id, created_at) SELECT ?, 'support', 1, 'support_stick', ?, ? WHERE EXISTS (SELECT 1 FROM support_stick_claims WHERE id = ?)").bind(ledgerId, sessionId, now, claimId),
    ]);
    const claimChanges = Number(results[0]?.meta?.changes ?? 0);
    if (claimChanges !== 1) {
      const last = await latestClaim(database, sessionId);
      const nextAt = last ? Number(last.created_at) + COOLDOWN_MS : now + COOLDOWN_MS;
      return json({ error: "cooldown", nextAt }, { status: 429, headers });
    }
    return json({ ok: true, value: 1, nextAt: now + COOLDOWN_MS }, { headers });
  } catch {
    return json({ error: "storage_unavailable" }, { status: 503, headers });
  }
}
