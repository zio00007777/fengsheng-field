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
    <main className={`signal-room ${side === "support" ? "support-room" : "against-room"}`}>
      <header className="signal-header">
        <button className="signal-brand" onClick={() => setPhase("choose")}><b>FJ</b><span>立场现场 / SIGNAL ROOM</span></button>
        <div className="signal-live"><i />LIVE <span>每 0.6 秒更新一次</span></div>
        <a href="/admin">后台</a>
      </header>

      <section className="tension-hero">
        <div className="hero-heading"><span>FIELD 001 / TWO SIDES ONLY</span><h1>现在，<em>站哪边？</em></h1><p>一个选择，四步确认。让你支持的声音先被看见。</p></div>
        <div className="battle-grid">
          <article className="side-panel panel-against">
            <div className="panel-top"><span>01 / AGAINST</span><b>反对方</b></div>
            <h2>反对<br /><strong>时代峰峻</strong></h2>
            <p>不认同，就把具体理由留下。拒绝人身攻击，只让可核实的意见进入现场。</p>
            <div className="panel-score"><small>当前现场声量</small><strong>{number(displayAgainstScore)}</strong><i>{againstPercent}%</i></div>
            <button onClick={() => selectSide("against")}>进入反对方 <b>→</b></button>
          </article>
          <div className="split-signal"><span>LIVE</span><b>VS</b><i /><small>选择<br />马上开始</small></div>
          <article className="side-panel panel-support">
            <div className="panel-top"><span>02 / SUPPORT</span><b>支持方</b></div>
            <h2>支持<br /><strong>TF 五代</strong></h2>
            <p>为公开练习生的每次训练、每个舞台留下支持，让成长有被看见的信号。</p>
            <div className="panel-score"><small>当前现场声量</small><strong>{number(displaySupportScore)}</strong><i>{supportPercent}%</i></div>
            <button onClick={() => selectSide("support")}>进入支持方 <b>→</b></button>
          </article>
        </div>
        <div className="hero-footer"><span><b>4</b> 道问题 · <b>1</b> 次选择 · <b>0</b> 个第三选项</span><b>实时信号持续滚动</b></div>
      </section>

      <section className={`live-board ${signalPulse ? "board-pulse" : ""}`}>
        <div className="board-title"><span>LIVE SCOREBOARD</span><h2>现场正在偏向哪边？</h2><p>数字是视觉化现场信号，真实累计以服务端记录为准。</p></div>
        <div className="board-side board-against"><small>反对时代峰峻</small><strong>{number(displayAgainstScore)}</strong><i>{againstPercent}%</i></div>
        <div className="board-vs">VS</div>
        <div className="board-side board-support"><small>支持 TF 五代</small><strong>{number(displaySupportScore)}</strong><i>{supportPercent}%</i></div>
        <div className="board-track"><span style={{ width: `${againstPercent}%` }} /><b style={{ width: `${supportPercent}%` }} /></div>
      </section>

      {phase === "choose" && <section className="guide-panel"><div><span>STEP 00 / CHOOSE</span><h2>先选方向，<br /><b>再让声音变大。</b></h2></div><div className="guide-copy"><p>支持 TF 五代，进入粉丝知识与应援动作；反对时代峰峻，进入理由选择与意见记录。</p><small>两边都从同一个现场开始，选择后不可跳过引导。</small></div><div className="guide-actions"><button className="guide-against" onClick={() => selectSide("against")}><span>我反对时代峰峻</span><b>01 →</b></button><button className="guide-support" onClick={() => selectSide("support")}><span>我支持 TF 五代</span><b>02 →</b></button></div></section>}

      {phase === "quiz" && side && question && <section className="quiz-panel"><aside><span>STEP {String(questionIndex + 1).padStart(2, "0")} / 04</span><strong>{side === "support" ? "TF 五代" : "反对现场"}</strong><p>选一个最接近你的答案，确认后进入下一题。</p></aside><div className="quiz-main"><div className="quiz-progress"><i style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div><span className="quiz-kicker">{side === "support" ? "SUPPORT CHECK / TF5" : "AGAINST CHECK / OPINION"}</span><h2>{question.question}</h2><div className="quiz-options">{question.options.map((option) => <button className={selectedAnswer === option ? "selected" : ""} key={option} onClick={() => setSelectedAnswer(option)}><span>{selectedAnswer === option ? "●" : "○"}</span>{option}<b>↗</b></button>)}</div><button className="quiz-confirm" disabled={!selectedAnswer} onClick={answerQuestion}>确认答案，继续 <b>→</b></button></div></section>}

      {phase === "score" && side && <section className="result-panel"><span>STEP 05 / YOU ARE IN</span><h2>你已经站在<br /><b>{activeLabel}</b>。</h2><p>现场信号已更新。现在进入这一边，完成你的第一步动作。</p><div className="result-numbers"><div><small>反对</small><strong>{number(displayAgainstScore)}</strong></div><b>VS</b><div><small>支持 TF 五代</small><strong>{number(displaySupportScore)}</strong></div></div><button onClick={() => setPhase("arena")}>进入{activeLabel} <b>→</b></button></section>}

      {phase === "arena" && side && <section className="action-panel"><div className="action-heading"><span>YOUR SIDE / {side === "support" ? "02" : "01"}</span><h2>{activeLabel}</h2><p>{side === "support" ? "现在就为 TF 五代留下一个可见动作。" : "现在就把反对理由留下。"}</p></div>{side === "support" ? <div className="support-actions"><div className="tf5-card"><div className="tf5-mark">TF<br /><b>5</b></div><div><span>SUPPORT SIGNAL / HOURLY</span><h3>TF 五代应援棒 <b>+1</b></h3><p>{cooldown > 0 ? <>下一根可领取：<Countdown seconds={cooldown} /></> : "每小时可点亮一根"}</p></div><button disabled={cooldown > 0} onClick={claimStick}>{cooldown > 0 ? <Countdown seconds={cooldown} /> : "点亮"}</button></div><div className="action-label"><span>特效礼物 / 选择声量档位</span><small>价格与支持值一一对应</small></div><div className="gift-actions">{gifts.map((item) => <button className="gift-card" key={item.id} onClick={() => setGift(item)}><span className="gift-card-glow" /><span className="gift-card-icon"><img src={item.image} alt="" /></span><strong>{item.name}</strong><small>¥{item.price} · +{item.value}</small><em>OPEN ↗</em></button>)}</div></div> : <div className="against-actions"><span className="action-label">选择你最主要的反对理由</span><div className="reason-grid">{quizSets.against[0].options.map((reason) => <button className={againstReason === reason ? "selected" : ""} key={reason} onClick={() => setAgainstReason(reason)}>{reason}<b>{againstReason === reason ? "✓" : "+"}</b></button>)}</div><button className="against-submit" disabled={!againstReason} onClick={sendAgainstReason}>留下这条反对声量 <b>→</b></button><p>只记录理由，不开放辱骂、人肉或骚扰内容。</p></div>}</section>}

      <footer className="signal-footer"><span>FJ / SIGNAL ROOM</span><span>支持 TF 五代 · 反对时代峰峻</span><a href="/admin">ADMIN →</a></footer>

      {gift && <div className="gift-modal-backdrop"><div className="gift-modal"><button className="close-modal" onClick={() => setGift(null)}>×</button><span className="modal-kicker">SECURE PAYMENT GATE / TF5</span><div className="gift-modal-main"><img src={gift.image} alt="" /><div><h2>{gift.name}</h2><p>支付 ¥{gift.price}，支付确认后增加 TF 五代支持值 +{gift.value}</p></div></div><div className="secure-copy"><b>安全结算说明</b><span>订单、金额和应援值只在服务端生成；当前未配置商户证书，不会产生扣款。</span></div><button className="gift-pay" onClick={buyGift}>获取安全支付链接 <b>↗</b></button></div></div>}
      {notice && <div className="battle-toast">{notice}</div>}
    </main>
  );
}
