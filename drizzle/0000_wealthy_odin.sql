CREATE TABLE `admin_audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`actor` text NOT NULL,
	`detail` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `anonymous_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`side` text,
	`created_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gifts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`price_cents` integer NOT NULL,
	`score_value` integer NOT NULL,
	`icon` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text,
	`gift_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`score_value` integer NOT NULL,
	`status` text NOT NULL,
	`provider` text NOT NULL,
	`provider_transaction_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quiz_options` (
	`id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`label` text NOT NULL,
	`position` integer NOT NULL,
	`enabled` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quiz_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`side` text NOT NULL,
	`question` text NOT NULL,
	`position` integer NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `score_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`side` text NOT NULL,
	`value` integer NOT NULL,
	`reason` text NOT NULL,
	`session_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `side_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `support_stick_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `side_settings` (`key`, `value`, `updated_at`) VALUES
('support_label', '支持时代峰峻', 0),
('against_label', '反对时代峰峻', 0),
('stick_cooldown_seconds', '3600', 0);
--> statement-breakpoint
INSERT INTO `gifts` (`id`, `name`, `price_cents`, `score_value`, `icon`, `enabled`, `created_at`) VALUES
('spark', '星火', 600, 6, '✦', 1, 0),
('wave', '声浪', 1800, 25, '≈', 1, 0),
('pulse', '心跳', 6800, 100, '◉', 1, 0),
('signal', '信号塔', 12800, 220, '⌁', 1, 0);
--> statement-breakpoint
INSERT INTO `score_ledger` (`id`, `side`, `value`, `reason`, `session_id`, `created_at`) VALUES
('seed-support', 'support', 51284, 'seed', NULL, 0),
('seed-against', 'against', 48216, 'seed', NULL, 0);
--> statement-breakpoint
INSERT INTO `quiz_questions` (`id`, `side`, `question`, `position`, `enabled`, `created_at`) VALUES
('support-watch', 'support', '你会持续关注时代峰峻吗？', 1, 1, 0),
('support-reason', 'support', '你为什么选择支持？', 2, 1, 0),
('support-action', 'support', '现在你愿意做什么？', 3, 1, 0),
('against-management', 'against', '你反对时代峰峻的主要原因是？', 1, 1, 0),
('against-experience', 'against', '哪种经历让你决定反对？', 2, 1, 0),
('against-action', 'against', '现在你想留下哪种反对声音？', 3, 1, 0);
--> statement-breakpoint
INSERT INTO `quiz_options` (`id`, `question_id`, `label`, `position`, `enabled`) VALUES
('support-watch-1', 'support-watch', '一直关注', 1, 1), ('support-watch-2', 'support-watch', '偶尔关注', 2, 1), ('support-watch-3', 'support-watch', '今天开始关注', 3, 1),
('support-reason-1', 'support-reason', '喜欢艺人', 1, 1), ('support-reason-2', 'support-reason', '认可成长', 2, 1), ('support-reason-3', 'support-reason', '想为喜欢应援', 3, 1),
('support-action-1', 'support-action', '点亮应援棒', 1, 1), ('support-action-2', 'support-action', '送出特效礼物', 2, 1), ('support-action-3', 'support-action', '留下支持值', 3, 1),
('against-management-1', 'against-management', '管理方式', 1, 1), ('against-management-2', 'against-management', '资源分配', 2, 1), ('against-management-3', 'against-management', '沟通方式', 3, 1),
('against-experience-1', 'against-experience', '长期不满', 1, 1), ('against-experience-2', 'against-experience', '看到相关事件', 2, 1), ('against-experience-3', 'against-experience', '对运营失望', 3, 1),
('against-action-1', 'against-action', '明确反对', 1, 1), ('against-action-2', 'against-action', '记录理由', 2, 1), ('against-action-3', 'against-action', '让更多人看到', 3, 1);
