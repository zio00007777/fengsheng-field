import { createPendingOrder, getSessionId, json, sessionCookie, storageConfigured } from "../_lib";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { giftId?: string } | null;
  if (!body?.giftId) return json({ error: "invalid_gift" }, { status: 400 });
  if (!storageConfigured()) return json({ error: "payment_not_configured" }, { status: 503 });

  const sessionId = getSessionId(request);
  const result = await createPendingOrder(body.giftId, sessionId);
  if (result.status === "invalid_gift") return json({ error: "invalid_gift" }, { status: 400 });
  if (result.status !== "created") return json({ error: "storage_unavailable" }, { status: 503 });

  return json({
    orderId: result.orderId,
    qrcodeUrl: `/qrcodes/${result.gift.id}.png?t=${Date.now()}`,
    giftId: body.giftId,
    giftName: result.gift.name,
    priceCents: result.gift.priceCents,
    scoreValue: result.gift.scoreValue,
  }, {
    headers: {
      "set-cookie": sessionCookie(sessionId),
      "cache-control": "no-store",
    },
  });
}
