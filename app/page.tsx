"use client";

import { useEffect, useMemo, useState } from "react";

type Side = "challenge" | "support";
type Gift = {
  id: string;
  name: string;
  price: number;
  value: number;
  icon: string;
  note: string;
};

const gifts: Gift[] = [
  { id: "spark", name: "星火", price: 6, value: 6, icon: "✦", note: "轻量点亮" },
  { id: "wave", name: "声浪", price: 18, value: 25, icon: "≈", note: "让观点被听见" },
  { id: "pulse", name: "心跳", price: 68, value: 100, icon: "◉", note: "全场脉冲特效" },
  { id: "signal", name: "信号塔", price: 128, value: 220, icon: "⌁", note: "登上本场焦点" },
];

const prompts = [
  {
    eyebrow: "01 / 03",
    question: "你更想从哪种角度开始了解这场讨论？",
    options: [
      { label: "我有疑问，想看不同声音", side: "challenge" as Side },
      { label: "我有支持，想为喜欢应援", side: "support" as Side },
    ],
  },
  {
    eyebrow: "02 / 03",
    question: "当规则与期待发生碰撞，你更在意什么？",
    options: [
      { label: "透明、边界与被看见", side: "challenge" as Side },
      { label: "陪伴、成长与长期主义", side: "support" as Side },
    ],
  },
  {
    eyebrow: "03 / 03",
    question: "今天，你想把一票投给哪种表达？",
    options: [
      { label: "把质疑摆上桌面", side: "challenge" as Side },
      { label: "把支持变成信号", side: "support" as Side },
    ],
  },
];

