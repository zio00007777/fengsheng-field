import { db, fallbackGifts, getSessionId, json, sessionCookie } from "../_lib";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { giftId?: string } | null;
  if (!body?.giftId || !(body.giftId in fallbackGifts)) return json({ error: "invalid_gift" }, { status: 400 });
  const fallback = fallbackGifts[body.giftId as keyof typeof fallbackGifts];
  const database = db();
  const gift = database ? await database.prepare("SELECT id, price_cents, score_value FROM gifts WHERE id = ? AND enabled = 1").bind(body.giftId).first<{ id: string; price_cents: number; score_value: number }>() : null;
  const item = gift ?? { id: body.giftId, price_cents: fallback.priceCents, score_value: fallback.scoreValue };
  const orderId = `FJ-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const sessionId = getSessionId(request);
  if (database) await database.prepare("INSERT INTO orders (id, session_id, gift_id, amount_cents, score_value, status, provider, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(orderId, sessionId, item.id, item.price_cents, item.score_value, "pending", "sandbox", Date.now()).run();
  return json({ orderId, amountCents: item.price_cents, scoreValue: item.score_value, status: "pending" }, { headers: { "set-cookie": sessionCookie(sessionId) } });
}
