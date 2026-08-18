import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the interactive field", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>峰声 FIELD · 两种声音，一个现场<\/title>/i);
  assert.match(html, /进入你的观点现场/);
  assert.match(html, /质疑 \/ 反对/);
  assert.match(html, /支持 \/ 应援/);
  assert.match(html, /应援棒/);
  assert.match(html, /支付沙盒演示/);
  assert.match(html, /预置议题/);
  assert.match(html, /不鼓励辱骂/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton|codex-preview/);
});

test("site copy and behavior remain in the product surface", async () => {
  const [page, layout, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /setCooldown\(60 \* 60\)/);
  assert.match(page, /应援棒已点亮，支持值 \+1/);
  assert.match(page, /微信支付/);
  assert.match(page, /支付宝/);
  assert.match(page, /setSupportScore\(\(score\) => score \+ selectedGift\.value\)/);
  assert.match(layout, /title: "峰声 FIELD · 两种声音，一个现场"/);
  assert.match(css, /\.arena-grid/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
