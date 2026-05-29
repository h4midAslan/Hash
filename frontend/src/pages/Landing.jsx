import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,800;1,900&family=Archivo+Black&display=swap');

:root {
  --navy:      #071428;
  --navy-deep: #050f1f;
  --navy-card: #0a1c39;
  --blue:      #1E90FF;
  --blue-strong: color-mix(in oklab, #1E90FF, #00101f 32%);
  --cyan:      #38bdf8;
  --white:     #ffffff;
  --muted:     #7d8ba3;
  --muted-dim: #54627a;
  --line:      rgba(255,255,255,0.09);
  --line-soft: rgba(255,255,255,0.05);
  --f-head: "Archivo Black", "Archivo", system-ui, sans-serif;
  --f-body: "Archivo", system-ui, sans-serif;
  --maxw: 1240px;
  --gutter: clamp(20px, 5vw, 64px);
  --motion: 1;
}

.hl-page * { box-sizing: border-box; }
.hl-page { font-family: var(--f-body); font-size: 17px; line-height: 1.6; -webkit-font-smoothing: antialiased; overflow-x: hidden; margin: 0; background: var(--navy); color: var(--white); }
.hl-page h1, .hl-page h2, .hl-page h3 { margin: 0; font-family: var(--f-head); font-weight: 900; line-height: 0.92; letter-spacing: -0.02em; }
.hl-page p { margin: 0; text-wrap: pretty; }
.hl-page a { color: inherit; text-decoration: none; }
.hl-wrap { width: 100%; max-width: var(--maxw); margin: 0 auto; padding-inline: var(--gutter); }
.hl-page section { position: relative; }

.hl-eyebrow {
  font-family: var(--f-body); font-weight: 800; font-size: 13px;
  letter-spacing: 0.32em; text-transform: uppercase; color: var(--blue);
  display: inline-flex; align-items: center; gap: 12px;
}
.hl-eyebrow::before { content: ""; width: 26px; height: 2px; background: var(--blue); display: inline-block; }

/* BUTTONS */
.hl-btn {
  font-family: var(--f-body); font-weight: 800; font-size: 15px;
  letter-spacing: 0.02em; padding: 16px 26px; border: 0; cursor: pointer;
  display: inline-flex; align-items: center; gap: 10px;
  transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .3s, background .25s;
  position: relative; white-space: nowrap; text-decoration: none;
}
.hl-btn svg { width: 18px; height: 18px; }
.hl-btn-primary {
  background: linear-gradient(135deg, var(--blue), var(--blue-strong));
  color: #fff;
  box-shadow: 0 0 0 0 rgba(30,144,255,0.5), 0 12px 30px -12px rgba(30,144,255,0.7);
}
.hl-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 0 30px -2px rgba(30,144,255,0.55), 0 16px 34px -12px rgba(30,144,255,0.8); }
.hl-btn-ghost { background: transparent; color: #fff; border: 1px solid var(--line); }
.hl-btn-ghost:hover { border-color: var(--blue); color: var(--cyan); transform: translateY(-2px); }
.hl-pulse { animation: hlPulse calc(2.6s / var(--motion)) ease-in-out infinite; }
@keyframes hlPulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(30,144,255,0.45), 0 16px 40px -14px rgba(30,144,255,0.7); }
  50%      { box-shadow: 0 0 44px 4px rgba(30,144,255,0.35), 0 16px 40px -14px rgba(30,144,255,0.9); }
}

/* REVEAL */
.hl-reveal { opacity: 0; transform: translateY(30px); transition: opacity .75s ease, transform .75s cubic-bezier(.22,1,.36,1); }
.hl-reveal.in { opacity: 1; transform: none; }
.hl-reveal-l { opacity: 0; transform: translateX(-46px); transition: opacity .8s ease, transform .8s cubic-bezier(.22,1,.36,1); }
.hl-reveal-r { opacity: 0; transform: translateX(46px); transition: opacity .8s ease, transform .8s cubic-bezier(.22,1,.36,1); }
.hl-reveal-l.in, .hl-reveal-r.in { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  .hl-reveal, .hl-reveal-l, .hl-reveal-r { opacity: 1 !important; transform: none !important; }
  .hl-pulse { animation: none; }
}

/* PARTICLES */
#hl-particles { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
.hl-page-inner { position: relative; z-index: 1; }

