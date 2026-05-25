// ═══════════════════════════════════════════════════════════════════
//  SECTION 09 — LOGO, WORDMARK, LOCKUPS, ICONS, IMAGERY
//  Wired into PM.* helpers from brand-engine-v2.js
// ═══════════════════════════════════════════════════════════════════

// Generic SVG / PNG download row for any preview tile
const AssetActions = ({ getSVG, getPNG, slug, sizes = [256, 512, 1024], copyHTML }) => {
  const [busy, setBusy] = React.useState(null);
  const [flash, setFlash] = React.useState(null);
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 200);
  };
  const handlePNG = async (size) => {
    setBusy(`png-${size}`);
    try {
      const blob = await getPNG(size);
      downloadBlob(blob, `${slug}@${size}.png`);
      setFlash(`png-${size}`);
    } catch (e) { setFlash(`fail-${size}`); }
    finally { setBusy(null); setTimeout(() => setFlash(null), 1400); }
  };
  const handleSVG = () => {
    const svgString = getSVG();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, `${slug}.svg`);
    setFlash('svg'); setTimeout(() => setFlash(null), 1400);
  };
  const handleCopy = async () => {
    if (!copyHTML) return;
    try { await navigator.clipboard.writeText(copyHTML()); setFlash('copy'); setTimeout(() => setFlash(null), 1400); } catch(_){}
  };
  const btn = (label, action, key) => (
    <button key={key} onClick={action} style={{
      background: flash === key ? T.lime : T.white,
      border: `1px solid ${T.ink}`,
      padding: "5px 8px", cursor: busy ? "wait" : "pointer",
      ...mono, fontSize: 8, fontWeight: 700, color: T.ink, letterSpacing: "0.06em",
    }}>{busy === key ? "…" : flash === key ? "✓" : label}</button>
  );
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: "8px 10px", background: T.cream, borderTop: `1px solid ${T.border}` }}>
      {getSVG && btn("SVG", handleSVG, "svg")}
      {sizes.map(s => btn(`PNG @${s}`, () => handlePNG(s), `png-${s}`))}
      {copyHTML && btn("COPY HTML", handleCopy, "copy")}
    </div>
  );
};

