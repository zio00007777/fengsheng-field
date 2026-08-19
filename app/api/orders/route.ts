import { appendScore, fallbackGifts, getSessionId, json, sessionCookie, storageConfigured } from "../_lib";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { giftId?: string } | null;
  if (!body?.giftId || !(body.giftId in fallbackGifts)) return json({ error: "invalid_gift" }, { status: 400 });
  if (!storageConfigured()) return json({ error: "payment_not_configured" }, { status: 503 });

  const gift = fallbackGifts[body.giftId as keyof typeof fallbackGifts];
  const sessionId = getSessionId(request);

  return json({
    qrcodeUrl: `/qrcodes/${body.giftId}.png?t=${Date.now()}`,
    giftId: body.giftId,
    giftName: gift.name,
    priceCents: gift.priceCents,
    scoreValue: gift.scoreValue,
  }, {
    headers: {
      "set-cookie": sessionCookie(sessionId),
      "cache-control": "no-store",
    },
  });
}