const sourceNotes = [
  { title: "议题 01", label: "公开表达与管理边界", tone: "双方观点均为预置文案" },
  { title: "议题 02", label: "成长叙事与商业化", tone: "观点不等同于事实判断" },
  { title: "议题 03", label: "粉丝参与和信息透明", tone: "欢迎先看来源再选择" },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

export default function Home() {
  const [entryOpen, setEntryOpen] = useState(true);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Side[]>([]);
  const [activeSide, setActiveSide] = useState<Side>("support");
  const [challengeScore, setChallengeScore] = useState(48216);
  const [supportScore, setSupportScore] = useState(51284);
  const [stickClaimed, setStickClaimed] = useState(false);
  const [cooldown, setCooldown] = useState(47 * 60 + 22);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentChannel, setPaymentChannel] = useState<"wechat" | "alipay">("wechat");
  const [notice, setNotice] = useState("");
  const [livePulse, setLivePulse] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) {
      setStickClaimed(false);
      return;
    }
    const timer = window.setInterval(() => setCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    const timer = window.setInterval(() => setLivePulse((current) => current + 1), 5200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const total = challengeScore + supportScore;
  const supportPercent = Math.round((supportScore / total) * 100);
  const challengePercent = 100 - supportPercent;
  const currentPrompt = prompts[step];
  const sideCopy = activeSide === "support" ? {
    kicker: "支持方 / SIGNAL",
    title: "把喜欢，变成看得见的信号",
    body: "支持不必喧哗。每一根应援棒、每一个礼物，都是你选择留下的坐标。",
    action: "为支持加一格",
  } : {
    kicker: "质疑方 / QUESTION",
    title: "把问题，摆到光里讨论",
    body: "质疑不是攻击。先看议题、再做选择，让不同声音拥有清晰的边界。",
    action: "查看质疑议题",
  };

  const cooldownLabel = useMemo(() => {
    const minutes = Math.floor(cooldown / 60).toString().padStart(2, "0");
    const seconds = (cooldown % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [cooldown]);

  function chooseAnswer(side: Side) {
    const nextAnswers = [...answers, side];
    setAnswers(nextAnswers);
    if (step < prompts.length - 1) {
      setStep((current) => current + 1);
      return;
    }
    const supportVotes = nextAnswers.filter((answer) => answer === "support").length;
    const nextSide = supportVotes >= nextAnswers.length / 2 ? "support" : "challenge";
    setActiveSide(nextSide);
    setEntryOpen(false);
  }

  function claimStick() {
    if (stickClaimed || cooldown > 0) return;
    setSupportScore((score) => score + 1);
    setStickClaimed(true);
    setCooldown(60 * 60);
    setNotice("应援棒已点亮，支持值 +1");
  }

  function payForGift() {
    if (!selectedGift) return;
    setSupportScore((score) => score + selectedGift.value);
    setPaymentOpen(false);
    setSelectedGift(null);
    setNotice("支付沙盒已完成，礼物特效正在入场");
  }

  function openGift(gift: Gift) {
    setSelectedGift(gift);
    setPaymentOpen(true);
  }

  return (
    <main className="arena-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><span>F</span><span>J</span></div>
          <div>
            <p className="brand-name">峰声 FIELD</p>
            <p className="brand-subtitle">两种声音 · 一个现场</p>
          </div>
        </div>
        <div className="topbar-meta">
          <span className="live-dot" /> LIVE / 现场进行中
          <button className="text-button" onClick={() => setEntryOpen(true)}>重新选择阵营</button>
        </div>
      </header>

      <section className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">THE FENG SHENG ARENA / 2026.08</p>
          <h1>你站在哪里，<em>声音</em>就从哪里开始。</h1>
          <p className="hero-description">一场关于时代峰峻的观点现场。支持、质疑、犹豫，都可以先被听见，再被选择。</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => setEntryOpen(true)}>进入观点问答 <span>↗</span></button>
            <a className="quiet-link" href="#rules">先看参与规则 <span>↓</span></a>
          </div>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <div className="orbit-core"><span>FJ</span><small>FIELD<br />NOTE 01</small></div>
          <span className="orbit-label label-top">QUESTION</span>
          <span className="orbit-label label-bottom">SIGNAL</span>
        </div>
      </section>

      <section className="scoreboard-card" aria-label="实时阵营比分">
        <div className="scoreboard-heading">
          <div><span className="mini-label">LIVE SCOREBOARD</span><h2>此刻，哪种声音更接近现场？</h2></div>
          <div className="score-stamp"><span className="live-dot" /> 每 5 秒刷新</div>
        </div>
        <div className="score-track"><span className="challenge-fill" style={{ width: `${challengePercent}%` }} /><span className="support-fill" style={{ width: `${supportPercent}%` }} /></div>
        <div className="score-columns">
          <button className={`score-side challenge-side ${activeSide === "challenge" ? "is-active" : ""}`} onClick={() => setActiveSide("challenge")}>
            <span className="side-symbol">◒</span><span className="score-side-label">质疑 / 反对</span><strong>{formatNumber(challengeScore)}</strong><small>{challengePercent}% · 观点值</small>
          </button>
          <div className="versus">VS</div>
          <button className={`score-side support-side ${activeSide === "support" ? "is-active" : ""}`} onClick={() => setActiveSide("support")}>
            <span className="side-symbol">✦</span><span className="score-side-label">支持 / 应援</span><strong>{formatNumber(supportScore)}</strong><small>{supportPercent}% · 应援值</small>
          </button>
        </div>
        <div className="score-footer"><span>总参与值 {formatNumber(total)}</span><span>本轮已记录 {formatNumber(1268 + livePulse * 3)} 次选择</span></div>
      </section>

      <section className={`arena-grid active-${activeSide}`}>
        <article className="side-panel challenge-panel">
          <div className="panel-topline"><span className="panel-index">01</span><span className="panel-status">QUESTION FIELD</span></div>
          <div className="panel-content"><div className="panel-icon">◒</div><p className="panel-kicker">质疑方 / QUESTION</p><h2>问题值得<br /><span>被看见。</span></h2><p>从管理边界、表达空间，到信息透明。这里收集的是议题，不是攻击。</p><button className="outline-button" onClick={() => setActiveSide("challenge")}>进入质疑议题 <span>↗</span></button></div>
          <div className="panel-quote">“观点可以尖锐，表达需要有边界。”</div>
        </article>

        <article className="side-panel support-panel">
          <div className="panel-topline"><span className="panel-index">02</span><span className="panel-status">SIGNAL FIELD</span></div>
          <div className="panel-content"><div className="panel-icon">✦</div><p className="panel-kicker">支持方 / SIGNAL</p><h2>喜欢值得<br /><span>被点亮。</span></h2><p>一根应援棒，一份礼物，一次你愿意留下的选择。支持值会实时汇入现场。</p><button className="solid-button" onClick={() => setActiveSide("support")}>为支持加一格 <span>↗</span></button></div>
          <div className="panel-quote">“喜欢不是噪音，是持续发生的信号。”</div>
        </article>
      </section>

      <section className="support-console" id="support-console">
        <div className="console-intro"><p className="eyebrow">SUPPORT CONSOLE / 应援台</p><h2>把你的选择，<br /><em>送进现场。</em></h2><p>应援棒每 60 分钟可领取 1 根。礼物为虚拟互动商品，价格与应援值在确认页展示。</p><div className="console-rule"><span className="rule-icon">i</span><span>当前为支付沙盒演示，正式支付接入前不会产生真实扣款。</span></div></div>
        <div className="console-actions">
          <div className="stick-card"><div className="stick-visual"><div className="stick-glow" /><span>✦</span></div><div className="stick-info"><span className="mini-label">HOURLY LIGHTSTICK</span><h3>应援棒 <b>+1</b></h3><p>{stickClaimed ? "本小时已点亮" : cooldown > 0 ? `下一根将在 ${cooldownLabel} 后可领取` : "现在可以领取"}</p></div><button className="stick-button" disabled={stickClaimed || cooldown > 0} onClick={claimStick}>{stickClaimed ? "已点亮" : cooldown > 0 ? cooldownLabel : "领取"}</button></div>
          <div className="gift-header"><span className="mini-label">EFFECT GIFTS</span><span>选择一个特效礼物</span></div>
          <div className="gift-grid">{gifts.map((gift) => <button className="gift-card" key={gift.id} onClick={() => openGift(gift)}><span className="gift-icon">{gift.icon}</span><span className="gift-name">{gift.name}</span><span className="gift-note">{gift.note}</span><span className="gift-price">¥{gift.price} <i>+{gift.value}</i></span></button>)}</div>
        </div>
      </section>

      <section className="topics-section" id="topics">
        <div className="section-heading"><div><p className="eyebrow">PRESET TOPICS / 预置议题</p><h2>先看清议题，再选择立场。</h2></div><span className="section-note">ONLY CURATED CONTENT<br />首期仅开放预置内容</span></div>
        <div className="topic-list">{sourceNotes.map((item, index) => <button className="topic-row" key={item.title} onClick={() => setNotice(`已打开${item.label}：${item.tone}`)}><span className="topic-number">0{index + 1}</span><span className="topic-main"><strong>{item.label}</strong><small>{item.tone}</small></span><span className="topic-arrow">↗</span></button>)}</div>
      </section>

      <section className="rules-section" id="rules"><div><p className="eyebrow">FIELD RULES / 参与规则</p><h2>把对立留在观点里，<br /><em>把边界留给每个人。</em></h2></div><div className="rule-columns"><div><span>01</span><h3>不做辱骂场</h3><p>不鼓励辱骂、人肉、骚扰和未经证实的指控。观点卡片均经过预置审核。</p></div><div><span>02</span><h3>应援值不是事实</h3><p>分数只代表本场互动选择，不代表任何一方的事实正确性或公众共识。</p></div><div><span>03</span><h3>理性消费</h3><p>礼物仅为互动展示。正式上线需完成支付、退款与未成年人消费合规配置。</p></div></div></section>

      <footer className="site-footer"><div className="brand-lockup"><div className="brand-mark small" aria-hidden="true"><span>F</span><span>J</span></div><div><p className="brand-name">峰声 FIELD</p><p className="brand-subtitle">观点先于情绪</p></div></div><span>© 2026 FIELD NOTE · 预览版本</span><span>隐私政策　服务条款　退款说明</span></footer>

      {notice && <div className="toast" role="status"><span>✦</span>{notice}</div>}

      {entryOpen && <div className="modal-backdrop entry-backdrop"><div className="entry-modal"><button className="modal-close" onClick={() => setEntryOpen(false)} aria-label="关闭问答">×</button><div className="entry-progress"><span className="mini-label">FIELD ENTRY</span><span>{currentPrompt.eyebrow}</span></div><div className="entry-orbit" aria-hidden="true"><span>FJ</span></div><p className="eyebrow">进入你的观点现场</p><h2>{currentPrompt.question}</h2><p className="entry-description">没有标准答案，完成三次选择后，我们会把你带到更接近你的那一侧。</p><div className="entry-options">{currentPrompt.options.map((option) => <button key={option.side} onClick={() => chooseAnswer(option.side)} className={option.side === "support" ? "entry-support" : "entry-challenge"}><span>{option.side === "support" ? "✦" : "◒"}</span>{option.label}<b>↗</b></button>)}</div><div className="entry-footer"><span>仅用于本次现场导览</span><span>不储存身份信息</span></div></div></div>}

      {paymentOpen && selectedGift && <div className="modal-backdrop"><div className="payment-modal"><button className="modal-close" onClick={() => setPaymentOpen(false)} aria-label="关闭支付">×</button><p className="eyebrow">CONFIRM GIFT / 确认礼物</p><div className="payment-gift"><span className="gift-icon large">{selectedGift.icon}</span><div><h2>{selectedGift.name}</h2><p>{selectedGift.note} · 应援值 +{selectedGift.value}</p></div><strong>¥{selectedGift.price}</strong></div><div className="channel-label">选择支付方式</div><div className="channels"><button className={paymentChannel === "wechat" ? "selected" : ""} onClick={() => setPaymentChannel("wechat")}><span className="channel-icon wechat">微</span>微信支付</button><button className={paymentChannel === "alipay" ? "selected" : ""} onClick={() => setPaymentChannel("alipay")}><span className="channel-icon alipay">支</span>支付宝</button></div><div className="sandbox-note"><span>沙盒演示</span>点击确认将模拟支付成功，不会产生真实扣款</div><button className="pay-button" onClick={payForGift}>确认支付 ¥{selectedGift.price} <span>↗</span></button></div></div>}
    </main>
  );
}
