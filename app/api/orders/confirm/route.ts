import { confirmGiftOrder, json, storageConfigured } from "../../_lib";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { orderId?: string } | null;
  if (!body?.orderId) return json({ error: "invalid_order" }, { status: 400 });
  if (!storageConfigured()) return json({ error: "storage_not_configured" }, { status: 503 });

  try {
    const result = await confirmGiftOrder(body.orderId);
    if (result.status === "too_early") return json({ error: "confirmation_too_early" }, { status: 409 });
    if (result.status === "not_found") return json({ error: "order_not_found" }, { status: 404 });
    if (result.status === "invalid_status") return json({ error: "order_not_confirmable" }, { status: 409 });
    if (result.status === "unavailable") return json({ error: "storage_unavailable" }, { status: 503 });
    return json({ success: true, scoreValue: result.scoreValue, alreadyConfirmed: result.status === "already_confirmed" });
  } catch (error) {
    console.error("Failed to confirm order:", error);
    return json({ error: "failed_to_record_score" }, { status: 500 });
  }
}
