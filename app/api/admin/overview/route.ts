import { json, listGifts, listOrders, requireAdmin, scoreTotals } from "../../_lib";

export async function GET(request: Request) {
  if (!requireAdmin(request)) return json({ error: "admin_required" }, { status: 401 });
  const [gifts, orders] = await Promise.all([listGifts(), listOrders()]);
  return json({ scores: await scoreTotals(), gifts, orders });
}
