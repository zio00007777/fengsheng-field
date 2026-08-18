import { appendScore, db, json } from "../../_lib";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { orderId?: string; transactionId?: string; status?: string } | null;
  if (!body?.orderId || body.status !== "paid") return json({ error: "invalid_callback" }, { status: 400 });
  const database = db();
  if (!database) return json({ ok: true, mode: "sandbox" });
  const order = await database.prepare("SELECT id, side, score_value, status FROM orders WHERE id = ?").bind(body.orderId).first<{ id: string; score_value: number; status: string }>();
  if (!order) return json({ error: "order_not_found" }, { status: 404 });
  if (order.status !== "paid") {
    await database.prepare("UPDATE orders SET status = ?, provider_transaction_id = ? WHERE id = ?").bind("paid", body.transactionId ?? null, order.id).run();
    await appendScore("support", Number(order.score_value), "gift_purchase", undefined);
  }
  return json({ ok: true });
}
