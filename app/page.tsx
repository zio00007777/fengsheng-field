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
    <main className={`zine-site ${side === "support" ? "zine-support" : "zine-against"}`}>
      <header className="zine-masthead"><button className="zine-logo" onClick={() => setPhase("choose")}><b>FJ</b><span><strong>峰声</strong><small>立场墙 / VOICE WALL</small></span></button><div className="zine-ticker"><i /> LIVE <span>现场声量每 0.6 秒刷新</span></div><a href="/admin">后台 ↗</a></header>

      <section className="zine-cover"><div className="cover-sticker">NO. 001<br /><b>TWO SIDES ONLY</b></div><div className="cover-copy"><span>一个关于时代峰峻的现场刊物</span><h1>你站哪边？<br /><em>把位置贴上去。</em></h1><p>不做中立观众。选一边，回答四个问题，把你的声音贴进这面墙。</p></div><div className={`cover-total ${signalPulse ? "sticker-pulse" : ""}`}><small>LIVE SCOREBOARD / TOTAL</small><strong>{number(total)}</strong><div><i style={{ width: `${againstPercent}%` }} /><b style={{ width: `${supportPercent}%` }} /></div><span>反对 {againstPercent}% <em>支持 {supportPercent}%</em></span></div></section>

      <section className="poster-wall"><article className="poster poster-support"><div className="poster-tape">SUPPORT / 02</div><header><span>TF 五代应援墙</span><b>保留给成长</b></header><h2>支持<br /><strong>TF 五代</strong></h2><p>为公开练习生的训练、舞台和每一次成长，留下明确的支持。</p><div className="member-stickers"><span>吕政熙</span><span>高铭阳</span><span>智恩涵</span><span>沈子航</span><span>朱映宸</span><span>刘瀚辰</span></div><div className="poster-bottom"><div><small>现场支持声量</small><strong>{number(displaySupportScore)}</strong></div><button onClick={() => selectSide("support")}>我要为 TF 五代发声 <b>↗</b></button></div></article><div className="tear-spine"><span>VS</span><i /><small>把立场<br />贴上墙</small><b>LIVE<br />0.6s</b></div><article className="poster poster-against"><div className="poster-tape">AGAINST / 01</div><header><span>反对意见墙</span><b>只贴具体问题</b></header><h2>反对<br /><strong>时代峰峻</strong></h2><p>不认同管理方式，就把可核实的理由贴出来，让意见留下痕迹。</p><div className="reason-stickers"><span>资源安排？</span><span>艺人管理？</span><span>粉丝沟通？</span><span>公开回应？</span></div><div className="poster-bottom"><div><small>现场反对声量</small><strong>{number(displayAgainstScore)}</strong></div><button onClick={() => selectSide("against")}>我要贴出反对理由 <b>↗</b></button></div></article></section>

      <section className="wall-ledger"><div className="ledger-caption"><span>墙面记录 / LIVE SCOREBOARD</span><h2>正在被贴上的声音</h2><p>数字是视觉化现场信号，累计以服务端记录为准。</p></div><div className="ledger-notes"><div className="ledger-note ledger-note-red"><b>反对</b><strong>{number(displayAgainstScore)}</strong><span>张意见贴</span></div><div className="ledger-note ledger-note-blue"><b>支持 TF 五代</b><strong>{number(displaySupportScore)}</strong><span>个应援信号</span></div></div></section>

      {phase === "choose" && <section className="zine-entry"><div className="entry-number">01</div><div><span>第一张贴纸 / CHOOSE YOUR SIDE</span><h2>先选一面墙，<br /><b>再开始说话。</b></h2></div><div className="entry-copy"><p>支持 TF 五代：回答成员、物料和成长问题。反对时代峰峻：选择管理问题、事实和回应方向。</p><small>第三选项不存在。下面两张海报，选一张。</small></div><div className="entry-arrow">↓<br /><span>往下贴</span></div></section>}

      {phase === "quiz" && side && question && <section className={`zine-sheet ${side === "support" ? "sheet-support" : "sheet-against"}`}><div className="sheet-margin"><span>VOICE WALL</span><strong>0{questionIndex + 1}</strong><small>/04</small></div><div className="sheet-content"><header><span>{side === "support" ? "TF 五代应援贴纸" : "时代峰峻反对贴纸"}</span><b>请贴上你的答案</b></header><div className="sheet-progress"><i style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div><h2>{question.question}</h2><div className="sticker-options">{question.options.map((option, index) => <button className={selectedAnswer === option ? "selected" : ""} key={option} onClick={() => setSelectedAnswer(option)}><span>{String(index + 1).padStart(2, "0")}</span><b>{option}</b><i>贴上 ↗</i></button>)}</div><button className="sheet-confirm" disabled={!selectedAnswer} onClick={answerQuestion}>贴上答案，继续下一张 <b>→</b></button></div></section>}

      {phase === "score" && side && <section className="zine-result"><div className="result-scribble">已贴上<br />CONFIRMED</div><span>四张贴纸完成 / STEP 05</span><h2>你贴在了<br /><b>{activeLabel}</b></h2><p>这条声音已经进入现场。再做一个动作，让它继续留在墙上。</p><div className="result-strip"><span>反对 {number(displayAgainstScore)}</span><i /><span>支持 {number(displaySupportScore)}</span></div><button onClick={() => setPhase("arena")}>打开我的应援贴 <b>↗</b></button></section>}

      {phase === "arena" && side && <section className={`zine-action ${side === "support" ? "action-support" : "action-against"}`}><div className="action-title"><span>你的墙面动作 / YOUR STICKER</span><h2>{activeLabel}</h2><p>{side === "support" ? "选择一个应援动作，把 TF 五代的名字继续贴在现场。" : "选一个最具体的反对方向，把问题贴得清楚。"}</p></div>{side === "support" ? <div className="action-sheet"><div className="hour-sticker"><div className="tf5-mark">TF<br /><b>5</b></div><div><span>HOURLY SUPPORT STICKER</span><h3>点亮一张 TF 五代应援贴 <b>+1</b></h3><small>{cooldown > 0 ? <>下一张可贴：<Countdown seconds={cooldown} /></> : "每小时可贴一张"}</small></div><button disabled={cooldown > 0} onClick={claimStick}>{cooldown > 0 ? <Countdown seconds={cooldown} /> : "贴上"}</button></div><div className="gift-wall-head"><span>把特效贴纸贴上墙 / BOOST PACK</span><small>价格档位对应不同应援值</small></div><div className="gift-actions">{gifts.map((item) => <button className="gift-card" key={item.id} onClick={() => setGift(item)}><span className="gift-card-glow" /><span className="gift-card-icon"><img src={item.image} alt="" /></span><strong>{item.name}</strong><small>¥{item.price} · +{item.value}</small><em>贴上 ↗</em></button>)}</div></div> : <div className="action-sheet against-sheet"><span className="reason-label">选择一张反对贴纸</span><div className="reason-grid">{quizSets.against[0].options.map((reason) => <button className={againstReason === reason ? "selected" : ""} key={reason} onClick={() => setAgainstReason(reason)}>{reason}<b>{againstReason === reason ? "✓" : "+"}</b></button>)}</div><button className="against-submit" disabled={!againstReason} onClick={sendAgainstReason}>贴出这条反对意见 <b>↗</b></button><p>只记录理由，不开放辱骂、人肉或骚扰内容。</p></div>}</section>}

      <footer className="zine-footer"><span>FJ / VOICE WALL</span><span>支持 TF 五代 · 反对时代峰峻</span><a href="/admin">ADMIN ↗</a></footer>
      {gift && <div className="gift-modal-backdrop"><div className="gift-modal"><button className="close-modal" onClick={() => setGift(null)}>×</button><span className="modal-kicker">SECURE PAYMENT GATE / TF5</span><div className="gift-modal-main"><img src={gift.image} alt="" /><div><h2>{gift.name}</h2><p>支付 ¥{gift.price}，支付确认后增加 TF 五代支持值 +{gift.value}</p></div></div><div className="secure-copy"><b>安全结算说明</b><span>订单、金额和应援值只在服务端生成；当前未配置商户证书，不会产生扣款。</span></div><button className="gift-pay" onClick={buyGift}>获取安全支付链接 <b>↗</b></button></div></div>}
      {notice && <div className="battle-toast">{notice}</div>}
    </main>
  );
}