// Generic preview tile: header + preview area + actions
const AssetTile = ({ title, sub, bg = T.cream, children, actions }) => (
  <div style={{ border: `${T.s2} solid ${T.ink}`, background: T.white, marginBottom: 12 }}>
    <div style={{ background: T.ink, padding: "7px 12px", borderBottom: `${T.s2} solid ${T.ink}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
      <span style={{ ...ub, fontSize: 9, fontWeight: 700, color: T.lime, letterSpacing: "0.08em" }}>{title}</span>
      {sub && <span style={{ ...mono, fontSize: 7, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em", textAlign: "right" }}>{sub}</span>}
    </div>
    <div style={{ background: bg, padding: 18, minHeight: 100, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: `1px solid ${T.border}` }}>
      {children}
    </div>
    {actions}
  </div>
);

// ── 09 — LOGO & LOCKUPS ─────────────────────────────────────────────
const Section09 = () => {
  if (!window.PM || !PM.buildLogoSVG) {
    return <div style={{ padding: 20, ...sans, color: T.error }}>Logo engine not loaded. Check brand-engine-v2.js / brand-wordmark-v2.js.</div>;
  }

  // Use PM helpers to render each preview
  const lockupCfgs = [
    {
      title: "HORIZONTAL · DEFAULT",
      sub: "mark + wordmark · cream bg",
      slug: "padelmatch-lockup-h",
      bg: T.cream,
      opts: { orientation: "horizontal", caseId: "pm-split", weightId: "w900", specialId: "clean", padelColor: "ink", cellFills: { TL: T.blue, BR: T.lime }, markSize: 160 },
    },
    {
      title: "HORIZONTAL · TAGLINE",
      sub: "find the perfect match. · cream bg",
      slug: "padelmatch-lockup-h-tag",
      bg: T.cream,
      opts: { orientation: "horizontal", caseId: "pm-split", weightId: "w900", specialId: "clean", padelColor: "ink", cellFills: { TL: T.blue, BR: T.lime }, showTagline: true, tagline: "Find the perfect match.", markSize: 180 },
    },
    {
      title: "HORIZONTAL · ON INK",
      sub: "dark surface · white text",
      slug: "padelmatch-lockup-h-ink",
      bg: T.ink,
      opts: { orientation: "horizontal", caseId: "pm-split", weightId: "w900", specialId: "clean", padelColor: "ink", cellFills: { TL: T.blue, BR: T.lime }, onInk: true, markSize: 160 },
    },
    {
      title: "STACKED · CENTERED",
      sub: "mark above wordmark",
      slug: "padelmatch-lockup-stacked",
      bg: T.cream,
      opts: { orientation: "stacked", caseId: "pm-single", weightId: "w900", specialId: "clean", padelColor: "ink", cellFills: { TL: T.blue, BR: T.lime }, markSize: 200 },
    },
  ];

  const wordmarkCfgs = [
    { title: "PADEL MATCH · TWO WORDS",     slug: "padelmatch-wm-split",  opts: { caseId: "pm-split",  weightId: "w900", specialId: "clean", padelColor: "ink" } },
    { title: "PADELMATCH · ONE WORD",       slug: "padelmatch-wm-single", opts: { caseId: "pm-single", weightId: "w900", specialId: "clean", padelColor: "ink" } },
    { title: "PADEL MATCH · MIX 900/700",   slug: "padelmatch-wm-mix",    opts: { caseId: "pm-split",  weightId: "wmix", specialId: "clean", padelColor: "ink" } },
    { title: "PADEL MATCH · BLUE/LIME",     slug: "padelmatch-wm-color",  opts: { caseId: "pm-split",  weightId: "w900", specialId: "clean", padelColor: "blue", color1: T.blue, color2: T.lime } },
  ];

  const markCfgs = [
    { title: "MARK · DEFAULT (TL BLUE, BR LIME)", slug: "padelmatch-mark", opts: { cellFills: { TL: T.blue, BR: T.lime } } },
    { title: "MARK · ALL BLUE FILLS",             slug: "padelmatch-mark-blue", opts: { cellFills: { TL: T.blue, BR: T.blue } } },
    { title: "MARK · ALL LIME FILLS",             slug: "padelmatch-mark-lime", opts: { cellFills: { TL: T.lime, BR: T.lime } } },
    { title: "MARK · ON INK",                     slug: "padelmatch-mark-ink",  bg: T.ink, opts: { cellFills: { TL: T.blue, BR: T.lime }, onInk: true } },
    { title: "LETTER · P (BOWL OVERLAY)",         slug: "padelmatch-mark-P",    opts: { showLetter: "P", cellFills: {} } },
    { title: "LETTER · M (STEM OVERLAY)",         slug: "padelmatch-mark-M",    opts: { showLetter: "M", cellFills: {} } },
  ];

  return (
    <div>
      <SectionLabel num="09" title="LOGO & LOCKUPS" color={T.lime} />

      <div style={{ ...sans, fontSize: 12, color: T.grey, lineHeight: 1.65, marginBottom: 16 }}>
        The mark is a top-down padel court: two cages, six cells, a centre net. Drawn from a 90 × 36 unit grid with 4-unit corner radius. The wordmark uses Unbounded 900 with a tight letterspacing of -0.04em. In horizontal lockups, the mark's <em>visible court height</em> exactly matches the wordmark cap-height (or wordmark + tagline combined height) — calibrated from real font metrics.
      </div>

      {/* ── 09.1 GEOMETRY ANATOMY ── */}
      <div style={{ border: `${T.s2} solid ${T.ink}`, background: T.white, marginBottom: 12 }}>
        <div style={{ background: T.ink, padding: "7px 12px", borderBottom: `${T.s2} solid ${T.ink}` }}>
          <span style={{ ...ub, fontSize: 9, fontWeight: 700, color: T.lime, letterSpacing: "0.08em" }}>09.1 — GEOMETRY ANATOMY</span>
        </div>
        <div style={{ padding: "16px 14px", background: T.cream, borderBottom: `1px solid ${T.border}` }}
             dangerouslySetInnerHTML={{ __html: PM.buildLogoSVG({ width: 540, cellFills: { TL: T.blue, BR: T.lime }, includeGrid: false }) }}
        />
        <div style={{ padding: "12px 14px" }}>
          {[
            ["viewBox", "5 30 90 36 — 90 wide × 36 tall units"],
            ["aspect ratio", "2.5 : 1 (90/36)"],
            ["corner radius", "4 units (rounded outer corners on both cages)"],
            ["outer wall", "3 units thick (top/bottom/sides)"],
            ["inner wall", "3 units thick (cage interior dividers)"],
            ["middle gap", "between TL/BL and TR/BR cells, ~2.5 units"],
            ["net", "5 units wide × 26 tall, centered at x=50, always black/ink"],
            ["cell fills", "default TL=blue, BR=lime · others optional"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 12, marginBottom: 5, alignItems: "flex-start" }}>
              <div style={{ ...mono, fontSize: 8, color: T.grey, letterSpacing: "0.08em", textTransform: "uppercase", width: 100, flexShrink: 0, paddingTop: 1 }}>{k}</div>
              <div style={{ ...sans, fontSize: 11, color: T.ink, lineHeight: 1.5, flex: 1 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 09.2 MARK VARIATIONS ── */}
      <div style={{ ...ub, fontSize: 10, fontWeight: 700, color: T.ink, letterSpacing: "0.08em", margin: "20px 0 8px" }}>09.2 — MARK VARIATIONS</div>
      {markCfgs.map((cfg, i) => (
        <AssetTile
          key={cfg.slug}
          title={cfg.title}
          sub="square crop"
          bg={cfg.bg || T.cream}
          actions={
            <AssetActions
              slug={cfg.slug}
              sizes={[256, 512, 1024]}
              getSVG={() => PM.buildLogoSVG({ ...cfg.opts, width: 1024, includeXMLDecl: true })}
              getPNG={(size) => new Promise(async (resolve, reject) => {
                try {
                  // Mark-only: render the SVG into a square canvas with padding
                  const svgString = PM.buildLogoSVG({ ...cfg.opts, width: size });
                  const img = await PM._svgToImage(svgString);
                  const canvas = document.createElement('canvas');
                  canvas.width = size; canvas.height = size;
                  const ctx = canvas.getContext('2d');
                  ctx.fillStyle = cfg.bg === T.ink ? T.ink : T.cream;
                  ctx.fillRect(0, 0, size, size);
                  const pad = size * 0.10;
                  const w = size - 2 * pad;
                  const h = w / PM.ASPECT;
                  ctx.drawImage(img, pad, (size - h) / 2, w, h);
                  canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob null')), 'image/png');
                } catch (e) { reject(e); }
              })}
            />
          }
        >
          <div style={{ width: "100%", display: "flex", justifyContent: "center" }}
               dangerouslySetInnerHTML={{ __html: PM.buildLogoSVG({ ...cfg.opts, width: 280 }) }}
          />
        </AssetTile>
      ))}

      {/* ── 09.3 WORDMARK VARIATIONS ── */}
      <div style={{ ...ub, fontSize: 10, fontWeight: 700, color: T.ink, letterSpacing: "0.08em", margin: "20px 0 8px" }}>09.3 — WORDMARK VARIATIONS</div>
      {wordmarkCfgs.map((cfg, i) => (
        <AssetTile
          key={cfg.slug}
          title={cfg.title}
          sub="cream bg · cap-aligned"
          actions={
            <AssetActions
              slug={cfg.slug}
              sizes={[512, 1024, 2048]}
              copyHTML={() => PM.buildWordmarkHTML({ ...cfg.opts, size: 96 })}
              getSVG={null}
              getPNG={(size) => PM.renderWordmarkPNG(cfg.opts, size, Math.round(size * 0.33), T.cream)}
            />
          }
        >
          <div style={{ width: "100%", display: "flex", justifyContent: "center", padding: "10px 0" }}
               dangerouslySetInnerHTML={{ __html: PM.buildWordmarkHTML({ ...cfg.opts, size: 36 }) }}
          />
        </AssetTile>
      ))}

      {/* ── 09.4 LOCKUPS ── */}
      <div style={{ ...ub, fontSize: 10, fontWeight: 700, color: T.ink, letterSpacing: "0.08em", margin: "20px 0 8px" }}>09.4 — LOCKUPS</div>
      {lockupCfgs.map((cfg, i) => (
        <AssetTile
          key={cfg.slug}
          title={cfg.title}
          sub={cfg.sub}
          bg={cfg.bg}
          actions={
            <AssetActions
              slug={cfg.slug}
              sizes={[800, 1600, 3200]}
              copyHTML={() => PM.buildLockupHTML(cfg.opts)}
              getSVG={null}
              getPNG={(size) => PM.renderLockupPNG(cfg.opts, size, Math.round(size * (cfg.opts.showTagline ? 0.42 : 0.32)), cfg.bg)}
            />
          }
        >
          <div style={{ width: "100%", display: "flex", justifyContent: "center", padding: "6px 0" }}
               dangerouslySetInnerHTML={{ __html: PM.buildLockupHTML({ ...cfg.opts, markSize: Math.min(cfg.opts.markSize || 160, 130) }) }}
          />
        </AssetTile>
      ))}

      {/* ── 09.5 OG / SOCIAL CARD ── */}
      <div style={{ ...ub, fontSize: 10, fontWeight: 700, color: T.ink, letterSpacing: "0.08em", margin: "20px 0 8px" }}>09.5 — OG / SOCIAL CARD</div>
      {[
        { title: "OG · CREAM · 1200 × 630", bg: T.cream, onInk: false, slug: "padelmatch-og-cream" },
        { title: "OG · INK · 1200 × 630",   bg: T.ink,   onInk: true,  slug: "padelmatch-og-ink"   },
      ].map((cfg) => (
        <AssetTile
          key={cfg.slug}
          title={cfg.title}
          sub="<meta property='og:image'> · social link previews"
          bg={cfg.bg}
          actions={
            <AssetActions
              slug={cfg.slug}
              sizes={[600, 1200]}
              getSVG={null}
              getPNG={(size) => PM.renderLockupPNG({
                caseId: "pm-single", weightId: "w900", specialId: "clean", padelColor: "ink",
                cellFills: { TL: T.blue, BR: T.lime }, onInk: cfg.onInk, showTagline: true,
                tagline: "Find the perfect match.",
              }, size, Math.round(size * 630 / 1200), cfg.bg)}
            />
          }
        >
          <div style={{ width: "100%", aspectRatio: "1200/630", display: "flex", alignItems: "center", justifyContent: "center" }}
               dangerouslySetInnerHTML={{ __html: PM.buildLockupHTML({
                 orientation: "horizontal", caseId: "pm-single", weightId: "w900", specialId: "clean", padelColor: "ink",
                 cellFills: { TL: T.blue, BR: T.lime }, onInk: cfg.onInk, showTagline: true,
                 tagline: "Find the perfect match.", markSize: 100,
               }) }}
          />
        </AssetTile>
      ))}

      {/* ── 09.6 USAGE RULES ── */}
      <div style={{ ...ub, fontSize: 10, fontWeight: 700, color: T.ink, letterSpacing: "0.08em", margin: "20px 0 8px" }}>09.6 — USAGE RULES</div>
      <div style={{ border: `${T.s2} solid ${T.ink}`, background: T.white }}>
        {[
          ["Clear space", "Minimum padding around the mark = ½ mark-height on all sides. Around lockup = ½ wordmark cap-height.", T.lime],
          ["Minimum size — mark", "24px tall (digital), 8mm tall (print). Below this, drop the cell-fill detail.", T.blue],
          ["Minimum size — lockup", "120px wide (digital). Below this, use mark-only.", T.blue],
          ["Mark + wordmark alignment", "Wordmark caps align with TOP of visible court. Wordmark baseline aligns with BOTTOM of visible court. Calibrated by font metrics — do not eyeball.", T.purple],
          ["Tagline alignment", "Tagline cap-band sits in the space between wordmark baseline and visible court bottom. Use Unbounded\u2014no, DM Mono 400 at 30% of wordmark size with 0.12em tracking.", T.purple],
          ["Cell fills", "Default: TL = blue, BR = lime. Other cells empty (cream / ink). Never fill all 6 cells — the asymmetry is part of the identity.", T.lime],
          ["Net colour", "Net stays solid ink (or solid white on dark). Never coloured. Acts as anchor.", T.ink],
          ["Letter overlays", "P highlights left cage walls; M highlights both pillars + top + net stem. Only highlight existing court walls — never invent new strokes.", T.blue],
          ["Forbidden", "Drop shadows. Outlines (mark already IS outlined). Recolouring outer wall (always ink). Rotating the mark. Stretching aspect ratio.", T.error],
        ].map(([k, v, col], i, arr) => (
          <div key={k} style={{ display: "flex", gap: 0, borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ width: 4, background: col, flexShrink: 0 }} />
            <div style={{ padding: "9px 12px", flex: 1 }}>
              <div style={{ ...ub, fontSize: 9, fontWeight: 700, color: T.ink, letterSpacing: "-0.02em", marginBottom: 2 }}>{k}</div>
              <div style={{ ...sans, fontSize: 11, color: T.grey, lineHeight: 1.5 }}>{v}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 09.7 INTEGRATION CODE ── */}
      <div style={{ ...ub, fontSize: 10, fontWeight: 700, color: T.ink, letterSpacing: "0.08em", margin: "20px 0 8px" }}>09.7 — REACT INTEGRATION</div>
      <CodeBlock label="Logo.jsx — drop-in React component" code={`import { LOGO_GEOMETRY } from './logo-geometry';

export function Logo({ size = 64, cellFills = { TL: '#1A56FF', BR: '#C9E52F' }, onInk = false }) {
  const VB = LOGO_GEOMETRY.viewBox;        // "5 30 90 36"
  const bg = onInk ? '#111118' : 'transparent';
  const stroke = onInk ? '#FFFFFF' : '#111118';
  return (
    <svg width={size} height={size / 2.5} viewBox={VB}
         style={{ display: 'inline-block', background: bg }}>
      {Object.entries(cellFills).map(([cell, color]) => {
        const c = LOGO_GEOMETRY.cells[cell];
        if (!c || !color) return null;
        return <rect key={cell} x={c.x} y={c.y} width={c.w} height={c.h} fill={color}/>;
      })}
      <path d={LOGO_GEOMETRY.courtPath} fill={stroke} fillRule="evenodd"/>
      <rect x={LOGO_GEOMETRY.net.x} y={LOGO_GEOMETRY.net.y}
            width={LOGO_GEOMETRY.net.w} height={LOGO_GEOMETRY.net.h}
            fill={stroke}/>
    </svg>
  );
}

export function Lockup({ size = 200, showTagline = false, onInk = false }) {
  // Mark height : wordmark cap : tagline cap is calibrated by font metrics.
  // For exact alignment use the renderer in /lib/lockup.js
  // For simple cases, this approximation works:
  const markH = size * 0.4;
  const wmSize = showTagline ? markH * 0.62 : markH * 1.20;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.08 }}>
      <Logo size={size} onInk={onInk}/>
      <div style={{ display: 'flex', flexDirection: 'column', gap: wmSize * 0.18 }}>
        <span style={{
          fontFamily: "'Unbounded', sans-serif",
          fontWeight: 900,
          fontSize: wmSize,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: onInk ? '#FFFFFF' : '#111118',
        }}>PADEL <span style={{ color: '#C9E52F' }}>MATCH</span></span>
        {showTagline && <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: wmSize * 0.30,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: onInk ? 'rgba(255,255,255,0.55)' : 'rgba(17,17,24,0.55)',
        }}>FIND THE PERFECT MATCH.</span>}
      </div>
    </div>
  );
}`} />
    </div>
  );
};

Object.assign(window, { Section09 });
