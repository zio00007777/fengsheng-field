import {
  claimSupportStick,
  getSessionId,
  json,
  latestSupportStickClaim,
  sessionCookie,
  signalStorageConfigured,
} from "../../_lib";

const COOLDOWN_MS = 60 * 60 * 1000;

export async function GET(request: Request) {
  const sessionId = getSessionId(request);
  const headers = { "set-cookie": sessionCookie(sessionId) };
  if (!signalStorageConfigured()) return json({ error: "storage_not_configured" }, { status: 503, headers });
  try {
    const last = await latestSupportStickClaim(sessionId);
    const nextAt = last ? Number(last.createdAt) + COOLDOWN_MS : 0;
    return json({ ok: true, nextAt }, { headers });
  } catch {
    return json({ error: "storage_unavailable" }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  const sessionId = getSessionId(request);
  const headers = { "set-cookie": sessionCookie(sessionId) };
  if (!signalStorageConfigured()) return json({ error: "storage_not_configured" }, { status: 503, headers });

  try {
    const result = await claimSupportStick(sessionId);
    if (result.status === "unavailable") return json({ error: "storage_unavailable" }, { status: 503, headers });
    if (result.status === "cooldown") return json({ error: "cooldown", nextAt: result.nextAt }, { status: 429, headers });
    return json({ ok: true, value: result.value, nextAt: result.nextAt }, { headers });
  } catch {
    return json({ error: "storage_unavailable" }, { status: 503, headers });
  }
}
