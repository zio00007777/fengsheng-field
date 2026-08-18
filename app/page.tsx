"use client";

import { useEffect, useState } from "react";

type Side = "support" | "against";
type Gift = { id: string; name: string; price: number; value: number; image: string };
type Quiz = { id: string; question: string; options: string[] };

const quizSets: Record<Side, Quiz[]> = {
  support: [
    { id: "tf5-member", question: "你最想为 TF 五代哪位公开练习生发声？", options: ["吕政熙", "高铭阳", "智恩涵", "沈子航", "朱映宸", "刘瀚辰"] },
    { id: "tf5-focus", question: "你最关注 TF 五代哪类公开物料？", options: ["声乐练习日志", "舞蹈考核片段", "训练日常记录", "家族舞台"] },
    { id: "tf5-status", question: "TF 五代当前更接近哪种状态？", options: ["公开练习生阶段", "已经正式出道", "已有固定出道团"] },
    { id: "tf5-signal", question: "如果为 TF 五代增加一条现场信号，你会选？", options: ["让更多人看见舞台", "记录每次成长", "要求被认真对待"] },
  ],
  against: [
    { id: "management", question: "你最反感时代峰峻哪个管理环节？", options: ["资源安排", "艺人管理", "粉丝沟通", "公开回应"] },
    { id: "experience", question: "哪种体验让你开始不再支持？", options: ["等不到说明", "看不到规划", "感到不被尊重", "其他管理问题"] },
    { id: "evidence", question: "你想留下哪种可以核实的反对声量？", options: ["记录事实", "要求解释", "要求改进", "提出建议"] },
    { id: "direction", question: "你希望这条反对声量最终指向什么？", options: ["更透明的规则", "更清晰的安排", "更及时的回应", "更负责的管理"] },
  ],
};

const gifts: Gift[] = [
  { id: "spark", name: "闪点", price: 6, value: 6, image: "gifts/star.png" },
  { id: "wave", name: "声浪", price: 18, value: 25, image: "gifts/wave.png" },
  { id: "pulse", name: "心跳", price: 68, value: 100, image: "gifts/heartbeat.png" },
  { id: "signal", name: "信号塔", price: 128, value: 220, image: "gifts/tower.png" },
];

const initialScore = { support: 6842, against: 6219 };

function number(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function Countdown({ seconds }: { seconds: number }) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  return <>{minutes}:{rest}</>;
}

