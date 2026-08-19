import { getStore, type Store } from "@netlify/blobs";

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

type LedgerRecord = {
  side: Side;
  value: number;
  reason: string;
  sessionId?: string | null;
  createdAt: number;
};

type StickClaim = {
  createdAt: number;
  sessionId: string;
  value: 1;
};

type OrderRecord = {
  id: string;
  giftId: string;
  amountCents: number;
  scoreValue: number;
  status: string;
  provider: string;
  createdAt: number;
};

const STORAGE_NAME = "fengsheng-field";
const INITIAL_SCORE = { support: 2000, against: 8000 };

let cachedStore: Store | null | undefined;

function storage() {
  if (cachedStore !== undefined) return cachedStore;
  try {
    cachedStore = getStore({ name: STORAGE_NAME, consistency: "strong" });
  } catch {
    cachedStore = null;
  }
  return cachedStore;
}

export function storageConfigured() {
  return Boolean(storage());
}

async function readJson<T>(key: string): Promise<T | null> {
  const store = storage();
  if (!store) return null;
  return (await store.get(key, { type: "json", consistency: "strong" })) as T | null;
}

async function listJson<T>(prefix: string): Promise<T[]> {
  const store = storage();
  if (!store) return [];
  const listed = await store.list({ prefix });
  const values = await Promise.all(
    listed.blobs.map(async ({ key }) => readJson<T>(key)),
  );
  return values.filter((value): value is T => value !== null);
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
  const ledger = await listJson<LedgerRecord>("ledger/");
  const totals = { ...INITIAL_SCORE };
  for (const row of ledger) totals[row.side] += Number(row.value) || 0;
  return totals;
}

export async function appendScore(
  side: Side,
  value: number,
  reason: string,
  sessionId?: string,
) {
  const store = storage();
  if (!store) return false;
  await store.setJSON(`ledger/${crypto.randomUUID()}`, {
    side,
    value,
    reason,
    sessionId: sessionId ?? null,
    createdAt: Date.now(),
  } satisfies LedgerRecord);
  return true;
}

export async function latestSupportStickClaim(sessionId: string) {
  const store = storage();
  if (!store) return null;
  return (await store.get(`claims/guard/${encodeURIComponent(sessionId)}`, {
    type: "json",
    consistency: "strong",
  })) as StickClaim | null;
}

export async function claimSupportStick(sessionId: string, now = Date.now()) {
  const store = storage();
  if (!store) return { status: "unavailable" as const };

  const key = `claims/guard/${encodeURIComponent(sessionId)}`;
  const current = await store.getWithMetadata(key, {
    type: "json",
    consistency: "strong",
  });
  const cooldownMs = 60 * 60 * 1000;
  const latest = current?.data as StickClaim | undefined;
  if (latest && latest.createdAt + cooldownMs > now) {
    return { status: "cooldown" as const, nextAt: latest.createdAt + cooldownMs };
  }

  const claim: StickClaim = { createdAt: now, sessionId, value: 1 };
  const result = current
    ? await store.setJSON(key, claim, { onlyIfMatch: current.etag })
    : await store.setJSON(key, claim, { onlyIfNew: true });

  if (!result.modified) {
    const winner = await latestSupportStickClaim(sessionId);
    return {
      status: "cooldown" as const,
      nextAt: winner ? winner.createdAt + cooldownMs : now + cooldownMs,
    };
  }

  await store.setJSON(`ledger/stick-${crypto.randomUUID()}`, {
    side: "support",
    value: 1,
    reason: "support_stick",
    sessionId,
    createdAt: now,
  } satisfies LedgerRecord);

  return { status: "claimed" as const, nextAt: now + cooldownMs, value: 1 };
}

function fallbackGiftRecords(): GiftRecord[] {
  return Object.entries(fallbackGifts).map(([id, gift]) => ({
    id,
    ...gift,
    enabled: true,
  }));
}

export async function listGifts() {
  const saved = await readJson<GiftRecord[]>("config/gifts");
  return saved?.length ? saved : fallbackGiftRecords();
}

export async function updateGift(id: string, input: Partial<Omit<GiftRecord, "id">>) {
  const store = storage();
  if (!store) return false;
  const gifts = await listGifts();
  const next = gifts.map((gift) => (gift.id === id ? { ...gift, ...input, id } : gift));
  if (!next.some((gift) => gift.id === id)) return false;
  await store.setJSON("config/gifts", next);
  return true;
}

export async function listOrders() {
  const orders = await listJson<OrderRecord>("orders/");
  return orders.sort((a, b) => b.createdAt - a.createdAt).slice(0, 30);
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
