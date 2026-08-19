import { funnelOverview, json, listGifts, listOrders, requireAdmin, scoreTotals } from "../../_lib";

export async function GET(request: Request) {
  if (!requireAdmin(request)) return json({ error: "admin_required" }, { status: 401 });
  const daysParam = new URL(request.url).searchParams.get("days");
  const days = daysParam && daysParam !== "all" ? Math.max(1, Math.min(365, Number(daysParam) || 30)) : null;
  const rangeStart = days ? Date.now() - days * 24 * 60 * 60 * 1000 : undefined;
  const [gifts, orders] = await Promise.all([listGifts(), listOrders()]);
  return json({ scores: await scoreTotals(), gifts, orders, funnel: await funnelOverview(rangeStart) });
}
