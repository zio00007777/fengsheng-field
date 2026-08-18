import { db, json, requireAdmin, scoreTotals } from "../../_lib";

export async function GET(request: Request) {
  if (!requireAdmin(request)) return json({ error: "admin_required" }, { status: 401 });
  const database = db();
  const gifts = database ? await database.prepare("SELECT id, name, price_cents AS priceCents, score_value AS scoreValue, icon, enabled FROM gifts ORDER BY price_cents ASC").all() : { results: [] };
  const orders = database ? await database.prepare("SELECT id, gift_id AS giftId, amount_cents AS amountCents, score_value AS scoreValue, status, provider, created_at AS createdAt FROM orders ORDER BY created_at DESC LIMIT 30").all() : { results: [] };
  return json({ scores: await scoreTotals(), gifts: gifts.results ?? [], orders: orders.results ?? [] });
}
