"use client";

import { useState } from "react";
import Link from "next/link";

type Overview = {
  scores?: { support: number; against: number };
  gifts?: Array<{ id: string; name: string; priceCents: number; scoreValue: number; icon: string; enabled: boolean }>;
  orders?: Array<{ id: string; giftId: string; amountCents: number; scoreValue: number; status: string; provider: string }>;
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [adjustSide, setAdjustSide] = useState<"support" | "against">("support");
  const [adjustValue, setAdjustValue] = useState("1");

  async function loadOverview() {
    const response = await fetch("/api/admin/overview", { headers: { "x-admin-token": token } });
    if (!response.ok) { setError("管理员密钥无效，或服务端尚未配置 ADMIN_TOKEN。"); return; }
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

  if (!authed) return <main className="admin-shell"><div className="admin-login"><span className="admin-kicker">FJ / ADMIN</span><h1>运营后台</h1><p>管理阵营文案、礼物、比分和订单。</p><input type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="输入管理员密钥" onKeyDown={(event) => event.key === "Enter" && loadOverview()} /><button onClick={loadOverview}>进入后台 →</button>{error && <small>{error}</small>}<Link href="/">← 返回前台</Link></div></main>;

  return <main className="admin-shell"><header className="admin-header"><div><span className="admin-kicker">FJ / ADMIN</span><h1>运营后台</h1></div><Link href="/">返回前台 ↗</Link></header><section className="admin-grid"><div className="admin-card admin-score-card"><span>LIVE SCORE</span><div className="admin-scores"><div><small>反对时代峰峻</small><strong>{overview?.scores?.against ?? 0}</strong></div><b>VS</b><div><small>支持时代峰峻</small><strong>{overview?.scores?.support ?? 0}</strong></div></div><div className="admin-adjust"><select value={adjustSide} onChange={(event) => setAdjustSide(event.target.value as "support" | "against")}><option value="support">增加支持值</option><option value="against">增加反对值</option></select><input value={adjustValue} onChange={(event) => setAdjustValue(event.target.value)} inputMode="numeric" /><button onClick={adjustScore}>调整</button></div></div><div className="admin-card"><span>GIFT INVENTORY</span><h2>礼物档位</h2><div className="admin-list">{(overview?.gifts ?? []).map((gift) => <div className="admin-row" key={gift.id}><b>{gift.icon} {gift.name}</b><span>¥{(gift.priceCents / 100).toFixed(0)} · +{gift.scoreValue}</span><i>{gift.enabled ? "已上架" : "已下架"}</i><button className="admin-row-edit" onClick={() => editGift(gift)}>编辑</button></div>)}</div><p className="admin-empty">题目、阵营名称和礼物档位都通过后台配置接口持久化。</p></div><div className="admin-card admin-wide"><span>ORDERS</span><h2>最近订单</h2><div className="admin-list">{(overview?.orders ?? []).length ? overview?.orders?.map((order) => <div className="admin-row" key={order.id}><b>{order.id}</b><span>{order.giftId} · ¥{(order.amountCents / 100).toFixed(0)}</span><i>{order.status}</i></div>) : <p className="admin-empty">暂无订单记录。支付沙盒订单会出现在这里。</p>}</div></div></section></main>;
}
