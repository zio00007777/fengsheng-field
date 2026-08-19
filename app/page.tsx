"use client";

/* The entry state is intentionally restored from localStorage after mount. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";

type Side = "support" | "against";
type Gift = { id: string; name: string; price: number; value: number; image: string };
type Quiz = { id: string; question: string; options: string[] };

const quizSets: Record<Side, Quiz[]> = {
  support: [
    { id: "tf5-member", question: "你最关注 TF 五代哪位公开练习生？", options: ["吕政熙", "高铭阳", "智恩涵", "沈子航", "朱映宸", "刘瀚辰"] },
    { id: "tf5-focus", question: "哪类公开物料最能让你看见成员成长？", options: ["声乐练习日志", "舞蹈考核片段", "训练日常记录", "家族舞台"] },
    { id: "tf5-status", question: "按照目前公开信息，TF 五代处于哪一阶段？", options: ["公开练习生阶段", "已经正式出道", "已有固定出道团"] },
    { id: "tf5-signal", question: "你最希望下一次公开内容优先呈现什么？", options: ["更多完整舞台", "更连续的成长记录", "更清晰的出道规划"] },
  ],
  against: [
    { id: "management", question: "你最反感时代峰峻哪个管理环节？", options: ["资源安排", "艺人管理", "粉丝沟通", "公开回应"] },
    { id: "experience", question: "哪种体验让你开始不再支持？", options: ["等不到说明", "看不到规划", "感到不被尊重", "其他管理问题"] },
    { id: "evidence", question: "你想留下哪种可以核实的反对声量？", options: ["记录事实", "要求解释", "要求改进", "提出建议"] },
    { id: "direction", question: "你希望这条反对声量最终指向什么？", options: ["更透明的规则", "更清晰的安排", "更及时的回应", "更负责的管理"] },
  ],
};

const gifts: Gift[] = [
  { id: "spark", name: "闪点", price: 6, value: 60, image: "gifts/star.png" },
  { id: "wave", name: "声浪", price: 18, value: 250, image: "gifts/wave.png" },
  { id: "pulse", name: "心跳", price: 68, value: 1000, image: "gifts/heartbeat.png" },
  { id: "signal", name: "信号塔", price: 128, value: 2200, image: "gifts/tower.png" },
];

const initialScore = { support: 2000, against: 8000 };

function number(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function Countdown({ seconds }: { seconds: number }) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  return <>{minutes}:{rest}</>;
}

export default function Home() {
  const [phase, setPhase] = useState<"choose" | "quiz" | "arena">("choose");
  const [side, setSide] = useState<Side | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [supportScore, setSupportScore] = useState(initialScore.support);
  const [againstScore, setAgainstScore] = useState(initialScore.against);
  const [visualNudge, setVisualNudge] = useState({ support: 0, against: 0 });
  const [signalPulse, setSignalPulse] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [stickUnavailable, setStickUnavailable] = useState(false);
  const [gift, setGift] = useState<Gift | null>(null);
  const [againstReason, setAgainstReason] = useState("");
  const [notice, setNotice] = useState("");
  const [paymentModal, setPaymentModal] = useState<{ orderId: string; qrcodeUrl: string; giftId: string; giftName: string; price: number; timestamp: number } | null>(null);
  const [paymentConfirming, setPaymentConfirming] = useState(false);
  const [confirmWaitSeconds, setConfirmWaitSeconds] = useState(0);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("fj_session_state") : null;
    if (saved) {
      try {
        const state = JSON.parse(saved);
        setPhase(state.phase);
        setSide(state.side);
        setAnswers(state.answers);
      } catch { /* ignore malformed local session state */ }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fj_session_state", JSON.stringify({ phase, side, answers }));
    }
  }, [phase, side, answers]);

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
      setVisualNudge((current) => ({ support: current.support + Math.floor(160 + Math.random() * 560), against: current.against + Math.floor(110 + Math.random() * 430) }));
      setSignalPulse(true);
      window.setTimeout(() => setSignalPulse(false), 220);
    }, 420);
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
    fetch("/api/support-stick/claim").then(async (response) => ({ ok: response.ok, data: await response.json().catch(() => null) })).then(({ ok, data }) => {
      if (!ok) { setStickUnavailable(true); return; }
      if (data?.nextAt && data.nextAt > Date.now()) setCooldown(Math.ceil((data.nextAt - Date.now()) / 1000));
    }).catch(() => setStickUnavailable(true));
  }, []);

  useEffect(() => {
    if (!paymentModal) {
      setConfirmWaitSeconds(0);
      return;
    }
    const elapsedSeconds = Math.floor((Date.now() - paymentModal.timestamp) / 1000);
    const remaining = Math.max(0, 60 - elapsedSeconds);
    setConfirmWaitSeconds(remaining);

    if (remaining === 0) return;
    const timer = window.setInterval(() => {
      const now = Math.floor((Date.now() - paymentModal.timestamp) / 1000);
      const rem = Math.max(0, 60 - now);
      setConfirmWaitSeconds(rem);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [paymentModal]);

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
    setPhase("arena");
  }

  async function claimStick() {
    if (stickUnavailable) { setNotice("应援状态暂不可用，未发放应援棒"); return; }
    if (cooldown > 0) return;
    const response = await fetch("/api/support-stick/claim", { method: "POST" });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if (data?.nextAt && data.nextAt > Date.now()) setCooldown(Math.ceil((data.nextAt - Date.now()) / 1000));
      setNotice(response.status === 429 ? "本小时应援棒已领取" : "应援状态暂不可用，未发放应援棒");
      return;
    }
    setSupportScore((current) => current + Number(data?.value ?? 1));
    setCooldown(Math.max(0, Math.ceil((Number(data?.nextAt ?? Date.now() + 3600000) - Date.now()) / 1000)));
    setNotice("TF 五代应援信号已点亮，支持值 +1");
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
        if (!ok || !data?.orderId || !data?.qrcodeUrl) {
          setNotice("支付二维码获取失败，未产生扣款");
          return;
        }
        setPaymentModal({
          orderId: data.orderId,
          qrcodeUrl: data.qrcodeUrl,
          giftId: data.giftId,
          giftName: data.giftName,
          price: data.priceCents / 100,
          timestamp: Date.now(),
        });
        // 打开支付宝
        const qrcodeData = data.qrcodeUrl;
        const a = document.createElement("a");
        a.href = qrcodeData;
        a.download = `${selectedGift.id}-qrcode.png`;
        a.click();
      })
      .catch(() => setNotice("支付服务暂时不可用，未产生扣款"));
  }

  function confirmPayment() {
    if (!paymentModal) return;
    const elapsedSeconds = Math.floor((Date.now() - paymentModal.timestamp) / 1000);
    if (elapsedSeconds < 60) {
      setNotice(`请等待 ${60 - elapsedSeconds} 秒后再确认支付`);
      return;
    }
    setPaymentConfirming(true);
    fetch("/api/orders/confirm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ orderId: paymentModal.orderId }) })
      .then(async (response) => ({ ok: response.ok, data: await response.json().catch(() => null) }))
      .then(({ ok, data }) => {
        setPaymentConfirming(false);
        if (!ok) {
          setNotice("确认支付失败，请重试");
          return;
        }
        setSupportScore((current) => current + Number(data?.scoreValue ?? 0));
        setNotice(`支持值 +${data?.scoreValue ?? 0}，感谢应援`);
        setPaymentModal(null);
        setGift(null);
      })
      .catch(() => {
        setPaymentConfirming(false);
        setNotice("确认支付失败，请重试");
      });
  }

  return (
    <main className={`signal-room ${side === "support" ? "support-room" : "against-room"}`}>
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
            <p>为公开练习生的训练和舞台留下支持，让成长有被看见的信号。</p>
            <div className="support-route"><span>支持路线</span><b>答 4 题</b><i>→</i><b className="gift-step">送礼物</b><i>→</i><b>领应援棒</b></div>
            <div className="panel-score"><small>当前现场声量</small><strong>{number(displaySupportScore)}</strong><i>{supportPercent}%</i></div>
            <button onClick={() => selectSide("support")}>进入支持方，开始应援 <b>→</b></button>
          </article>
        </div>
        <div className="hero-footer"><span><b>4</b> 道问题 · <b>1</b> 次选择 · <b>0</b> 个第三选项</span><b>实时信号持续滚动</b></div>
      </section>

      <section className={`live-board ${signalPulse ? "board-pulse" : ""}`}>
        <div className="board-title"><span>LIVE SCOREBOARD</span><h2>现场正在偏向哪边？</h2><p>数字持续变化，用来展示当前现场气氛，不代表真实统计。</p></div>
        <div className="board-side board-against"><small>反对时代峰峻</small><strong>{number(displayAgainstScore)}</strong><i>{againstPercent}%</i></div>
        <div className="board-vs">VS</div>
        <div className="board-side board-support"><small>支持 TF 五代</small><strong>{number(displaySupportScore)}</strong><i>{supportPercent}%</i></div>
        <div className="board-track"><span style={{ width: `${againstPercent}%` }} /><b style={{ width: `${supportPercent}%` }} /></div>
      </section>

      {phase === "choose" && <section className="guide-panel"><div><span>STEP 00 / CHOOSE</span><h2>先选方向，<br /><b>再让声音变大。</b></h2></div><div className="guide-copy"><p>支持 TF 五代：完成 4 道问答后，优先送出特效礼物，再领取应援棒。</p><small>反对方进入理由选择；两边都从同一个现场开始。</small></div><div className="guide-actions"><button className="guide-against" onClick={() => selectSide("against")}><span>我反对时代峰峻</span><b>01 →</b></button><button className="guide-support" onClick={() => selectSide("support")}><span>我支持 TF 五代<small>4题 → 送礼物 → 应援棒</small></span><b>02 →</b></button></div></section>}

      {phase === "quiz" && side && question && <section className="quiz-panel"><aside><span>STEP {String(questionIndex + 1).padStart(2, "0")} / 04</span><strong>{side === "support" ? "TF 五代" : "反对现场"}</strong><p>选一个最接近你的答案，确认后进入下一题。</p></aside><div className="quiz-main"><div className="quiz-progress"><i style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div><span className="quiz-kicker">{side === "support" ? "SUPPORT CHECK / TF5" : "AGAINST CHECK / OPINION"}</span><h2>{question.question}</h2><div className="quiz-options">{question.options.map((option) => <button className={selectedAnswer === option ? "selected" : ""} key={option} onClick={() => setSelectedAnswer(option)}><span>{selectedAnswer === option ? "●" : "○"}</span>{option}<b>↗</b></button>)}</div><button className="quiz-confirm" disabled={!selectedAnswer} onClick={answerQuestion}>确认答案，继续 <b>→</b></button></div></section>}

      {phase === "arena" && side && <section className="action-panel"><div className="action-heading"><span>YOUR SIDE / {side === "support" ? "02" : "01"}</span><h2>{activeLabel}</h2><p>{side === "support" ? "四题确认完成，直接开始应援：先送出高支持力礼物，再领取每小时应援棒。" : "现在就把反对理由留下。"}</p></div>{side === "support" ? <div className="support-actions"><div className="gift-callout"><b>第一应援动作</b><span>送出特效礼物，增加对应支持值</span></div><div className="action-label"><span>特效礼物 / 立即送出</span><small>高价礼物 = 更高支持力</small></div><div className="gift-actions">{gifts.map((item) => <button className={`gift-card ${item.value >= 100 ? "gift-card-high" : ""}`} key={item.id} onClick={() => setGift(item)}><span className="gift-card-glow" /><span className="gift-card-icon"><img src={item.image} alt="" /></span><strong>{item.name}</strong><b className="gift-card-power">+{item.value}<span>支持力</span></b><small>¥{item.price} / 送出即计入</small><em>送出 ↗</em></button>)}</div><div className="tf5-card"><div className="tf5-mark">TF<br /><b>5</b></div><div><span>SUPPORT SIGNAL / HOURLY</span><h3>TF 五代应援棒 <b>+1</b></h3><p>{cooldown > 0 ? <>下一根可领取：<Countdown seconds={cooldown} /></> : "每小时可点亮一根"}</p></div><button disabled={cooldown > 0} onClick={claimStick}>{cooldown > 0 ? <Countdown seconds={cooldown} /> : "点亮"}</button></div></div> : <div className="against-actions"><span className="action-label">选择你最主要的反对理由</span><div className="reason-grid">{quizSets.against[0].options.map((reason) => <button className={againstReason === reason ? "selected" : ""} key={reason} onClick={() => setAgainstReason(reason)}>{reason}<b>{againstReason === reason ? "✓" : "+"}</b></button>)}</div><button className="against-submit" disabled={!againstReason} onClick={sendAgainstReason}>留下这条反对声量 <b>→</b></button><p>只记录理由，不开放辱骂、人肉或骚扰内容。</p></div>}</section>}

      <footer className="signal-footer"><span>FJ / SIGNAL ROOM</span><span>支持 TF 五代 · 反对时代峰峻</span><a href="/admin">ADMIN →</a></footer>

      {gift && <div className="gift-modal-backdrop"><div className="gift-modal"><button className="close-modal" onClick={() => setGift(null)}>×</button><span className="modal-kicker">SECURE PAYMENT GATE / TF5</span><div className="gift-modal-main"><img src={gift.image} alt="" /><div><h2>{gift.name}</h2><p>支付 ¥{gift.price}，支付确认后增加 TF 五代支持值 +{gift.value}</p></div></div><div className="secure-copy"><b>安全结算说明</b><span>订单、金额和应援值只在服务端生成；当前未配置商户证书，不会产生扣款。</span></div><button className="gift-pay" onClick={buyGift}>获取安全支付链接 <b>↗</b></button></div></div>}
      {paymentModal && <div className="gift-modal-backdrop"><div className="gift-modal"><button className="close-modal" onClick={() => setPaymentModal(null)}>×</button><span className="modal-kicker">ALIPAY QR CODE / {paymentModal.giftName}</span><div className="gift-modal-main"><div style={{ textAlign: "center" }}><img src={paymentModal.qrcodeUrl} alt="支付宝二维码" loading="lazy" style={{ maxWidth: "100%", borderRadius: "8px" }} /><div style={{ marginTop: "20px" }}><h2>{paymentModal.giftName}</h2><p>¥{paymentModal.price.toFixed(2)}</p></div></div></div><button className="gift-pay" onClick={() => window.open(paymentModal.qrcodeUrl, '_blank')}>去支付 ↗</button>{confirmWaitSeconds > 0 ? <div style={{ marginTop: "16px", textAlign: "center", fontSize: "14px", color: "#999" }}>支付后 {confirmWaitSeconds} 秒可确认</div> : <button className="gift-pay" style={{ marginTop: "12px" }} disabled={paymentConfirming} onClick={confirmPayment}>{paymentConfirming ? "确认中..." : "已支付，确认 ↗"}</button>}</div></div>}
      {notice && <div className="battle-toast">{notice}</div>}
    </main>
  );
}
