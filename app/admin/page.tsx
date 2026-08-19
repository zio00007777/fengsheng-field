"use client";

import { useState } from "react";
import Link from "next/link";

type Overview = {
  scores?: { support: number; against: number };
  gifts?: Array<{ id: string; name: string; priceCents: number; scoreValue: number; icon: string; enabled: boolean }>;
  orders?: Array<{ id: string; giftId: string; amountCents: number; scoreValue: number; status: string; provider: string }>;
  funnel?: { stages: Array<{ stage: string; events: number; sessions: number; rateFromPrevious: number | null }>; totalSessions: number; totalEvents: number };
};

const funnelLabels: Record<string, string> = {
  visit: "进入网站",
  support_selected: "选择支持方",
  quiz_completed: "完成四题问答",
  support_arena: "进入支持页",
  share_clicked: "点击分享",
  share_claimed: "领取 +10",
  gift_clicked: "点击礼物",
  payment_confirmed: "确认支付",
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [adjustSide, setAdjustSide] = useState<"support" | "against">("support");
  const [adjustValue, setAdjustValue] = useState("1");
  const [funnelDays, setFunnelDays] = useState("all");

  async function loadOverview(nextDays = funnelDays) {
    const login = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
    if (!login.ok) { setError("管理员密钥无效，或服务端尚未配置 ADMIN_TOKEN。"); return; }
    const query = nextDays === "all" ? "" : `?days=${nextDays}`;
    const response = await fetch(`/api/admin/overview${query}`);
    if (!response.ok) { setError("登录成功，但后台数据暂时不可用。"); return; }
    setOverview(await response.json());
    setAuthed(true);
  }

  async function adjustScore() {
    await fetch("/api/admin/scoreboard/adjust", { method: "POST", headers: { "content-type": "application/json", "x-admin-token": token }, body: JSON.stringify({ side: adjustSide, value: Number(adjustValue), reason: "后台手动调整" }) });
    await loadOverview();
  }

  async function editGift(gift: NonNullable<Overview["gifts"]>[number]) {
    const name = window.prompt("礼物名称", gift.name);
    const price = window.prompt("价格（元）", String(gift.priceCents / 100));
    const value = window.prompt("应援值", String(gift.scoreValue));
    if (!name || !price || !value) return;
    await fetch(`/api/admin/gifts/${gift.id}`, { method: "PATCH", headers: { "content-type": "application/json", "x-admin-token": token }, body: JSON.stringify({ name, priceCents: Math.round(Number(price) * 100), scoreValue: Number(value), enabled: true }) });
    await loadOverview();
  }

  async function changeFunnelRange(nextDays: string) {
    setFunnelDays(nextDays);
    if (!authed) return;
    await loadOverview(nextDays);
  }

  if (!authed) return <main className="admin-shell"><div className="admin-login"><span className="admin-kicker">FJ / ADMIN</span><h1>运营后台</h1><p>管理阵营文案、礼物、比分和订单。</p><input type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="输入管理员密钥" onKeyDown={(event) => event.key === "Enter" && loadOverview()} /><button onClick={loadOverview}>进入后台 →</button>{error && <small>{error}</small>}<Link href="/">← 返回前台</Link></div></main>;

  return <main className="admin-shell"><header className="admin-header"><div><span className="admin-kicker">FJ / ADMIN</span><h1>运营后台</h1></div><Link href="/">返回前台 ↗</Link></header><section className="admin-grid"><div className="admin-card admin-score-card"><span>LIVE SCORE</span><div className="admin-scores"><div><small>反对时代峰峻</small><strong>{overview?.scores?.against ?? 0}</strong></div><b>VS</b><div><small>支持 TF 五代</small><strong>{overview?.scores?.support ?? 0}</strong></div></div><div className="admin-adjust"><select value={adjustSide} onChange={(event) => setAdjustSide(event.target.value as "support" | "against")}><option value="support">增加 TF 五代支持值</option><option value="against">增加反对值</option></select><input value={adjustValue} onChange={(event) => setAdjustValue(event.target.value)} inputMode="numeric" /><button onClick={adjustScore}>调整</button></div></div><div className="admin-card"><span>GIFT INVENTORY</span><h2>礼物档位</h2><div className="admin-list">{(overview?.gifts ?? []).map((gift) => <div className="admin-row" key={gift.id}><b>{gift.icon} {gift.name}</b><span>¥{(gift.priceCents / 100).toFixed(0)} · +{gift.scoreValue}</span><i>{gift.enabled ? "已上架" : "已下架"}</i><button className="admin-row-edit" onClick={() => editGift(gift)}>编辑</button></div>)}</div><p className="admin-empty">题目、阵营名称和礼物档位都通过后台配置接口持久化。</p></div><div className="admin-card admin-wide admin-funnel"><div className="admin-funnel-head"><div><span>SUPPORT FUNNEL</span><h2>支持转化漏斗</h2></div><select value={funnelDays} onChange={(event) => changeFunnelRange(event.target.value)}><option value="all">全部时间</option><option value="7">近 7 天</option><option value="30">近 30 天</option></select></div><div className="admin-funnel-summary"><div><small>去重会话</small><strong>{overview?.funnel?.totalSessions ?? 0}</strong></div><div><small>事件总数</small><strong>{overview?.funnel?.totalEvents ?? 0}</strong></div></div><div className="admin-funnel-list">{(overview?.funnel?.stages ?? []).map((stage, index) => <div className="admin-funnel-row" key={stage.stage}><div className="admin-funnel-label"><b>{String(index + 1).padStart(2, "0")}</b><strong>{funnelLabels[stage.stage] ?? stage.stage}</strong></div><div className="admin-funnel-bar"><i style={{ width: `${Math.min(100, (stage.sessions / Math.max(1, overview?.funnel?.stages?.[0]?.sessions ?? 1)) * 100)}%` }} /></div><span>{stage.sessions} 人 / {stage.events} 次</span><em>{stage.rateFromPrevious === null ? "—" : `${stage.rateFromPrevious}%`}</em></div>)}</div><p className="admin-empty">人数按会话去重，次数按事件累计；比例为相对上一阶段的转化率。</p></div><div className="admin-card admin-wide"><span>ORDERS</span><h2>最近订单</h2><div className="admin-list">{(overview?.orders ?? []).length ? overview?.orders?.map((order) => <div className="admin-row" key={order.id}><b>{order.id}</b><span>{order.giftId} · ¥{(order.amountCents / 100).toFixed(0)}</span><i>{order.status}</i></div>) : <p className="admin-empty">暂无订单记录。真实支付通道配置完成后，成功订单会出现在这里。</p>}</div></div></section></main>;
}
