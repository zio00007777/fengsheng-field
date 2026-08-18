UPDATE `quiz_questions` SET `enabled` = 0;
--> statement-breakpoint
UPDATE `quiz_options` SET `enabled` = 0;
--> statement-breakpoint
INSERT OR IGNORE INTO `quiz_questions` (`id`, `side`, `question`, `position`, `enabled`, `created_at`) VALUES
('support-favorite-group', 'support', '你最喜欢时代峰峻旗下哪一组？', 1, 1, 0),
('support-favorite-member', 'support', '你最喜欢时代少年团哪位成员？', 2, 1, 0),
('support-tnt-debut', 'support', '时代少年团正式出道是哪一年？', 3, 1, 0),
('support-tfboys-debut', 'support', 'TFBOYS 正式出道是哪一年？', 4, 1, 0),
('against-management', 'against', '你最反感时代峰峻哪个环节？', 1, 1, 0),
('against-focus', 'against', '哪类问题最影响你对公司的判断？', 2, 1, 0),
('against-timeline', 'against', '你是从哪个阶段开始形成反对态度？', 3, 1, 0),
('against-action', 'against', '你希望留下哪种有依据的反对意见？', 4, 1, 0);
--> statement-breakpoint
INSERT OR IGNORE INTO `quiz_options` (`id`, `question_id`, `label`, `position`, `enabled`) VALUES
('support-favorite-group-1', 'support-favorite-group', 'TFBOYS', 1, 1), ('support-favorite-group-2', 'support-favorite-group', '时代少年团', 2, 1), ('support-favorite-group-3', 'support-favorite-group', 'TF家族练习生', 3, 1),
('support-favorite-member-1', 'support-favorite-member', '马嘉祺', 1, 1), ('support-favorite-member-2', 'support-favorite-member', '丁程鑫', 2, 1), ('support-favorite-member-3', 'support-favorite-member', '宋亚轩', 3, 1), ('support-favorite-member-4', 'support-favorite-member', '刘耀文', 4, 1), ('support-favorite-member-5', 'support-favorite-member', '张真源', 5, 1), ('support-favorite-member-6', 'support-favorite-member', '严浩翔', 6, 1), ('support-favorite-member-7', 'support-favorite-member', '贺峻霖', 7, 1),
('support-tnt-debut-1', 'support-tnt-debut', '2018', 1, 1), ('support-tnt-debut-2', 'support-tnt-debut', '2019', 2, 1), ('support-tnt-debut-3', 'support-tnt-debut', '2020', 3, 1),
('support-tfboys-debut-1', 'support-tfboys-debut', '2012', 1, 1), ('support-tfboys-debut-2', 'support-tfboys-debut', '2013', 2, 1), ('support-tfboys-debut-3', 'support-tfboys-debut', '2014', 3, 1),
('against-management-1', 'against-management', '艺人管理', 1, 1), ('against-management-2', 'against-management', '资源分配', 2, 1), ('against-management-3', 'against-management', '粉丝沟通', 3, 1),
('against-focus-1', 'against-focus', '行程与休息', 1, 1), ('against-focus-2', 'against-focus', '舞台与制作', 2, 1), ('against-focus-3', 'against-focus', '公开回应', 3, 1),
('against-timeline-1', 'against-timeline', 'TFBOYS 时期', 1, 1), ('against-timeline-2', 'against-timeline', '时代少年团时期', 2, 1), ('against-timeline-3', 'against-timeline', '最近的事件', 3, 1),
('against-action-1', 'against-action', '记录事实', 1, 1), ('against-action-2', 'against-action', '指出管理问题', 2, 1), ('against-action-3', 'against-action', '要求公开回应', 3, 1);
