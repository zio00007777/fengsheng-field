import { appendScore, fallbackGifts, getSessionId, json, storageConfigured } from "../../_lib";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { giftId?: string } | null;
  if (!body?.giftId || !(body.giftId in fallbackGifts)) return json({ error: "invalid_gift" }, { status: 400 });
  if (!storageConfigured()) return json({ error: "storage_not_configured" }, { status: 503 });

  const gift = fallbackGifts[body.giftId as keyof typeof fallbackGifts];
  const sessionId = getSessionId(request);

  try {
    await appendScore("support", gift.scoreValue, `gift_purchase:${body.giftId}`, sessionId);
    return json({ success: true, scoreValue: gift.scoreValue });
  } catch (error) {
    console.error("Failed to confirm order:", error);
    return json({ error: "failed_to_record_score" }, { status: 500 });
  }
}
