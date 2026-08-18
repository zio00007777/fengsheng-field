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
  assert.match(html, /我反对时代峰峻/);
  assert.match(html, /我支持时代峰峻/);
  assert.match(html, /这里没有第三个选项/);
  assert.match(html, /LIVE BATTLE/);
  assert.match(html, /ONLY/);
  assert.match(html, /后台/);
  assert.doesNotMatch(html, /质疑方|预置议题|Your site is taking shape|react-loading-skeleton/);
});

test("product surface includes guided quiz and operational actions", async () => {
  const [page, admin, schema, hosting] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /quizSets/);
  assert.match(page, /setPhase\("score"\)/);
  assert.match(page, /应援棒已点亮/);
  assert.match(page, /选择你最主要的反对理由/);
  assert.match(page, /微信|支付宝|安全支付|真实支付/);
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
