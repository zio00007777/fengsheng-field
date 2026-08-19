import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const serverUrl = new URL("../.netlify/functions-internal/server/server.mjs", import.meta.url);
  serverUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: server } = await import(serverUrl.href);
  return server(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }));
}

test("server-renders the two-side battle field", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>峰声 FIELD · 两种声音，一个现场<\/title>/i);
  assert.match(html, /反对时代峰峻/);
  assert.match(html, /支持 TF 五代/);
  assert.match(html, /第三选项/);
  assert.match(html, /LIVE SCOREBOARD/);
  assert.match(html, /TWO SIDES ONLY/);
  assert.match(html, /signal-room/);
  assert.doesNotMatch(html, /zine-site|arena-site|dispatch-room/);
  assert.match(html, /ADMIN/);
  assert.doesNotMatch(html, /质疑方|预置议题|Your site is taking shape|react-loading-skeleton/);
});

test("product surface includes guided quiz and operational actions", async () => {
  const [page, admin, stickRoute, shareRoute, funnelRoute, shareMigration, schema, hosting] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/support-stick/claim/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/share/claim/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/funnel/event/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20260820000001_share_and_funnel.sql", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /quizSets/);
  assert.doesNotMatch(page, /setPhase\("score"\)/);
  assert.match(page, /setPhase\("arena"\)/);
  assert.match(page, /TF 五代应援信号已点亮/);
  assert.match(page, /选择你最主要的反对理由/);
  assert.match(page, /TF 五代哪位公开练习生/);
  assert.match(page, /gift-step/);
  assert.match(page, /第一应援动作/);
  assert.match(page, /送出特效礼物/);
  assert.match(page, /gift-card-high/);
  assert.match(page, /stickUnavailable/);
  assert.match(stickRoute, /export async function GET/);
  assert.match(stickRoute, /claimSupportStick/);
  assert.match(stickRoute, /storage_not_configured/);
  assert.match(stickRoute, /status === "cooldown"/);
  assert.match(page, /share-task/);
  assert.match(page, /已分享，领取 \+10/);
  assert.match(page, /navigator\.share/);
  assert.match(shareRoute, /claimShareReward/);
  assert.match(funnelRoute, /trackFunnelEvent/);
  assert.match(shareMigration, /funnel_events/);
  assert.match(shareMigration, /claim_share_reward/);
  assert.match(page, /微信|支付宝|安全支付|真实支付/);
  assert.match(page, /不代表真实统计/);
  assert.match(page, /Math\.sin/);
  assert.match(admin, /运营后台/);
  assert.match(admin, /editGift|编辑/);
  assert.match(admin, /支持转化漏斗/);
  assert.match(admin, /去重会话/);
  assert.match(schema, /scoreLedger/);
  assert.match(schema, /orders/);
  assert.match(hosting, /project_id/);
  const netlify = await readFile(new URL("../netlify.toml", import.meta.url), "utf8");
  assert.match(netlify, /NITRO_PRESET = "netlify"/);
});

test("admin route is present", async () => {
  const response = await render("/admin");
  assert.equal(response.status, 200);
  assert.match(await response.text(), /运营后台/);
});
