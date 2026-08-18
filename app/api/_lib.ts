import { env } from "cloudflare:workers";

export type RuntimeEnv = typeof env & {
  DB?: D1Database;
  PAYMENT_PROVIDER?: string;
  PAYMENT_WEBHOOK_SECRET?: string;
};

export const fallbackGifts = {
  spark: { name: "星火", priceCents: 600, scoreValue: 6, icon: "✦" },
  wave: { name: "声浪", priceCents: 1800, scoreValue: 25, icon: "≈" },
  pulse: { name: "心跳", priceCents: 6800, scoreValue: 100, icon: "◉" },
  signal: { name: "信号塔", priceCents: 12800, scoreValue: 220, icon: "⌁" },
} as const;

export function getSessionId(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)fj_session=([^;]+)/);
  return match?.[1] ?? crypto.randomUUID();
}

export function sessionCookie(id: string) {
  return `fj_session=${id}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...(init.headers ?? {}) },
  });
}

export function db() {
  return (env as RuntimeEnv).DB;
}

export function paymentProvider() {
  return (env as RuntimeEnv).PAYMENT_PROVIDER;
}

export async function scoreTotals() {
  const database = db();
  if (!database) return { support: 51284, against: 48216 };
  const rows = await database.prepare("SELECT side, COALESCE(SUM(value), 0) AS total FROM score_ledger GROUP BY side").all<{ side: string; total: number }>();
  const totals = { support: 0, against: 0 };
  for (const row of rows.results ?? []) if (row.side === "support" || row.side === "against") totals[row.side] = Number(row.total);
  return totals;
}

export async function appendScore(side: "support" | "against", value: number, reason: string, sessionId?: string) {
  const database = db();
  if (!database) return;
  await database.prepare("INSERT INTO score_ledger (id, side, value, reason, session_id, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), side, value, reason, sessionId ?? null, Date.now()).run();
}

export function adminToken(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const cookieToken = cookie.match(/(?:^|;\s*)fj_admin=([^;]+)/)?.[1];
  return cookieToken ?? request.headers.get("x-admin-token");
}

export function requireAdmin(request: Request) {
  const configured = (env as RuntimeEnv).ADMIN_TOKEN ?? (env as RuntimeEnv).ADMIN_PASSWORD;
  return Boolean(configured && adminToken(request) === configured);
}
