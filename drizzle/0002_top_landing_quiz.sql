UPDATE `quiz_questions` SET `enabled` = 0 WHERE `id` = 'support-tnt-debut';
--> statement-breakpoint
UPDATE `quiz_options` SET `enabled` = 0 WHERE `question_id` = 'support-tnt-debut';
--> statement-breakpoint
INSERT OR IGNORE INTO `quiz_questions` (`id`, `side`, `question`, `position`, `enabled`, `created_at`) VALUES
('support-top-debut', 'support', 'TOP登陆少年正式亮相是哪一年？', 3, 1, 0);
--> statement-breakpoint
INSERT OR IGNORE INTO `quiz_options` (`id`, `question_id`, `label`, `position`, `enabled`) VALUES
('support-top-debut-1', 'support-top-debut', '2023', 1, 1),
('support-top-debut-2', 'support-top-debut', '2024', 2, 1),
('support-top-debut-3', 'support-top-debut', '2025', 3, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO `quiz_options` (`id`, `question_id`, `label`, `position`, `enabled`) VALUES
('support-favorite-group-4', 'support-favorite-group', 'TOP登陆少年', 4, 1);
