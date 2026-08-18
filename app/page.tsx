"use client";

import { useEffect, useState } from "react";

type Side = "support" | "against";
type Gift = { id: string; name: string; price: number; value: number; icon: string };
type Quiz = { id: string; question: string; options: string[] };

const quizSets: Record<Side, Quiz[]> = {
  support: [
    { id: "watch", question: "你会持续关注时代峰峻吗？", options: ["一直关注", "偶尔关注", "今天开始关注"] },
    { id: "reason", question: "你为什么选择支持？", options: ["喜欢艺人", "认可成长", "想为喜欢应援"] },
    { id: "action", question: "现在你愿意做什么？", options: ["点亮应援棒", "送出特效礼物", "留下支持值"] },
  ],
  against: [
    { id: "management", question: "你反对时代峰峻的主要原因是？", options: ["管理方式", "资源分配", "沟通方式"] },
    { id: "experience", question: "哪种经历让你决定反对？", options: ["长期不满", "看到相关事件", "对运营失望"] },
    { id: "action", question: "现在你想留下哪种反对声音？", options: ["明确反对", "记录理由", "让更多人看到"] },
  ],
};

const gifts: Gift[] = [
  { id: "spark", name: "星火", price: 6, value: 6, icon: "✦" },
  { id: "wave", name: "声浪", price: 18, value: 25, icon: "≈" },
  { id: "pulse", name: "心跳", price: 68, value: 100, icon: "◉" },
  { id: "signal", name: "信号塔", price: 128, value: 220, icon: "⌁" },
];

