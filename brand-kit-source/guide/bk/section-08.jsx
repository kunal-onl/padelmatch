// ═══════════════════════════════════════════════════════════════════
//  SECTION 08: Implementation Tokens — copy-paste code blocks
// ═══════════════════════════════════════════════════════════════════

const Section08 = () => (
  <div>
    <SectionLabel num="08" title="IMPLEMENTATION TOKENS" color={T.lime} />

    <div style={{ ...sans, fontSize: 12, color: T.grey, lineHeight: 1.65, marginBottom: 12 }}>
      Copy these directly into your project. CSS custom properties for web, JS object for React / Emergent. Or download the full code package (see button in header).
    </div>

    <CodeBlock label="tokens.css — copy to /styles" code={`:root {
  /* ── COLOURS ───────────────────────────── */
  --pm-lime:    #C9E52F;
  --pm-blue:    #1A56FF;
  --pm-purple:  #6E28D9;
  --pm-ink:     #111118;
  --pm-cream:   #F5F2E8;
  --pm-white:   #FFFFFF;
  --pm-error:   #FF4136;
  --pm-win:     #1A6B3A;
  --pm-loss:    #B52A1C;
  --pm-grey:    #888888;
  --pm-border:  #DDDAD0;

  /* ── TYPOGRAPHY ─────────────────────────── */
  --pm-font-display: 'Unbounded', 'Arial Black', sans-serif;
  --pm-font-body:    'DM Sans', sans-serif;
  --pm-font-mono:    'DM Mono', monospace;

  /* ── STROKE WEIGHTS ─────────────────────── */
  --pm-s1: 1px;   --pm-s2: 2px;   --pm-s3: 3px;

  /* ── ACCENT STROKES ─────────────────────── */
  --pm-accent-top:  5px;
  --pm-accent-left: 4px;

  /* ── SPACING (4px base unit) ────────────── */
  --pm-sp1: 4px;   --pm-sp2: 8px;   --pm-sp3: 12px;  --pm-sp4: 16px;
  --pm-sp5: 20px;  --pm-sp6: 24px;  --pm-sp8: 32px;  --pm-sp10: 40px;

  /* ── CONTAINER DETAILS ──────────────────── */
  --pm-corner-mark:  16px;
  --pm-inner-inset:  4px;

  /* ── TEXTURE OPACITIES ──────────────────── */
  --pm-tx-subtle:   0.04;
  --pm-tx-standard: 0.06;
  --pm-tx-bold:     0.12;

  /* ── MIN TOUCH TARGET ───────────────────── */
  --pm-touch-min:   48px;
}`} />

    <CodeBlock label="tokens.js — copy to /lib" code={`export const T = {
  lime:   '#C9E52F',  blue:   '#1A56FF',
  purple: '#6E28D9',  ink:    '#111118',
  cream:  '#F5F2E8',  white:  '#FFFFFF',
  error:  '#FF4136',  win:    '#1A6B3A',
  loss:   '#B52A1C',  grey:   '#888888',
  border: '#DDDAD0',
  s1: '1px', s2: '2px', s3: '3px',
  accentTop: '5px', accentLeft: '4px',
  cornerMark: '16px', innerInset: '4px',
  txSubtle: 0.04, txStandard: 0.06, txBold: 0.12,
};
export const F = {
  display: "'Unbounded', 'Arial Black', sans-serif",
  body:    "'DM Sans', sans-serif",
  mono:    "'DM Mono', monospace",
};`} />

    <CodeBlock label="containers.css — class names" code={`/* Type A — Closed Primary */
.pm-card-a {
  border: var(--pm-s3) solid var(--pm-ink);
  background: var(--pm-white);
  overflow: hidden;
}
.pm-card-a .pm-accent-top {
  height: var(--pm-accent-top);
}

/* Type B — Corner Mark */
.pm-card-b { position: relative; }
.pm-card-b::before, .pm-card-b::after,
.pm-card-b > .pm-corner-bl, .pm-card-b > .pm-corner-br {
  content: ''; position: absolute;
  width: var(--pm-corner-mark); height: var(--pm-corner-mark);
  border-color: var(--pm-ink); border-style: solid; border-width: 0;
}
.pm-card-b::before { top:0; left:0;
  border-top-width: var(--pm-s2); border-left-width: var(--pm-s2); }
.pm-card-b::after { top:0; right:0;
  border-top-width: var(--pm-s2); border-right-width: var(--pm-s2); }

/* Type C — Left Accent */
.pm-card-c {
  display: flex;
  border: var(--pm-s2) solid var(--pm-ink);
  background: var(--pm-white);
  overflow: hidden;
}
.pm-card-c .pm-left-accent {
  width: var(--pm-accent-left); flex-shrink: 0;
}

/* Type F — Dashed Input */
.pm-card-f {
  border: var(--pm-s2) dashed var(--pm-border);
  background: var(--pm-white);
  transition: border-color 150ms ease;
}
.pm-card-f:hover, .pm-card-f:focus-within {
  border-color: var(--pm-ink);
}`} />

    <CodeBlock label="textures.css — class names" code={`.pm-texture-perforations {
  background-image: radial-gradient(
    circle, rgba(17,17,24,0.06) 1.5px, transparent 1.5px);
  background-size: 14px 14px;
}
.pm-texture-perforations-lime {
  background-image: radial-gradient(
    circle, rgba(201,229,47,0.07) 1.5px, transparent 1.5px);
  background-size: 14px 14px;
}
.pm-texture-court-lines {
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 29px, rgba(17,17,24,0.05) 30px),
    repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(17,17,24,0.05) 60px);
}
.pm-texture-glass-panels {
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 43px, rgba(17,17,24,0.05) 44px),
    repeating-linear-gradient(90deg, transparent, transparent 87px, rgba(17,17,24,0.05) 88px);
}
.pm-texture-wire-fence {
  background-image:
    repeating-linear-gradient(45deg, rgba(17,17,24,0.05) 0, rgba(17,17,24,0.05) 1px, transparent 0, transparent 50%),
    repeating-linear-gradient(-45deg, rgba(17,17,24,0.05) 0, rgba(17,17,24,0.05) 1px, transparent 0, transparent 50%);
  background-size: 10px 10px;
}
.pm-glass-inset { position: relative; }
.pm-glass-inset::after {
  content: ''; position: absolute;
  inset: var(--pm-inner-inset);
  border: 1px solid var(--pm-ink);
  opacity: 0.07; pointer-events: none;
}`} />

    {/* Quick reference */}
    <div style={{ border: `${T.s2} solid ${T.ink}`, background: T.white, marginTop: 8 }}>
      <div style={{ background: T.ink, padding: "6px 14px", borderBottom: `${T.s2} solid ${T.ink}` }}>
        <span style={{ ...ub, fontSize: 8, fontWeight: 700, color: T.lime, letterSpacing: "0.1em" }}>QUICK REFERENCE — DECISION RULES</span>
      </div>
      {[
        ["Is this interactive?", "Full border (Type A or D). Dashed if awaiting input (F).", T.blue],
        ["Is this read-only information?", "Corner marks only (Type B).", T.purple],
        ["Does it carry a status or notification?", "Left accent in semantic colour (Type C).", T.lime],
        ["Is it in-progress or incomplete?", "Open-sided container (Type E).", T.blue],
        ["What stroke weight?", "1px = internal rows. 2px = default. 3px = primary card, one per cluster.", T.purple],
        ["What does a top accent mean?", "The category or type of the card content.", T.lime],
        ["What does a left accent mean?", "The status or state of the content right now.", T.blue],
        ["When do I use coral?", "Only when something is an error, unavailable, or a loss. Never decoratively.", T.error],
        ["Which texture for empty states?", "Wire fence (off-limits feel) + dashed border (Type F).", T.purple],
        ["Which texture for profile / rating?", "Perforations on ink background at 5\u20137%.", T.lime],
      ].map(([q, a, col], i) => (
        <div key={q} style={{ display: "flex", gap: 0, borderBottom: i < 9 ? `1px solid ${T.border}` : "none" }}>
          <div style={{ width: 4, background: col, flexShrink: 0 }} />
          <div style={{ padding: "9px 12px", flex: 1 }}>
            <div style={{ ...mono, fontSize: 9, color: T.grey, letterSpacing: "0.04em", marginBottom: 2 }}>{q}</div>
            <div style={{ ...sans, fontSize: 11, color: T.ink, lineHeight: 1.5 }}>{a}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

Object.assign(window, { Section08 });
