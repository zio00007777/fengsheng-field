import { appendScore, json, requireAdmin } from "../../../_lib";

export async function POST(request: Request) {
  if (!requireAdmin(request)) return json({ error: "admin_required" }, { status: 401 });
  const body = await request.json().catch(() => null) as { side?: "support" | "against"; value?: number; reason?: string } | null;
  if (!body?.side || !Number.isInteger(body.value) || !body.reason) return json({ error: "invalid_adjustment" }, { status: 400 });
  if (!(await appendScore(body.side, body.value, `admin:${body.reason}`))) return json({ error: "storage_unavailable" }, { status: 503 });
  return json({ ok: true });
}
