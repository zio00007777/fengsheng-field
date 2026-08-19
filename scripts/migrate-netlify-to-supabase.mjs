import { createHash } from "node:crypto";
import { getStore } from "@netlify/blobs";
import { createClient } from "@supabase/supabase-js";

const apply = process.argv.includes("--apply");
const netlifyToken = process.env.NETLIFY_AUTH_TOKEN;
const netlifySiteId = process.env.NETLIFY_SITE_ID;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

if (!netlifyToken || !netlifySiteId || (apply && (!supabaseUrl || !supabaseKey))) {
  console.error(apply
    ? "正式迁移需要 NETLIFY_AUTH_TOKEN、NETLIFY_SITE_ID、SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY"
    : "预览需要 NETLIFY_AUTH_TOKEN 和 NETLIFY_SITE_ID；预览不会写入 Supabase");
  process.exit(1);
}

const source = getStore({
  name: "fengsheng-field",
  siteID: netlifySiteId,
  token: netlifyToken,
  consistency: "strong",
});
const target = apply
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

async function readJson(key) {
  return source.get(key, { type: "json", consistency: "strong" });
}

async function listPrefix(prefix) {
  const listed = await source.list({ prefix });
  const values = [];
  for (const { key } of listed.blobs) {
    const value = await readJson(key);
    if (value !== null) values.push({ key, value });
  }
  return values;
}

function stableUuid(key) {
  const hex = createHash("sha256").update(key).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function iso(value) {
  return new Date(Number(value) || Date.parse(value) || Date.now()).toISOString();
}

async function upsert(table, rows, onConflict) {
  if (!rows.length || !apply || !target) return;
  const { error } = await target.from(table).upsert(rows, { onConflict, ignoreDuplicates: true });
  if (error) throw error;
}

const ledgerEntries = await listPrefix("ledger/");
const claimEntries = await listPrefix("claims/guard/");
const giftsConfig = await readJson("config/gifts");
const orderEntries = await listPrefix("orders/");

const ledger = ledgerEntries.map(({ key, value }) => ({
  id: stableUuid(key),
  side: value.side,
  value: Number(value.value) || 0,
  reason: String(value.reason ?? "migrated"),
  session_id: value.sessionId ?? null,
  created_at: iso(value.createdAt),
}));

const claims = claimEntries
  .map(({ value }) => ({
    session_id: String(value.sessionId ?? ""),
    created_at: iso(value.createdAt),
    value: 1,
  }))
  .filter((row) => row.session_id);

const orders = orderEntries.map(({ key, value }) => ({
  id: /^[0-9a-f-]{36}$/i.test(String(value.id)) ? value.id : stableUuid(key),
  gift_id: String(value.giftId),
  amount_cents: Number(value.amountCents) || 0,
  score_value: Number(value.scoreValue) || 0,
  status: ["pending", "confirmed", "cancelled"].includes(value.status) ? value.status : "pending",
  provider: String(value.provider ?? "migrated"),
  session_id: value.sessionId ?? null,
  payment_ref: value.paymentRef ?? null,
  created_at: iso(value.createdAt),
  confirmed_at: value.confirmedAt ? iso(value.confirmedAt) : null,
}));

if (ledger.some((row) => !["support", "against"].includes(row.side))) {
  throw new Error("ledger 中存在未知 side，已停止迁移");
}

console.log(JSON.stringify({
  mode: apply ? "apply" : "dry-run",
  ledger: ledger.length,
  claims: claims.length,
  orders: orders.length,
  giftsConfig: Array.isArray(giftsConfig) ? giftsConfig.length : 0,
}, null, 2));

await upsert("ledger", ledger, "id");
await upsert("claims", claims, "session_id");
await upsert("orders", orders, "id");
if (apply && Array.isArray(giftsConfig)) {
  const { error } = await target.from("config").upsert({
    key: "gifts",
    value: giftsConfig,
    updated_at: new Date().toISOString(),
  }, { onConflict: "key" });
  if (error) throw error;
}

if (!apply) console.log("仅预览，没有写入 Supabase。确认 SQL 已执行后，加 --apply 才会写入。");
else console.log("迁移完成。请在 Supabase 中抽查 ledger、claims、config、orders。");
