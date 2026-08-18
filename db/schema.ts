import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const created = () => integer("created_at", { mode: "number" }).notNull();

export const sideSettings = sqliteTable("side_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "number" }).notNull(),
});

export const quizQuestions = sqliteTable("quiz_questions", {
  id: text("id").primaryKey(),
  side: text("side", { enum: ["support", "against"] }).notNull(),
  question: text("question").notNull(),
  position: integer("position").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: created(),
});

export const quizOptions = sqliteTable("quiz_options", {
  id: text("id").primaryKey(),
  questionId: text("question_id").notNull(),
  label: text("label").notNull(),
  position: integer("position").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
});

export const gifts = sqliteTable("gifts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  priceCents: integer("price_cents").notNull(),
  scoreValue: integer("score_value").notNull(),
  icon: text("icon").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: created(),
});

export const anonymousSessions = sqliteTable("anonymous_sessions", {
  id: text("id").primaryKey(),
  side: text("side", { enum: ["support", "against"] }),
  createdAt: created(),
  lastSeenAt: integer("last_seen_at", { mode: "number" }).notNull(),
});

export const scoreLedger = sqliteTable("score_ledger", {
  id: text("id").primaryKey(),
  side: text("side", { enum: ["support", "against"] }).notNull(),
  value: integer("value").notNull(),
  reason: text("reason").notNull(),
  sessionId: text("session_id"),
  createdAt: created(),
});

export const supportStickClaims = sqliteTable("support_stick_claims", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  createdAt: created(),
}, (table) => ({
  sessionCreatedAt: index("support_stick_claims_session_created_at").on(table.sessionId, table.createdAt),
}));

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  sessionId: text("session_id"),
  giftId: text("gift_id").notNull(),
  amountCents: integer("amount_cents").notNull(),
  scoreValue: integer("score_value").notNull(),
  status: text("status", { enum: ["pending", "paid", "cancelled", "expired"] }).notNull(),
  provider: text("provider").notNull(),
  providerTransactionId: text("provider_transaction_id"),
  createdAt: created(),
});

export const adminAuditLogs = sqliteTable("admin_audit_logs", {
  id: text("id").primaryKey(),
  action: text("action").notNull(),
  actor: text("actor").notNull(),
  detail: text("detail"),
  createdAt: created(),
});
