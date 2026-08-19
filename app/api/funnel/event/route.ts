import { getSessionId, json, sessionCookie, trackFunnelEvent, type FunnelStage } from "../../_lib";

const stages = new Set<FunnelStage>([
  "visit",
  "support_selected",
  "quiz_completed",
  "support_arena",
  "share_clicked",
  "share_claimed",
  "gift_clicked",
  "payment_confirmed",
]);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { stage?: string } | null;
  if (!body?.stage || !stages.has(body.stage as FunnelStage)) return json({ error: "invalid_stage" }, { status: 400 });
  const sessionId = getSessionId(request);
  try {
    if (!(await trackFunnelEvent(body.stage as FunnelStage, sessionId))) return json({ error: "storage_unavailable" }, { status: 503 });
    return json({ ok: true }, { headers: { "set-cookie": sessionCookie(sessionId) } });
  } catch {
    return json({ error: "storage_unavailable" }, { status: 503, headers: { "set-cookie": sessionCookie(sessionId) } });
  }
}
