import { json, requireAdmin, updateGift } from "../../../_lib";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(request)) return json({ error: "admin_required" }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { name?: string; priceCents?: number; scoreValue?: number; enabled?: boolean } | null;
  if (!body?.name || !Number.isInteger(body.priceCents) || !Number.isInteger(body.scoreValue)) return json({ error: "invalid_gift" }, { status: 400 });
  const updated = await updateGift(id, { name: body.name, priceCents: body.priceCents, scoreValue: body.scoreValue, enabled: body.enabled !== false });
  if (!updated) return json({ error: "database_unavailable" }, { status: 503 });
  return json({ ok: true });
}
