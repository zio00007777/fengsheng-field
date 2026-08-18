UPDATE `quiz_questions` SET `enabled` = 0 WHERE `side` = 'support';
--> statement-breakpoint
UPDATE `quiz_options` SET `enabled` = 0 WHERE `question_id` IN (SELECT `id` FROM `quiz_questions` WHERE `side` = 'support');
--> statement-breakpoint
UPDATE `quiz_questions` SET `enabled` = 0 WHERE `side` = 'against';
--> statement-breakpoint
UPDATE `quiz_options` SET `enabled` = 0 WHERE `question_id` IN (SELECT `id` FROM `quiz_questions` WHERE `side` = 'against');
--> statement-breakpoint
UPDATE `side_settings` SET `value` = '支持 TF 五代' WHERE `key` = 'support_label';
--> statement-breakpoint
INSERT OR IGNORE INTO `quiz_questions` (`id`, `side`, `question`, `position`, `enabled`, `created_at`) VALUES
('support-tf5-member', 'support', '你最想为 TF 五代哪位公开练习生发声？', 1, 1, 0),
('support-tf5-focus', 'support', '你最关注 TF 五代哪类公开物料？', 2, 1, 0),
('support-tf5-status', 'support', 'TF 五代当前更接近哪种状态？', 3, 1, 0),
('support-tf5-signal', 'support', '如果为 TF 五代增加一条现场信号，你会选？', 4, 1, 0),
('against-management-v2', 'against', '你最反感时代峰峻哪个管理环节？', 1, 1, 0),
('against-experience-v2', 'against', '哪种体验让你开始不再支持？', 2, 1, 0),
('against-evidence-v2', 'against', '你想留下哪种可以核实的反对声量？', 3, 1, 0),
('against-direction-v2', 'against', '你希望这条反对声量最终指向什么？', 4, 1, 0);
--> statement-breakpoint
INSERT OR IGNORE INTO `quiz_options` (`id`, `question_id`, `label`, `position`, `enabled`) VALUES
('support-tf5-member-1', 'support-tf5-member', '吕政熙', 1, 1), ('support-tf5-member-2', 'support-tf5-member', '高铭阳', 2, 1), ('support-tf5-member-3', 'support-tf5-member', '智恩涵', 3, 1), ('support-tf5-member-4', 'support-tf5-member', '沈子航', 4, 1), ('support-tf5-member-5', 'support-tf5-member', '朱映宸', 5, 1), ('support-tf5-member-6', 'support-tf5-member', '刘瀚辰', 6, 1),
('support-tf5-focus-1', 'support-tf5-focus', '声乐练习日志', 1, 1), ('support-tf5-focus-2', 'support-tf5-focus', '舞蹈考核片段', 2, 1), ('support-tf5-focus-3', 'support-tf5-focus', '训练日常记录', 3, 1), ('support-tf5-focus-4', 'support-tf5-focus', '家族舞台', 4, 1),
('support-tf5-status-1', 'support-tf5-status', '公开练习生阶段', 1, 1), ('support-tf5-status-2', 'support-tf5-status', '已经正式出道', 2, 1), ('support-tf5-status-3', 'support-tf5-status', '已有固定出道团', 3, 1),
('support-tf5-signal-1', 'support-tf5-signal', '让更多人看见舞台', 1, 1), ('support-tf5-signal-2', 'support-tf5-signal', '记录每次成长', 2, 1), ('support-tf5-signal-3', 'support-tf5-signal', '要求被认真对待', 3, 1),
('against-management-v2-1', 'against-management-v2', '资源安排', 1, 1), ('against-management-v2-2', 'against-management-v2', '艺人管理', 2, 1), ('against-management-v2-3', 'against-management-v2', '粉丝沟通', 3, 1), ('against-management-v2-4', 'against-management-v2', '公开回应', 4, 1),
('against-experience-v2-1', 'against-experience-v2', '等不到说明', 1, 1), ('against-experience-v2-2', 'against-experience-v2', '看不到规划', 2, 1), ('against-experience-v2-3', 'against-experience-v2', '感到不被尊重', 3, 1), ('against-experience-v2-4', 'against-experience-v2', '其他管理问题', 4, 1),
('against-evidence-v2-1', 'against-evidence-v2', '记录事实', 1, 1), ('against-evidence-v2-2', 'against-evidence-v2', '要求解释', 2, 1), ('against-evidence-v2-3', 'against-evidence-v2', '要求改进', 3, 1), ('against-evidence-v2-4', 'against-evidence-v2', '提出建议', 4, 1),
('against-direction-v2-1', 'against-direction-v2', '更透明的规则', 1, 1), ('against-direction-v2-2', 'against-direction-v2', '更清晰的安排', 2, 1), ('against-direction-v2-3', 'against-direction-v2', '更及时的回应', 3, 1), ('against-direction-v2-4', 'against-direction-v2', '更负责的管理', 4, 1);