/* NAVBAR */
.hl-nav {
  position: sticky; top: 0; z-index: 50;
  transition: background .3s, backdrop-filter .3s, border-color .3s;
  border-bottom: 1px solid transparent;
}
.hl-nav.scrolled { background: rgba(7,20,40,0.92); backdrop-filter: blur(14px); border-bottom: 1px solid var(--line); }
.hl-nav .hl-wrap { display: flex; align-items: center; justify-content: space-between; height: 78px; }
.hl-brand { display: flex; align-items: center; gap: 14px; text-decoration: none; }
.hl-brand .hl-mark { width: 38px; height: 38px; display: block; }
.hl-hash-dots circle { fill: var(--blue); }
.hl-brand-name { font-family: var(--f-head); font-weight: 900; font-size: 24px; letter-spacing: 0.04em; color: #fff; }
.hl-nav-actions { display: flex; align-items: center; gap: 14px; }

/* HERO */
.hl-hero {
  min-height: 100vh; display: flex; flex-direction: column;
  justify-content: center; padding-top: 40px; padding-bottom: 48px; overflow: hidden;
}
.hl-hero-inner { text-align: center; display: flex; flex-direction: column; align-items: center; }
.hl-pill {
  display: inline-flex; align-items: center; gap: 10px;
  border: 1px solid var(--line); background: rgba(255,255,255,0.02);
  padding: 9px 18px; font-size: 12.5px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase; color: #c9d6ea;
}
.hl-pill .hl-dot { width: 6px; height: 6px; background: var(--blue); display: inline-block; }
.hl-h1 { font-size: clamp(58px, 13.5vw, 200px); margin-top: 30px; }
.hl-h1 .l1 { display: block; color: #fff; }
.hl-h1 .l2 { display: block; color: var(--blue); font-style: italic; }
.hl-tagline {
  margin-top: 26px; font-weight: 800;
  font-size: clamp(13px, 1.5vw, 17px); letter-spacing: 0.16em;
  text-transform: uppercase; color: #c4d1e6;
  display: flex; gap: 16px; align-items: center; flex-wrap: wrap; justify-content: center;
}
.hl-tagline .sep { color: var(--blue); }
.hl-brush {
  margin-top: 30px; display: inline-block;
  background: linear-gradient(135deg, var(--blue), var(--blue-strong));
  color: #fff; font-family: var(--f-head); font-weight: 900;
  font-size: clamp(18px, 2.8vw, 30px); letter-spacing: 0.02em;
  padding: 14px 34px; transform: rotate(-1.4deg);
  clip-path: polygon(2% 12%, 99% 0, 100% 86%, 1% 100%);
  box-shadow: 0 18px 50px -20px rgba(30,144,255,0.9);
}
.hl-hero-ctas { margin-top: 40px; display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; }
.hl-stats {
  margin-top: 64px; display: flex; align-items: stretch; justify-content: center; gap: 0;
  border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
}
.hl-stat { padding: 26px 44px; text-align: center; }
.hl-stat + .hl-stat { border-left: 1px solid var(--line); }
.hl-stat .num { font-family: var(--f-head); font-weight: 900; font-size: clamp(34px, 5vw, 54px); color: #fff; line-height: 1; }
.hl-stat .num .plus { color: var(--blue); }
.hl-stat .lab { margin-top: 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: var(--muted); }

/* DOT GRIDS */
.hl-dotgrid { position: absolute; display: grid; grid-template-columns: repeat(6, 7px); gap: 11px; opacity: 0.5; pointer-events: none; }
.hl-dotgrid i { width: 4px; height: 4px; background: var(--blue); border-radius: 50%; }
.hl-dg-tl { top: 120px; left: var(--gutter); }
.hl-dg-tr { top: 120px; right: var(--gutter); }
.hl-trail { position: absolute; pointer-events: none; opacity: 0.5; color: var(--blue); }

/* FEATURES */
.hl-section-pad { padding-block: clamp(80px, 12vh, 150px); }
.hl-section-head { max-width: 720px; }
.hl-section-head h2 { font-size: clamp(38px, 6vw, 76px); margin-top: 22px; }
.hl-section-head .sub { margin-top: 20px; color: var(--muted); font-size: 18px; max-width: 540px; }
.hl-feat-grid {
  margin-top: 64px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
  border: 1px solid var(--line);
}
.hl-feat {
  padding: 40px 34px 44px; position: relative;
  transition: transform .35s cubic-bezier(.22,1,.36,1), background .35s, box-shadow .35s;
  background: linear-gradient(180deg, rgba(255,255,255,0.012), transparent);
}
.hl-feat + .hl-feat { border-left: 1px solid var(--line); }
.hl-feat:hover {
  transform: translateY(-8px); background: rgba(30,144,255,0.05);
  box-shadow: 0 40px 60px -34px rgba(30,144,255,0.6), inset 0 0 0 1px rgba(30,144,255,0.35); z-index: 2;
}
.hl-feat .ico {
  width: 56px; height: 56px; display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--line); color: var(--blue); margin-bottom: 28px;
  transition: border-color .35s, color .35s, background .35s;
}
.hl-feat:hover .ico { border-color: var(--blue); background: rgba(30,144,255,0.12); color: var(--cyan); }
.hl-feat .ico svg { width: 28px; height: 28px; }
.hl-feat h3 { font-size: 22px; letter-spacing: 0; font-weight: 900; }
.hl-feat .idx { position: absolute; top: 26px; right: 30px; font-family: var(--f-head); font-weight: 900; font-size: 15px; color: var(--muted-dim); }
.hl-feat p { margin-top: 14px; color: var(--muted); font-size: 15.5px; }

/* STEPS */
.hl-steps { display: flex; flex-direction: column; gap: clamp(70px, 10vh, 130px); margin-top: 72px; }
.hl-step { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(32px, 6vw, 90px); align-items: center; }
.hl-step.flip .step-text { order: 2; }
.hl-step-num {
  font-family: var(--f-head); font-weight: 900; font-size: clamp(60px, 9vw, 120px);
  color: transparent; -webkit-text-stroke: 1.5px rgba(125,139,163,0.45); line-height: 0.8; margin-bottom: 18px;
}
.hl-step .step-text h3 { font-size: clamp(30px, 4vw, 46px); }
.hl-step .step-text .when { color: var(--blue); }
.hl-step .step-text p { margin-top: 20px; color: var(--muted); font-size: 18px; max-width: 440px; }
.hl-mock {
  background: linear-gradient(180deg, var(--navy-card), var(--navy-deep));
  border: 1px solid var(--line); padding: 26px;
  box-shadow: 0 50px 80px -40px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.04);
}
.hl-mock-bar { display: flex; gap: 7px; margin-bottom: 22px; }
.hl-mock-bar i { width: 10px; height: 10px; display: block; background: rgba(255,255,255,0.12); }
.hl-mock-label { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted-dim); font-weight: 700; margin-bottom: 12px; }
.hl-field { display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--line); padding: 16px 18px; background: rgba(255,255,255,0.02); }
.hl-field .val { font-size: 15px; color: #d7e2f3; }
.hl-field .ok { width: 26px; height: 26px; background: rgba(56,200,120,0.16); color: #38c878; display: flex; align-items: center; justify-content: center; }
.hl-field .ok svg { width: 15px; height: 15px; }
.hl-bar-progress { height: 6px; background: rgba(255,255,255,0.06); margin-top: 20px; overflow: hidden; }
.hl-bar-progress i { display: block; height: 100%; width: 100%; background: linear-gradient(90deg, var(--blue), var(--cyan)); transform-origin: left; }
.hl-profile-top { display: flex; align-items: center; gap: 16px; }
.hl-avatar { width: 56px; height: 56px; background: linear-gradient(135deg, var(--blue), var(--blue-strong)); display: flex; align-items: center; justify-content: center; font-family: var(--f-head); font-weight: 900; font-size: 22px; }
.hl-profile-top .who { font-weight: 800; font-size: 17px; }
.hl-profile-top .role { font-size: 13px; color: var(--muted); }
.hl-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 22px; }
.hl-tag { font-size: 12px; font-weight: 700; letter-spacing: 0.04em; padding: 7px 12px; border: 1px solid var(--line); color: #bccbe2; }
.hl-tag.on { background: rgba(30,144,255,0.14); border-color: var(--blue); color: var(--cyan); }
.hl-post { display: flex; gap: 13px; padding: 14px 0; border-top: 1px solid var(--line-soft); }
.hl-post:first-of-type { border-top: 0; }
.hl-post .pa { width: 38px; height: 38px; flex: none; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; color: var(--cyan); }
.hl-post .pb .ph { font-weight: 700; font-size: 14px; }
.hl-post .pb .pt { font-size: 13.5px; color: var(--muted); margin-top: 2px; }

/* CTA */
.hl-cta-card {
  position: relative; text-align: center; overflow: hidden;
  background: radial-gradient(120% 140% at 50% -10%, rgba(30,144,255,0.22), transparent 60%),
              linear-gradient(180deg, var(--navy-card), var(--navy-deep));
  border: 1px solid var(--line);
  padding: clamp(56px, 9vw, 110px) var(--gutter);
}
.hl-cta-card::before {
  content: ""; position: absolute; inset: 0;
  background: radial-gradient(60% 80% at 50% 120%, rgba(30,144,255,0.3), transparent 70%);
  pointer-events: none;
}
.hl-cta-card h2 { font-size: clamp(36px, 6vw, 78px); max-width: 14ch; margin-inline: auto; position: relative; }
.hl-cta-card .sub { margin-top: 22px; color: #b7c5dc; font-size: 18px; position: relative; }
.hl-cta-card .hl-btn { margin-top: 42px; font-size: 17px; padding: 20px 38px; position: relative; }

/* FOOTER */
.hl-footer { border-top: 1px solid var(--line); padding-block: 48px; }
.hl-footer .hl-wrap { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
.hl-fbrand { display: flex; align-items: center; gap: 12px; }
.hl-fbrand .hl-mark { width: 26px; height: 26px; }
.hl-fmeta { color: var(--muted); font-size: 14px; }
.hl-fmeta b { color: #fff; font-weight: 800; letter-spacing: 0.04em; }
.hl-fnote { color: var(--muted-dim); font-size: 13px; margin-top: 4px; }
.hl-ig { width: 44px; height: 44px; border: 1px solid var(--line); display: flex; align-items: center; justify-content: center; color: var(--muted); transition: .3s; }
.hl-ig:hover { border-color: var(--blue); color: var(--cyan); transform: translateY(-2px); }
.hl-ig svg { width: 20px; height: 20px; }

/* RESPONSIVE */
@media (max-width: 900px) {
  .hl-feat-grid { grid-template-columns: repeat(2, 1fr); }
  .hl-feat:nth-child(3), .hl-feat:nth-child(4) { border-top: 1px solid var(--line); }
  .hl-step { grid-template-columns: 1fr; gap: 34px; }
  .hl-step.flip .step-text { order: 0; }
  .hl-dotgrid { display: none; }
}
@media (max-width: 560px) {
  .hl-feat-grid { grid-template-columns: 1fr; }
  .hl-feat + .hl-feat { border-left: 0; border-top: 1px solid var(--line); }
  .hl-stats { flex-direction: column; }
  .hl-stat + .hl-stat { border-left: 0; border-top: 1px solid var(--line); }
  .hl-brand-name { display: none; }
  .hl-tagline { font-size: 11px; gap: 10px; }
  .hl-nav-ghost-mobile { display: none; }
  .hl-btn { padding: 12px 18px; font-size: 13px; }
  .hl-brush { font-size: 16px; padding: 10px 22px; }
  .hl-hero-ctas { flex-direction: column; align-items: stretch; }
  .hl-hero-ctas .hl-btn { justify-content: center; }
  .hl-cta-card .hl-btn { width: 100%; justify-content: center; }
  .hl-step .step-text p { font-size: 16px; }
  .hl-footer .hl-wrap { flex-direction: column; align-items: flex-start; gap: 16px; }
}
`;

function HashMark({ size = 38, className = "" }) {
  return (
    <svg className={className} viewBox="0 0 100 100" width={size} height={size} style={{ color: "#fff", display: "block" }}>
      <g fill="currentColor">
        <rect x="30" y="12" width="12" height="76" />
        <rect x="58" y="12" width="12" height="76" />
        <rect x="12" y="30" width="76" height="12" />
        <rect x="12" y="58" width="76" height="12" />
      </g>
      <g className="hl-hash-dots">
        <circle cx="36" cy="36" r="6.5" />
        <circle cx="64" cy="36" r="6.5" />
        <circle cx="36" cy="64" r="6.5" />
        <circle cx="64" cy="64" r="6.5" />
      </g>
    </svg>
  );
}

export default function Landing() {
  const navRef = useRef();

  // Particle canvas
  useEffect(() => {
    const canvas = document.getElementById("hl-particles");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h, dpr, dots = [], raf;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      const n = Math.max(8, Math.round((w * h) / 26000 * 0.55));
      dots = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.8 + 0.6,
        vx: (Math.random() - 0.5) * 0.16, vy: (Math.random() - 0.5) * 0.16,
        a: Math.random() * 0.5 + 0.18, tw: Math.random() * Math.PI * 2,
      }));
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy; d.tw += 0.012;
        if (d.x < -10) d.x = w + 10; if (d.x > w + 10) d.x = -10;
        if (d.y < -10) d.y = h + 10; if (d.y > h + 10) d.y = -10;
        const flick = 0.6 + 0.4 * Math.sin(d.tw);
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56,189,248,${d.a * flick})`;
        ctx.fill();
      }
      if (!reduced) raf = requestAnimationFrame(tick);
    }

    window.addEventListener("resize", resize);
    resize();
    if (reduced) tick(); else raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(raf); };
  }, []);

  // Scroll reveal + counters + nav blur
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = navRef.current;

    // nav blur
    const onScroll = () => nav && nav.classList.toggle("scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // reveals
    const revealEls = [...document.querySelectorAll(".hl-reveal, .hl-reveal-l, .hl-reveal-r")];
    if (reduced) {
      revealEls.forEach(el => el.classList.add("in"));
    } else {
      let pending = [...revealEls];
      const showOne = el => { const d = parseInt(el.dataset.d || "0", 10); setTimeout(() => el.classList.add("in"), d); };
      const checkReveal = () => {
        const vh = window.innerHeight;
        pending = pending.filter(el => {
          const r = el.getBoundingClientRect();
          if (r.top < vh * 0.9 && r.bottom > 0) { showOne(el); return false; }
          return true;
        });
      };
      let ticking = false;
      const onScrollR = () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; checkReveal(); }); };
      window.addEventListener("scroll", onScrollR, { passive: true });
      window.addEventListener("resize", onScrollR, { passive: true });
      checkReveal();
      setTimeout(() => revealEls.forEach(el => el.classList.add("in")), 2600);
    }

    // counters
    const counters = [...document.querySelectorAll("[data-count]")];
    let cPending = [...counters];
    const runCounter = el => {
      const target = parseFloat(el.dataset.count);
      const vEl = el.querySelector(".v");
      if (!vEl) return;
      if (reduced) { vEl.textContent = target; return; }
      const dur = 1400, t0 = performance.now();
      const step = now => {
        const p = Math.min((now - t0) / dur, 1);
        vEl.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step); else vEl.textContent = target;
      };
      requestAnimationFrame(step);
    };
    const checkCounters = () => {
      const vh = window.innerHeight;
      cPending = cPending.filter(el => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.85) { runCounter(el); return false; }
        return true;
      });
    };
    window.addEventListener("scroll", checkCounters, { passive: true });
    checkCounters();
    setTimeout(checkCounters, 2600);

    // feature card tilt
    if (!reduced && window.matchMedia("(pointer:fine)").matches) {
      const grid = document.querySelector(".hl-feat-grid");
      if (grid) grid.style.perspective = "900px";
      document.querySelectorAll(".hl-feat").forEach(card => {
        card.addEventListener("mousemove", ev => {
          const r = card.getBoundingClientRect();
          const px = (ev.clientX - r.left) / r.width - 0.5;
          const py = (ev.clientY - r.top) / r.height - 0.5;
          card.style.transform = `translateY(-8px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
        });
        card.addEventListener("mouseleave", () => { card.style.transform = ""; });
      });
    }

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dots24 = Array.from({ length: 24 });

  return (
    <div className="hl-page">
      <style>{CSS}</style>
      <canvas id="hl-particles" />

      <div className="hl-page-inner">

        {/* NAVBAR */}
        <header className="hl-nav" ref={navRef}>
          <div className="hl-wrap">
            <Link className="hl-brand" to="/">
              <HashMark size={38} className="hl-mark" />
              <span className="hl-brand-name">HASH</span>
            </Link>
            <nav className="hl-nav-actions">
              <Link className="hl-btn hl-btn-ghost hl-nav-ghost-mobile" to="/login">Daxil ol</Link>
              <Link className="hl-btn hl-btn-primary" to="/register">Qeydiyyatdan keç</Link>
            </nav>
          </div>
        </header>

        {/* HERO */}
        <section className="hl-hero" id="top">
          <div className="hl-dotgrid hl-dg-tl">{dots24.map((_, i) => <i key={i} />)}</div>
          <div className="hl-dotgrid hl-dg-tr">{dots24.map((_, i) => <i key={i} />)}</div>

          <svg className="hl-trail" style={{ top: 90, right: "8%", width: 160 }} viewBox="0 0 200 120" fill="none">
            <path d="M4 96 C 40 96, 30 30, 80 34 S 150 70, 196 18" stroke="currentColor" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" />
            <path d="M196 18 l-22 6 l8 9 z" fill="currentColor" />
          </svg>

          <div className="hl-wrap hl-hero-inner">
            <span className="hl-pill hl-reveal" data-d="0">
              Tələbə <span className="hl-dot" /> Komanda <span className="hl-dot" /> Layihə <span className="hl-dot" /> Karyera
            </span>

            <h1 className="hl-h1">
              <span className="l1 hl-reveal" data-d="80">BİRLİKDƏ</span>
              <span className="l2 hl-reveal" data-d="180">YARADIRIQ.</span>
            </h1>

            <p className="hl-tagline hl-reveal" data-d="300">
              <span>İDEYAN VARSA</span><span className="sep">•</span>
              <span>KOMANDA QUR</span><span className="sep">•</span>
              <span>LAYİHƏNİ GERÇƏKLƏŞDİR</span>
            </p>

            <span className="hl-brush hl-reveal" data-d="400">SƏNİN İDEYAN, GƏLƏCƏYİN!</span>

            <div className="hl-hero-ctas hl-reveal" data-d="520">
              <Link className="hl-btn hl-btn-primary" to="/register">
                Platformaya qoşul
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </Link>
              <a className="hl-btn hl-btn-ghost" href="#imkanlar">Daha çox öyrən</a>
            </div>

            <div className="hl-stats hl-reveal" data-d="640">
              <div className="hl-stat">
                <div className="num" data-count="500"><span className="v">0</span><span className="plus">+</span></div>
                <div className="lab">Tələbə</div>
              </div>
              <div className="hl-stat">
                <div className="num" data-count="4"><span className="v">0</span></div>
                <div className="lab">Universitet</div>
              </div>
              <div className="hl-stat">
                <div className="num" data-count="1"><span className="v">0</span></div>
                <div className="lab">Şəbəkə</div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="hl-section-pad" id="imkanlar">
          <div className="hl-wrap">
            <div className="hl-section-head">
              <span className="hl-eyebrow hl-reveal">İmkanlar</span>
              <h2 className="hl-reveal" data-d="60">Platforma nə verir?</h2>
              <p className="sub hl-reveal" data-d="140">İdeyadan komandaya, komandadan layihəyə — hər addımda yanında.</p>
            </div>

            <div className="hl-feat-grid">
              {[
                {
                  idx: "01", title: "Komanda qur",
                  desc: "Eyni məqsəd üçün doğru insanlarla bir araya gəl.",
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                },
                {
                  idx: "02", title: "İdeyanı paylaş",
                  desc: "Yaradıcı fikirlərini cəmiyyətlə paylaş.",
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5C17.7 10.2 18 9 18 8A6 6 0 0 0 6 8c0 1 .3 2.2 1.5 3.5C8.3 12.3 8.8 13 9 14"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>,
                },
                {
                  idx: "03", title: "Layihəni qur",
                  desc: "İdeyadan reallığa gedən yolun ilk addımı.",
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
                },
                {
                  idx: "04", title: "Yarış & inkişaf et",
                  desc: "Yarışmalarda iştirak et, təcrübə qazan və irəli get.",
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
                },
              ].map((f, i) => (
                <article key={f.idx} className="hl-feat hl-reveal" data-d={i * 120}>
                  <span className="idx">{f.idx}</span>
                  <div className="ico">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* STEPS */}
        <section className="hl-section-pad" id="addimlar">
          <div className="hl-wrap">
            <div className="hl-section-head">
              <span className="hl-eyebrow hl-reveal">Addımlar</span>
              <h2 className="hl-reveal" data-d="60">Necə işləyir?</h2>
            </div>

            <div className="hl-steps">
              {/* STEP 01 */}
              <div className="hl-step">
                <div className="step-text hl-reveal-l">
                  <div className="hl-step-num">01</div>
                  <h3>Qeydiyyat — <span className="when">30 saniyə</span></h3>
                  <p>Universitet email ünvanın ilə qeydiyyatdan keç. Sistem səni avtomatik tanıyır və şəbəkəyə qoşulursan.</p>
                </div>
                <div className="hl-mock hl-reveal-r">
                  <div className="hl-mock-bar"><i /><i /><i /></div>
                  <div className="hl-mock-label">Qeydiyyat</div>
                  <div className="hl-field">
                    <span className="val">ad.soyad@uni.edu.az</span>
                    <span className="ok">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    </span>
                  </div>
                  <div className="hl-bar-progress"><i /></div>
                </div>
              </div>

              {/* STEP 02 */}
              <div className="hl-step flip">
                <div className="step-text hl-reveal-r">
                  <div className="hl-step-num">02</div>
                  <h3>Profil yarat — <span className="when">2 dəqiqə</span></h3>
                  <p>Bacarıqlarını, layihələrini və ixtisasını əlavə et. Profil kartın avtomatik hazırlanır.</p>
                </div>
                <div className="hl-mock hl-reveal-l">
                  <div className="hl-mock-bar"><i /><i /><i /></div>
                  <div className="hl-profile-top">
                    <div className="hl-avatar">A</div>
                    <div>
                      <div className="who">Aysel M.</div>
                      <div className="role">Kompüter Mühəndisliyi · 3-cü kurs</div>
                    </div>
                  </div>
                  <div className="hl-tags">
                    <span className="hl-tag on">Python</span>
                    <span className="hl-tag on">UI/UX</span>
                    <span className="hl-tag">React</span>
                    <span className="hl-tag">Robotika</span>
                    <span className="hl-tag on">Data</span>
                    <span className="hl-tag">Liderlik</span>
                  </div>
                </div>
              </div>

              {/* STEP 03 */}
              <div className="hl-step">
                <div className="step-text hl-reveal-l">
                  <div className="hl-step-num">03</div>
                  <h3>Şəbəkəyə qoşul — <span className="when">İndi</span></h3>
                  <p>Həmyaşıdlarınla əlaqə saxla, komanda tap və layihəni birlikdə başlat.</p>
                </div>
                <div className="hl-mock hl-reveal-r">
                  <div className="hl-mock-bar"><i /><i /><i /></div>
                  <div className="hl-mock-label">Axın</div>
                  <div className="hl-post">
                    <div className="pa">RŞ</div>
                    <div className="pb"><div className="ph">Rəşad Ş.</div><div className="pt">Hackathon üçün frontend developer axtarıram 🔍</div></div>
                  </div>
                  <div className="hl-post">
                    <div className="pa">NƏ</div>
                    <div className="pb"><div className="ph">Nərmin Ə.</div><div className="pt">Yeni AI layihəmizə komanda yığırıq — qoşulun!</div></div>
                  </div>
                  <div className="hl-post">
                    <div className="pa">TH</div>
                    <div className="pb"><div className="ph">Tural H.</div><div className="pt">Robotika yarışına 2 nəfər lazımdır.</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="hl-section-pad" id="qosul">
          <div className="hl-wrap">
            <div className="hl-cta-card hl-reveal">
              <h2>Akademik karyeranı bu gün inşa et.</h2>
              <p className="sub">Pulsuz qeydiyyat. Heç bir ödəniş yoxdur.</p>
              <Link className="hl-btn hl-btn-primary hl-pulse" to="/register">
                Qeydiyyatdan keç
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="hl-footer">
          <div className="hl-wrap">
            <div>
              <div className="hl-fbrand">
                <HashMark size={26} className="hl-mark" />
                <span className="hl-fmeta"><b>HASH</b> &nbsp;·&nbsp; hashcampus.site &nbsp;·&nbsp; © 2026</span>
              </div>
              <p className="hl-fnote">Hash müstəqil tələbə icmasıdır.</p>
            </div>
            <a className="hl-ig" href="https://www.instagram.com/hashcampus_official/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor"/></svg>
            </a>
          </div>
        </footer>

      </div>
    </div>
  );
}
