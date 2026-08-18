import { db, fallbackGifts, json, paymentProvider } from "../_lib";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { giftId?: string } | null;
  if (!body?.giftId || !(body.giftId in fallbackGifts)) return json({ error: "invalid_gift" }, { status: 400 });
  if (!db() || !paymentProvider()) return json({ error: "payment_not_configured" }, { status: 503 });
  return json({ error: "payment_provider_adapter_required" }, { status: 503 });
}
