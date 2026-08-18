import { db, json } from "../_lib";

const fallbackQuestions = [
  { id: "support-favorite-group", side: "support", question: "你最喜欢时代峰峻旗下哪一组？", options: ["TFBOYS", "时代少年团", "TF家族练习生"] },
  { id: "support-favorite-member", side: "support", question: "你最喜欢时代少年团哪位成员？", options: ["马嘉祺", "丁程鑫", "宋亚轩", "刘耀文", "张真源", "严浩翔", "贺峻霖"] },
  { id: "support-tnt-debut", side: "support", question: "时代少年团正式出道是哪一年？", options: ["2018", "2019", "2020"] },
  { id: "support-tfboys-debut", side: "support", question: "TFBOYS 正式出道是哪一年？", options: ["2012", "2013", "2014"] },
  { id: "against-management", side: "against", question: "你最反感时代峰峻哪个环节？", options: ["艺人管理", "资源分配", "粉丝沟通"] },
  { id: "against-focus", side: "against", question: "哪类问题最影响你对公司的判断？", options: ["行程与休息", "舞台与制作", "公开回应"] },
  { id: "against-timeline", side: "against", question: "你是从哪个阶段开始形成反对态度？", options: ["TFBOYS 时期", "时代少年团时期", "最近的事件"] },
  { id: "against-action", side: "against", question: "你希望留下哪种有依据的反对意见？", options: ["记录事实", "指出管理问题", "要求公开回应"] },
];

export async function GET() {
  const database = db();
  if (!database) return json({ labels: { support: "支持时代峰峻", against: "反对时代峰峻" }, questions: fallbackQuestions });
  const [settings, questions] = await Promise.all([
    database.prepare("SELECT key, value FROM side_settings WHERE key IN ('support_label', 'against_label')").all<{ key: string; value: string }>(),
    database.prepare("SELECT q.id, q.side, q.question, o.label AS option FROM quiz_questions q LEFT JOIN quiz_options o ON o.question_id = q.id AND o.enabled = 1 WHERE q.enabled = 1 ORDER BY q.side, q.position, o.position").all<{ id: string; side: string; question: string; option: string }>(),
  ]);
  const labels = { support: "支持时代峰峻", against: "反对时代峰峻" };
  for (const row of settings.results ?? []) if (row.key === "support_label" || row.key === "against_label") labels[row.key === "support_label" ? "support" : "against"] = row.value;
  const grouped = new Map<string, { id: string; side: string; question: string; options: string[] }>();
  for (const row of questions.results ?? []) { const current = grouped.get(row.id) ?? { id: row.id, side: row.side, question: row.question, options: [] }; if (row.option) current.options.push(row.option); grouped.set(row.id, current); }
  return json({ labels, questions: [...grouped.values()] });
}