export default function Home() {
  const [phase, setPhase] = useState<"choose" | "quiz" | "score" | "arena">("choose");
  const [side, setSide] = useState<Side | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [supportScore, setSupportScore] = useState(initialScore.support);
  const [againstScore, setAgainstScore] = useState(initialScore.against);
  const [visualNudge, setVisualNudge] = useState({ support: 0, against: 0 });
  const [signalPulse, setSignalPulse] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [gift, setGift] = useState<Gift | null>(null);
  const [againstReason, setAgainstReason] = useState("");
  const [notice, setNotice] = useState("");

  const questions = side ? quizSets[side] : [];
  const question = questions[questionIndex];
  const activeLabel = side === "support" ? "支持 TF 五代" : "反对时代峰峻";
  const displaySupportScore = supportScore + visualNudge.support;
  const displayAgainstScore = againstScore + visualNudge.against;
  const total = displaySupportScore + displayAgainstScore;
  const supportPercent = Math.round((displaySupportScore / total) * 100);
  const againstPercent = 100 - supportPercent;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setVisualNudge((current) => ({ support: current.support + Math.floor(42 + Math.random() * 195), against: current.against + Math.floor(26 + Math.random() * 132) }));
      setSignalPulse(true);
      window.setTimeout(() => setSignalPulse(false), 360);
    }, 640);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/scoreboard").then((response) => response.ok ? response.json() : null).then((data) => {
      if (data?.support && data?.against) {
        setSupportScore(data.support);
        setAgainstScore(data.against);
      }
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function selectSide(nextSide: Side) {
    setSide(nextSide);
    setQuestionIndex(0);
    setAnswers([]);
    setSelectedAnswer("");
    setPhase("quiz");
  }

  function answerQuestion() {
    if (!side || !question || !selectedAnswer) return;
    const nextAnswers = [...answers, selectedAnswer];
    setAnswers(nextAnswers);
    setSelectedAnswer("");
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((current) => current + 1);
      return;
    }
    fetch("/api/quiz/answer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ side, answers: nextAnswers }) }).catch(() => undefined);
    setPhase("score");
  }

  function claimStick() {
    if (cooldown > 0) return;
    setSupportScore((current) => current + 1);
    setCooldown(3600);
    setNotice("TF 五代应援信号已点亮，支持值 +1");
    fetch("/api/support-stick/claim", { method: "POST" }).catch(() => undefined);
  }

  function sendAgainstReason() {
    if (!againstReason) return;
    setAgainstScore((current) => current + 1);
    setNotice("反对理由已留下，反对值 +1");
    setAgainstReason("");
    fetch("/api/side-selection", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ side: "against", reason: againstReason }) }).catch(() => undefined);
  }

  function buyGift() {
    if (!gift) return;
    const selectedGift = gift;
    fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ giftId: selectedGift.id }) })
      .then(async (response) => ({ ok: response.ok, data: await response.json().catch(() => null) }))
      .then(({ ok, data }) => {
        if (!ok || !data?.paymentUrl) {
          setNotice("真实支付通道尚未配置，未产生扣款");
          return;
        }
        window.location.assign(data.paymentUrl);
      })
      .catch(() => setNotice("支付服务暂时不可用，未产生扣款"));
  }

  return (
    <main className={`dispatch-room ${side === "support" ? "dispatch-support" : "dispatch-against"}`}>
      <header className="dispatch-header"><button onClick={() => setPhase("choose")}><b>FJ</b><span>立场调度台 / FIELD CONTROL</span></button><div><i /> LIVE SIGNAL <small>0.6s AUTO REFRESH</small></div><a href="/admin">后台</a></header>

      <section className="dispatch-stage">
        <aside className="dispatch-rail"><span>FIELD<br />001</span><b>实时<br />对立</b><i>二选一<br />才进入</i><em>TWO SIDES ONLY</em></aside>
        <div className="dispatch-core"><div className="core-meta"><span>现场入口 / LIVE ENTRY</span><b>同步中 00:06</b></div><h1>把立场<br /><em>变成现场。</em></h1><p>不要围观。选择一条声线，用四步问答确认你真正想支持的方向。</p><div className={`core-readout ${signalPulse ? "readout-pulse" : ""}`}><div><small>AGAINST / 反对时代峰峻</small><strong>{number(displayAgainstScore)}</strong></div><b>VS</b><div><small>SUPPORT / 支持 TF 五代</small><strong>{number(displaySupportScore)}</strong></div></div></div>
        <div className="dispatch-alert"><span>LIVE DECISION</span><strong>现在选边</strong><div className="alert-actions"><button onClick={() => selectSide("against")}><i>01</i><b>反对时代峰峻</b><small>进入反对声线 →</small></button><button onClick={() => selectSide("support")}><i>02</i><b>支持 TF 五代</b><small>进入支持声线 →</small></button></div><small className="alert-foot">四道问题 · 不能跳过 · 没有第三项</small></div>
      </section>

      <section className="opposition-map"><div className="map-heading"><span>LIVE TRAFFIC / 现场分流</span><h2>哪一条声线，<b>先抵达？</b></h2><p>实时数字只展示当前现场的声量变化。</p></div><div className="map-lanes"><article className="map-lane map-against"><header><span>01 / AGAINST</span><b>反对方</b></header><h3>反对时代峰峻</h3><div className="lane-number"><strong>{number(displayAgainstScore)}</strong><small>{againstPercent}% / SIGNALS</small></div><div className="lane-bar"><i style={{ width: `${againstPercent}%` }} /></div><button onClick={() => selectSide("against")}>留下反对理由 <b>↘</b></button></article><div className="map-divider"><b>VS</b><i /></div><article className="map-lane map-support"><header><span>02 / SUPPORT</span><b>支持方</b></header><h3>支持 TF 五代</h3><div className="lane-number"><strong>{number(displaySupportScore)}</strong><small>{supportPercent}% / SIGNALS</small></div><div className="lane-bar"><i style={{ width: `${supportPercent}%` }} /></div><button onClick={() => selectSide("support")}>为 TF 五代发声 <b>↘</b></button></article></div></section>

      <section className={`dispatch-scoreboard ${signalPulse ? "board-pulse" : ""}`}><div className="scoreboard-label"><span>LIVE SCOREBOARD</span><h2>现场总声量</h2><p>每一次选择都会让其中一条线继续向前。</p></div><div className="scoreboard-total"><small>当前合计</small><strong>{number(displayAgainstScore + displaySupportScore)}</strong><i>UNSTABLE / LIVE</i></div><div className="scoreboard-ratio"><div><b style={{ width: `${againstPercent}%` }} /><i style={{ width: `${supportPercent}%` }} /></div><span><b>反对 {againstPercent}%</b><b>支持 {supportPercent}%</b></span></div></section>

      {phase === "choose" && <section className="entry-lock"><div className="lock-index">01</div><div><span>START HERE / 选择入口</span><h2>先选一条声线，<br /><b>现场才会继续。</b></h2></div><p>支持 TF 五代会进入成员、物料与成长问答；反对时代峰峻会进入管理问题与事实意见问答。</p><div className="lock-note"><b>第三选项不存在</b><small>请选择下方任意一条通道</small></div></section>}

      {phase === "quiz" && side && question && <section className="instruction-card"><aside><span>FIELD CHECK / {side === "support" ? "TF5" : "AGAINST"}</span><strong>0{questionIndex + 1}<small>/04</small></strong><p>你的选择会决定下一条现场路径。</p></aside><div className="instruction-main"><div className="instruction-head"><span>{side === "support" ? "TF 五代支持确认" : "反对意见确认"}</span><b>回答 {questionIndex + 1} / 4</b></div><div className="instruction-progress"><i style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div><h2>{question.question}</h2><div className="instruction-options">{question.options.map((option, index) => <button className={selectedAnswer === option ? "selected" : ""} key={option} onClick={() => setSelectedAnswer(option)}><i>0{index + 1}</i><span>{option}</span><b>↗</b></button>)}</div><button className="instruction-confirm" disabled={!selectedAnswer} onClick={answerQuestion}>确认并进入下一题 <b>→</b></button></div></section>}

      {phase === "score" && side && <section className="entry-result"><div className="result-stamp">CONFIRMED</div><span>FIELD CHECK COMPLETE / STEP 05</span><h2>你的声线是<br /><b>{activeLabel}</b></h2><p>选择已经写入现场。现在进入你的阵营，完成一个实际动作。</p><div className="result-line"><span>反对 {number(displayAgainstScore)}</span><i /><span>支持 {number(displaySupportScore)}</span></div><button onClick={() => setPhase("arena")}>打开我的行动台 <b>→</b></button></section>}

      {phase === "arena" && side && <section className={`action-console ${side === "support" ? "console-support" : "console-against"}`}><div className="console-head"><span>YOUR ACTION CONSOLE / {side === "support" ? "02" : "01"}</span><h2>{activeLabel}</h2><p>{side === "support" ? "让支持变成一个可见、可累计的现场动作。" : "留下具体理由，把反对变成一条可读取的信号。"}</p></div>{side === "support" ? <div className="console-body"><div className="tf5-command"><div className="tf5-mark">TF<br /><b>5</b></div><div><span>HOURLY SIGNAL</span><h3>点亮 TF 五代应援棒 <b>+1</b></h3><small>{cooldown > 0 ? <>下一根可领取：<Countdown seconds={cooldown} /></> : "每小时可点亮一根"}</small></div><button disabled={cooldown > 0} onClick={claimStick}>{cooldown > 0 ? <Countdown seconds={cooldown} /> : "点亮"}</button></div><div className="gift-command-head"><span>BOOST PACK / 特效礼物</span><small>选择档位，增加对应支持值</small></div><div className="gift-actions">{gifts.map((item) => <button className="gift-card" key={item.id} onClick={() => setGift(item)}><span className="gift-card-glow" /><span className="gift-card-icon"><img src={item.image} alt="" /></span><strong>{item.name}</strong><small>¥{item.price} · +{item.value}</small><em>OPEN ↗</em></button>)}</div></div> : <div className="console-body against-body"><span className="reason-label">选择主要反对信号</span><div className="reason-grid">{quizSets.against[0].options.map((reason) => <button className={againstReason === reason ? "selected" : ""} key={reason} onClick={() => setAgainstReason(reason)}>{reason}<b>{againstReason === reason ? "✓" : "+"}</b></button>)}</div><button className="against-submit" disabled={!againstReason} onClick={sendAgainstReason}>发出这条反对信号 <b>→</b></button><p>只记录理由，不开放辱骂、人肉或骚扰内容。</p></div>}</section>}

      <footer className="dispatch-footer"><span>FJ / FIELD CONTROL</span><span>支持 TF 五代 · 反对时代峰峻</span><a href="/admin">ADMIN →</a></footer>
      {gift && <div className="gift-modal-backdrop"><div className="gift-modal"><button className="close-modal" onClick={() => setGift(null)}>×</button><span className="modal-kicker">SECURE PAYMENT GATE / TF5</span><div className="gift-modal-main"><img src={gift.image} alt="" /><div><h2>{gift.name}</h2><p>支付 ¥{gift.price}，支付确认后增加 TF 五代支持值 +{gift.value}</p></div></div><div className="secure-copy"><b>安全结算说明</b><span>订单、金额和应援值只在服务端生成；当前未配置商户证书，不会产生扣款。</span></div><button className="gift-pay" onClick={buyGift}>获取安全支付链接 <b>↗</b></button></div></div>}
      {notice && <div className="battle-toast">{notice}</div>}
    </main>
  );
}
