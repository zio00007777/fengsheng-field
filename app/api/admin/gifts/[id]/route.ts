import { db, json, requireAdmin } from "../../../_lib";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(request)) return json({ error: "admin_required" }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { name?: string; priceCents?: number; scoreValue?: number; enabled?: boolean } | null;
  if (!body?.name || !Number.isInteger(body.priceCents) || !Number.isInteger(body.scoreValue)) return json({ error: "invalid_gift" }, { status: 400 });
  const database = db();
  if (!database) return json({ error: "database_unavailable" }, { status: 503 });
  await database.prepare("UPDATE gifts SET name = ?, price_cents = ?, score_value = ?, enabled = ? WHERE id = ?").bind(body.name, body.priceCents, body.scoreValue, body.enabled === false ? 0 : 1, id).run();
  return json({ ok: true });
}
