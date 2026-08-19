import { claimShareReward, getSessionId, json, sessionCookie, signalStorageConfigured } from "../../_lib";

export async function POST(request: Request) {
  const sessionId = getSessionId(request);
  const headers = { "set-cookie": sessionCookie(sessionId) };
  if (!signalStorageConfigured()) return json({ error: "storage_not_configured" }, { status: 503, headers });
  try {
    const result = await claimShareReward(sessionId);
    if (result.status === "unavailable") return json({ error: "storage_unavailable" }, { status: 503, headers });
    return json({ ok: true, value: result.value }, { headers });
  } catch {
    return json({ error: "storage_unavailable" }, { status: 503, headers });
  }
}
