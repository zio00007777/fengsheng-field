import { appendScore, getSessionId, json, sessionCookie } from "../../_lib";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { side?: "support" | "against"; answers?: string[] } | null;
  if (!body?.side || !Array.isArray(body.answers) || body.answers.length !== 3) return json({ error: "invalid_quiz" }, { status: 400 });
  const sessionId = getSessionId(request);
  await appendScore(body.side, 1, "quiz_selection", sessionId);
  return json({ ok: true, side: body.side }, { headers: { "set-cookie": sessionCookie(sessionId) } });
}