const initialScore = { support: 51284, against: 48216 };

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
  const [cooldown, setCooldown] = useState(0);
  const [gift, setGift] = useState<Gift | null>(null);
  const [againstReason, setAgainstReason] = useState("");
  const [notice, setNotice] = useState("");

  const questions = side ? quizSets[side] : [];
  const question = questions[questionIndex];
  const total = supportScore + againstScore;
  const supportPercent = Math.round((supportScore / total) * 100);
  const againstPercent = 100 - supportPercent;
  const activeLabel = side === "support" ? "支持时代峰峻" : "反对时代峰峻";

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

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
    setNotice("应援棒已点亮，支持值 +1");
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
    setSupportScore((current) => current + gift.value);
    setGift(null);
    setNotice(`${gift.name} 已送出，支持值 +${gift.value}`);
    fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ giftId: gift.id }) }).catch(() => undefined);
  }

  const battlefieldClass = side === "support" ? "support-battle" : "against-battle";

  return (
    <main className={`battle-site ${battlefieldClass}`}>
      <header className="battle-header">
        <button className="wordmark" onClick={() => setPhase("choose")}><span>FJ</span> 时代峰峻 · 立场现场</button>
        <div className="header-live"><i /> LIVE / 两方对立进行中</div>
        <a className="admin-link" href="/admin">后台</a>
      </header>

      <section className="battle-hero">
        <div className="hero-side hero-against">
          <span className="side-index">01 / AGAINST</span>
          <div className="hero-symbol">×</div>
          <h1>反对<br /><b>时代峰峻</b></h1>
          <p>如果你有不满，选择你的反对理由，让这一边的声音被看到。</p>
          <button onClick={() => selectSide("against")} className="hero-choice">进入反对方 <span>→</span></button>
        </div>
        <div className="tear-line" aria-hidden="true"><span>OR</span></div>
        <div className="hero-side hero-support">
          <span className="side-index">02 / SUPPORT</span>
          <div className="hero-symbol">+</div>
          <h1>支持<br /><b>时代峰峻</b></h1>
          <p>如果你愿意应援，选择你的支持方式，让这一边的声量继续增加。</p>
          <button onClick={() => selectSide("support")} className="hero-choice">进入支持方 <span>→</span></button>
        </div>
        <div className="hero-stamp">ONLY<br />TWO<br />SIDES</div>
      </section>

      <section className="score-strip">
        <div className="score-title"><span>LIVE BATTLE</span><strong>现在，哪一边更大声？</strong></div>
        <div className="score-number score-against"><small>反对时代峰峻</small><strong>{number(againstScore)}</strong><i>{againstPercent}%</i></div>
        <div className="score-vs">VS</div>
        <div className="score-number score-support"><small>支持时代峰峻</small><strong>{number(supportScore)}</strong><i>{supportPercent}%</i></div>
        <div className="score-bar"><span style={{ width: `${againstPercent}%` }} /><b style={{ width: `${supportPercent}%` }} /></div>
      </section>

      {phase === "choose" && <section className="entry-instruction"><span>STEP 00</span><h2>先选一边，<br />再继续。</h2><p>这里没有第三个选项。选择后，我们会用三道简单问题把你带到对应阵营。</p><div className="entry-buttons"><button className="against-button" onClick={() => selectSide("against")}>我反对时代峰峻 <b>→</b></button><button className="support-button" onClick={() => selectSide("support")}>我支持时代峰峻 <b>→</b></button></div></section>}

      {phase === "quiz" && side && question && <section className="quiz-stage"><div className="quiz-aside"><span>STEP {String(questionIndex + 1).padStart(2, "0")} / 03</span><strong>{activeLabel}</strong><p>选择一个最接近你的答案，下一题会自动出现。</p></div><div className="quiz-card"><div className="quiz-progress"><i style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div><p className="quiz-label">{side === "support" ? "SUPPORT CHECK" : "AGAINST CHECK"}</p><h2>{question.question}</h2><div className="quiz-options">{question.options.map((option) => <button className={selectedAnswer === option ? "selected" : ""} key={option} onClick={() => setSelectedAnswer(option)}><span>{selectedAnswer === option ? "●" : "○"}</span>{option}<b>→</b></button>)}</div><button className="quiz-next" disabled={!selectedAnswer} onClick={answerQuestion}>确认，进入下一步 <span>↗</span></button></div></section>}

      {phase === "score" && side && <section className="result-stage"><span className="result-label">STEP 04 / RESULT</span><h2>你已经站在<br /><b>{activeLabel}</b>。</h2><p>现场比分已经更新。现在进入你的阵营，完成这一边的第一步动作。</p><div className="result-score"><div><small>反对方</small><strong>{number(againstScore)}</strong></div><span>VS</span><div><small>支持方</small><strong>{number(supportScore)}</strong></div></div><button className="result-cta" onClick={() => setPhase("arena")}>进入{activeLabel} <span>→</span></button></section>}

      {phase === "arena" && side && <section className="arena-stage"><div className="arena-heading"><span>YOUR SIDE / {side === "support" ? "02" : "01"}</span><h2>{activeLabel}</h2><p>{side === "support" ? "现在就把支持变成数字。" : "现在就把反对理由留下。"}</p></div>{side === "support" ? <div className="support-actions"><div className="stick-action"><div className="stick-shape">✦</div><div><span>HOURLY SUPPORT</span><h3>应援棒 <b>+1</b></h3><p>{cooldown > 0 ? <>下一根可领取：<Countdown seconds={cooldown} /></> : "现在可以领取一根"}</p></div><button disabled={cooldown > 0} onClick={claimStick}>{cooldown > 0 ? <Countdown seconds={cooldown} /> : "点亮"}</button></div><div className="gift-heading"><span>特效礼物</span><small>选择价位，增加对应支持值</small></div><div className="gift-actions">{gifts.map((item) => <button key={item.id} onClick={() => setGift(item)}><span>{item.icon}</span><strong>{item.name}</strong><small>¥{item.price} · +{item.value}</small></button>)}</div></div> : <div className="against-actions"><p className="action-kicker">选择你最主要的反对理由</p><div className="reason-grid">{quizSets.against[0].options.concat(["其他运营问题"]).map((reason) => <button className={againstReason === reason ? "selected" : ""} key={reason} onClick={() => setAgainstReason(reason)}>{reason}<span>{againstReason === reason ? "✓" : "+"}</span></button>)}</div><button className="against-submit" disabled={!againstReason} onClick={sendAgainstReason}>留下这条反对声量 <span>→</span></button><p className="against-note">只记录你选择的理由，不开放辱骂、人肉或骚扰内容。</p></div>}</section>}

      <footer className="battle-footer"><span>FJ / TWO SIDES ONLY</span><span>支持与反对，均由现场选择累积</span><a href="/admin">ADMIN →</a></footer>

      {gift && <div className="gift-modal-backdrop"><div className="gift-modal"><button className="close-modal" onClick={() => setGift(null)}>×</button><span className="modal-kicker">CONFIRM SUPPORT GIFT</span><div className="gift-modal-main"><span>{gift.icon}</span><div><h2>{gift.name}</h2><p>支付 ¥{gift.price}，增加支持值 +{gift.value}</p></div></div><div className="sandbox-copy">当前为支付沙盒演示，尚未接入真实商户配置，不会产生真实扣款。</div><button className="gift-pay" onClick={buyGift}>确认支付 ¥{gift.price} <b>↗</b></button></div></div>}
      {notice && <div className="battle-toast">{notice}</div>}
    </main>
  );
}
