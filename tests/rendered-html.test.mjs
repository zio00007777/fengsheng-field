import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
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
  const [page, admin, stickRoute, schema, hosting] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/support-stick/claim/route.ts", import.meta.url), "utf8"),
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
  assert.match(stickRoute, /NOT EXISTS/);
  assert.match(stickRoute, /storage_not_configured/);
  assert.match(stickRoute, /database.batch/);
  assert.match(page, /微信|支付宝|安全支付|真实支付/);
  assert.match(page, /不代表真实统计/);
  assert.match(page, /Math\.random/);
  assert.match(admin, /运营后台/);
  assert.match(admin, /editGift|编辑/);
  assert.match(schema, /scoreLedger/);
  assert.match(schema, /orders/);
  assert.match(hosting, /"d1": "DB"/);
});

test("admin route is present", async () => {
  const response = await render("/admin");
  assert.equal(response.status, 200);
  assert.match(await response.text(), /运营后台/);
});
