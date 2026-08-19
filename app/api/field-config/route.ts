import { json } from "../_lib";

const fallbackQuestions = [
  { id: "support-tf5-member", side: "support", question: "你最想为 TF 五代哪位公开练习生发声？", options: ["吕政熙", "高铭阳", "智恩涵", "沈子航", "朱映宸", "刘瀚辰"] },
  { id: "support-tf5-focus", side: "support", question: "你最关注 TF 五代哪类公开物料？", options: ["声乐练习日志", "舞蹈考核片段", "训练日常记录", "家族舞台"] },
  { id: "support-tf5-status", side: "support", question: "TF 五代当前更接近哪种状态？", options: ["公开练习生阶段", "已经正式出道", "已有固定出道团"] },
  { id: "support-tf5-signal", side: "support", question: "如果为 TF 五代增加一条现场信号，你会选？", options: ["让更多人看见舞台", "记录每次成长", "要求被认真对待"] },
  { id: "against-management", side: "against", question: "你最反感时代峰峻哪个管理环节？", options: ["资源安排", "艺人管理", "粉丝沟通", "公开回应"] },
  { id: "against-experience", side: "against", question: "哪种体验让你开始不再支持？", options: ["等不到说明", "看不到规划", "感到不被尊重", "其他管理问题"] },
  { id: "against-evidence", side: "against", question: "你想留下哪种可以核实的反对声量？", options: ["记录事实", "要求解释", "要求改进", "提出建议"] },
  { id: "against-direction", side: "against", question: "你希望这条反对声量最终指向什么？", options: ["更透明的规则", "更清晰的安排", "更及时的回应", "更负责的管理"] },
];

export async function GET() {
  return json({ labels: { support: "支持 TF 五代", against: "反对时代峰峻" }, questions: fallbackQuestions });
}
