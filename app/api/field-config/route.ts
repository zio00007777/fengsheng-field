import { db, json } from "../_lib";

const fallbackQuestions = [
  { id: "support-watch", side: "support", question: "你会持续关注时代峰峻吗？", options: ["一直关注", "偶尔关注", "今天开始关注"] },
  { id: "support-reason", side: "support", question: "你为什么选择支持？", options: ["喜欢艺人", "认可成长", "想为喜欢应援"] },
  { id: "support-action", side: "support", question: "现在你愿意做什么？", options: ["点亮应援棒", "送出特效礼物", "留下支持值"] },
  { id: "against-management", side: "against", question: "你反对时代峰峻的主要原因是？", options: ["管理方式", "资源分配", "沟通方式"] },
  { id: "against-experience", side: "against", question: "哪种经历让你决定反对？", options: ["长期不满", "看到相关事件", "对运营失望"] },
  { id: "against-action", side: "against", question: "现在你想留下哪种反对声音？", options: ["明确反对", "记录理由", "让更多人看到"] },
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
