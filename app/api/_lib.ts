import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Side = "support" | "against";

export const fallbackGifts = {
  spark: { name: "星火", priceCents: 600, scoreValue: 60, icon: "✦" },
  wave: { name: "声浪", priceCents: 1800, scoreValue: 250, icon: "≈" },
  pulse: { name: "心跳", priceCents: 6800, scoreValue: 1000, icon: "◉" },
  signal: { name: "信号塔", priceCents: 12800, scoreValue: 2200, icon: "⌁" },
} as const;

export type GiftRecord = {
  id: string;
  name: string;
  priceCents: number;
  scoreValue: number;
  icon: string;
  enabled: boolean;
};

export type OrderRecord = {
  id: string;
  giftId: string;
  amountCents: number;
  scoreValue: number;
  status: string;
  provider: string;
  sessionId?: string | null;
  paymentRef?: string | null;
  createdAt: number;
  confirmedAt?: number | null;
};

type SupabaseRow = Record<string, unknown>;

const INITIAL_SCORE = { support: 2000, against: 8000 };
let cachedDatabase: SupabaseClient | null | undefined;

function database() {
  if (cachedDatabase !== undefined) return cachedDatabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    cachedDatabase = null;
    return cachedDatabase;
  }

  cachedDatabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedDatabase;
}

export function storageConfigured() {
  return Boolean(database());
}

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
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers ?? {}),
    },
  });
}

export function paymentProvider() {
  return process.env.PAYMENT_PROVIDER;
}

export async function scoreTotals() {
  const db = database();
  if (!db) return { ...INITIAL_SCORE };

  const { data, error } = await db.from("ledger").select("side,value");
  if (error) throw error;

  const totals = { ...INITIAL_SCORE };
  for (const row of data ?? []) {
    if (row.side === "support" || row.side === "against") {
      totals[row.side] += Number(row.value) || 0;
    }
  }
  return totals;
}

export async function appendScore(
  side: Side,
  value: number,
  reason: string,
  sessionId?: string,
) {
  const db = database();
  if (!db) return false;

  const { error } = await db.from("ledger").insert({
    id: crypto.randomUUID(),
    side,
    value,
    reason,
    session_id: sessionId ?? null,
    created_at: new Date().toISOString(),
  });
  return !error;
}

export async function latestSupportStickClaim(sessionId: string) {
  const db = database();
  if (!db) return null;

  const { data, error } = await db
    .from("claims")
    .select("created_at,session_id,value")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    createdAt: new Date(String(data.created_at)).getTime(),
    sessionId: String(data.session_id),
    value: Number(data.value) as 1,
  };
}

export async function claimSupportStick(sessionId: string, now = Date.now()) {
  const db = database();
  if (!db) return { status: "unavailable" as const };

  const { data, error } = await db.rpc("claim_support_stick", {
    p_session_id: sessionId,
    p_now: new Date(now).toISOString(),
  });
  if (error) throw error;

  const row = (Array.isArray(data) ? data[0] : data) as SupabaseRow | undefined;
  if (!row) return { status: "unavailable" as const };
  const status = String(row.status);
  const nextAt = row.next_at ? new Date(String(row.next_at)).getTime() : now + 3600000;
  if (status === "cooldown") return { status: "cooldown" as const, nextAt };
  return { status: "claimed" as const, nextAt, value: Number(row.value) || 1 };
}

function fallbackGiftRecords(): GiftRecord[] {
  return Object.entries(fallbackGifts).map(([id, gift]) => ({
    id,
    ...gift,
    enabled: true,
  }));
}

function mapGift(row: SupabaseRow): GiftRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    priceCents: Number(row.price_cents),
    scoreValue: Number(row.score_value),
    icon: String(row.icon ?? "✦"),
    enabled: Boolean(row.enabled),
  };
}

export async function listGifts() {
  const db = database();
  if (!db) return fallbackGiftRecords();

  const { data, error } = await db.from("config").select("value").eq("key", "gifts").maybeSingle();
  if (error || !data || !Array.isArray(data.value)) return fallbackGiftRecords();
  return (data.value as SupabaseRow[]).map(mapGift);
}

export async function updateGift(id: string, input: Partial<Omit<GiftRecord, "id">>) {
  const db = database();
  if (!db) return false;

  const gifts = await listGifts();
  const next = gifts.map((gift) => (gift.id === id ? { ...gift, ...input, id } : gift));
  if (!next.some((gift) => gift.id === id)) return false;

  const { error } = await db.from("config").upsert({
    key: "gifts",
    value: next,
    updated_at: new Date().toISOString(),
  });
  return !error;
}

function mapOrder(row: SupabaseRow): OrderRecord {
  return {
    id: String(row.id),
    giftId: String(row.gift_id),
    amountCents: Number(row.amount_cents),
    scoreValue: Number(row.score_value),
    status: String(row.status),
    provider: String(row.provider),
    sessionId: row.session_id ? String(row.session_id) : null,
    paymentRef: row.payment_ref ? String(row.payment_ref) : null,
    createdAt: new Date(String(row.created_at)).getTime(),
    confirmedAt: row.confirmed_at ? new Date(String(row.confirmed_at)).getTime() : null,
  };
}

export async function listOrders() {
  const db = database();
  if (!db) return [];

  const { data, error } = await db
    .from("orders")
    .select("id,gift_id,amount_cents,score_value,status,provider,session_id,payment_ref,created_at,confirmed_at")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

export async function createPendingOrder(giftId: string, sessionId: string) {
  const db = database();
  if (!db) return { status: "unavailable" as const };

  const gift = (await listGifts()).find((item) => item.id === giftId && item.enabled);
  if (!gift) return { status: "invalid_gift" as const };

  const orderId = crypto.randomUUID();
  const { error } = await db.from("orders").insert({
    id: orderId,
    gift_id: gift.id,
    amount_cents: gift.priceCents,
    score_value: gift.scoreValue,
    status: "pending",
    provider: "alipay_qrcode_manual",
    session_id: sessionId,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;

  return { status: "created" as const, orderId, gift };
}

export async function confirmGiftOrder(orderId: string) {
  const db = database();
  if (!db) return { status: "unavailable" as const };

  const { data, error } = await db.rpc("confirm_gift_order", {
    p_order_id: orderId,
    p_now: new Date().toISOString(),
  });
  if (error) throw error;

  const row = (Array.isArray(data) ? data[0] : data) as SupabaseRow | undefined;
  if (!row) return { status: "unavailable" as const };
  return {
    status: String(row.status) as "confirmed" | "already_confirmed" | "too_early" | "not_found" | "invalid_status",
    scoreValue: Number(row.score_value) || 0,
  };
}

export function adminToken(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const cookieToken = cookie.match(/(?:^|;\s*)fj_admin=([^;]+)/)?.[1];
  return cookieToken ?? request.headers.get("x-admin-token");
}

export function requireAdmin(request: Request) {
  const configured = process.env.ADMIN_TOKEN ?? process.env.ADMIN_PASSWORD;
  return Boolean(configured && adminToken(request) === configured);
}
