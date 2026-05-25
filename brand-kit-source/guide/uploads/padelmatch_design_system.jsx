import { useState } from "react";

// ═══════════════════════════════════════════════════════════════════
// PADELMATCH.IN — COMPLETE DESIGN SYSTEM
// Version 1.0 · Sport Brutalism
// For use by: Claude Code, Emergent, and human developers
// ═══════════════════════════════════════════════════════════════════

// ── Design tokens ──────────────────────────────────────────────────
const T = {
  // COLOUR
  lime:    "#C9E52F",  // Primary — action, CTA, active, rating, #1
  blue:    "#1A56FF",  // Secondary — rank, section headers, later-slots
  purple:  "#6E28D9",  // Tertiary — profile, info, connections, onboarding
  ink:     "#111118",  // Anchor — all type, borders, nav bg, structural
  cream:   "#F5F2E8",  // Background — warm app surface, never clinical white
  white:   "#FFFFFF",  // Card surface — content areas only
  error:   "#FF4136",  // Error ONLY — loss, unavailable, form error, never decorative
  win:     "#1A6B3A",  // Win state
  loss:    "#B52A1C",  // Loss state (distinct from error/coral)
  grey:    "#888888",  // Secondary text, labels, inactive
  border:  "#DDDAD0",  // Subtle borders, row dividers

  // STROKE WEIGHTS
  s1: "1px",  // Internal subdivisions, row separators, chart elements
  s2: "2px",  // Standard containers, interactive elements, default
  s3: "3px",  // Primary structural containers, hero cards

  // ACCENT STROKES
  accentTop:  "5px",  // Category identifier (what the card IS)
  accentLeft: "4px",  // Status/state indicator (what IS HAPPENING)

  // SPACING (4px base unit)
  sp1: "4px", sp2: "8px", sp3: "12px", sp4: "16px",
  sp5: "20px", sp6: "24px", sp8: "32px", sp10: "40px",

  // CORNER MARK SIZE
  cornerMark: "16px",
  innerInset: "4px",   // Glass panel reference: inner offset border

  // TEXTURE OPACITIES
  txSubtle:   0.04,
  txStandard: 0.06,
  txBold:     0.12,
};

const F = {
  display: "'Unbounded', 'Arial Black', sans-serif",
  body:    "'DM Sans', sans-serif",
  mono:    "'DM Mono', monospace",
};

// ── Shared style shortcuts ─────────────────────────────────────────
const ub   = { fontFamily: F.display };
const sans = { fontFamily: F.body };
const mono = { fontFamily: F.mono };

// ═══════════════════════════════════════════════════════════════════
// CONTAINER COMPONENTS
// These are the canonical implementations for each container type.
// ═══════════════════════════════════════════════════════════════════

// TYPE A — CLOSED PRIMARY (3px full border)
// Use for: Game Card, Player Card, Shot Card, Venue Card, Onboarding Steps
const ContainerA = ({ children, accentColor, style = {} }) => (
  <div style={{
    border: `${T.s3} solid ${T.ink}`,
    background: T.white,
    overflow: "hidden",
    ...style,
  }}>
    {accentColor && (
      <div style={{ height: T.accentTop, background: accentColor }} />
    )}
    {children}
  </div>
);

// TYPE B — CORNER MARK (2px L-shapes, no full border)
// Use for: Stat Block, Rating Display, Availability Grid, Radar Chart, Sparkline
const ContainerB = ({ children, color = T.ink, size = 16, weight = 2, style = {} }) => (
  <div style={{ position: "relative", ...style }}>
    {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h]) => (
      <div key={`${v}${h}`} style={{
        position: "absolute", [v]: 0, [h]: 0,
        width: size, height: size,
        [`border${v.charAt(0).toUpperCase()+v.slice(1)}`]: `${weight}px solid ${color}`,
        [`border${h.charAt(0).toUpperCase()+h.slice(1)}`]: `${weight}px solid ${color}`,
        pointerEvents: "none",
      }} />
    ))}
    {children}
  </div>
);

// TYPE C — LEFT ACCENT (2px full border + accent left stripe)
// Use for: Notifications, Match recommendations, Relationship banners, Alert rows
// Accent colour = semantic meaning: lime=positive, blue=info, purple=profile, error=problem
const ContainerC = ({ children, accentColor = T.blue, style = {} }) => (
  <div style={{
    display: "flex",
    border: `${T.s2} solid ${T.ink}`,
    background: T.white,
    overflow: "hidden",
    ...style,
  }}>
    <div style={{ width: T.accentLeft, background: accentColor, flexShrink: 0 }} />
    <div style={{ flex: 1 }}>
      {children}
    </div>
  </div>
);

// TYPE D — TOP ACCENT (section/card header band)
// Use for: Section headers, card type identifiers, category labels
// Rendered as a coloured header band above the card content, border wraps full card
const ContainerD = ({ children, accentColor = T.blue, label, labelColor = T.white, style = {} }) => (
  <div style={{
    border: `${T.s2} solid ${T.ink}`,
    background: T.white,
    overflow: "hidden",
    ...style,
  }}>
    {label && (
      <div style={{
        background: accentColor,
        padding: `${T.sp2} ${T.sp4}`,
        borderBottom: `${T.s2} solid ${T.ink}`,
        ...ub, fontSize: 8, fontWeight: 700, letterSpacing: "0.12em",
        textTransform: "uppercase", color: labelColor,
      }}>
        {label}
      </div>
    )}
    {children}
  </div>
);

// TYPE E — OPEN-SIDED (3 sides, open at bottom)
// Use for: In-progress states, pending score entry, incomplete match cards
const ContainerE = ({ children, openSide = "bottom", style = {} }) => {
  const borders = {
    borderTop:    openSide !== "top"    ? `${T.s2} solid ${T.ink}` : "none",
    borderRight:  openSide !== "right"  ? `${T.s2} solid ${T.ink}` : "none",
    borderBottom: openSide !== "bottom" ? `${T.s2} solid ${T.ink}` : "none",
    borderLeft:   openSide !== "left"   ? `${T.s2} solid ${T.ink}` : "none",
  };
  return (
    <div style={{ background: T.white, ...borders, ...style }}>
      {children}
    </div>
  );
};

// TYPE F — DASHED (expected input / empty state)
// Use for: Empty player slot, add-connection, unfilled form area, awaiting input
const ContainerF = ({ children, style = {} }) => (
  <div style={{
    border: `${T.s2} dashed ${T.border}`,
    background: T.white,
    ...style,
  }}>
    {children}
  </div>
);

// ── Net divider component ──────────────────────────────────────────
const NetDivider = ({ color = T.ink, opacity = 0.15 }) => (
  <svg width="100%" height="8" preserveAspectRatio="none" viewBox="0 0 400 8">
    <line x1="0" y1="1" x2="400" y2="1" stroke={color} strokeWidth="1.5" strokeOpacity={opacity * 1.6}/>
    <line x1="0" y1="7" x2="400" y2="7" stroke={color} strokeWidth="1" strokeOpacity={opacity}/>
    {Array.from({length:67},(_,i)=>(
      <line key={i} x1={i*6} y1="1" x2={i*6} y2="7" stroke={color} strokeWidth="0.5" strokeOpacity={opacity * 0.55}/>
    ))}
  </svg>
);

// ── Texture CSS generators ─────────────────────────────────────────
const TX = {
  perforations: (opacity = T.txStandard, color = T.ink) => ({
    backgroundImage: `radial-gradient(circle, ${color}${Math.round(opacity*255).toString(16).padStart(2,'0')} 1.5px, transparent 1.5px)`,
    backgroundSize: "14px 14px",
  }),
  courtLines: (opacity = T.txStandard, color = T.ink) => ({
    backgroundImage: [
      `repeating-linear-gradient(0deg, transparent, transparent 29px, ${color}${Math.round(opacity*255).toString(16).padStart(2,'0')} 30px)`,
      `repeating-linear-gradient(90deg, transparent, transparent 59px, ${color}${Math.round(opacity*255).toString(16).padStart(2,'0')} 60px)`,
    ].join(", "),
  }),
  glassPanels: (opacity = T.txStandard, color = T.ink) => ({
    backgroundImage: [
      `repeating-linear-gradient(0deg, transparent, transparent 43px, ${color}${Math.round(opacity*255).toString(16).padStart(2,'0')} 44px)`,
      `repeating-linear-gradient(90deg, transparent, transparent 87px, ${color}${Math.round(opacity*255).toString(16).padStart(2,'0')} 88px)`,
    ].join(", "),
  }),
  wireFence: (opacity = T.txStandard, color = T.ink) => ({
    backgroundImage: [
      `repeating-linear-gradient(45deg, ${color}${Math.round(opacity*255).toString(16).padStart(2,'0')} 0, ${color}${Math.round(opacity*255).toString(16).padStart(2,'0')} 1px, transparent 0, transparent 50%)`,
      `repeating-linear-gradient(-45deg, ${color}${Math.round(opacity*255).toString(16).padStart(2,'0')} 0, ${color}${Math.round(opacity*255).toString(16).padStart(2,'0')} 1px, transparent 0, transparent 50%)`,
    ].join(", "),
    backgroundSize: "10px 10px",
  }),
};

// ═══════════════════════════════════════════════════════════════════
// SECTION COMPONENTS (for the document itself)
// ═══════════════════════════════════════════════════════════════════

const SectionLabel = ({ num, title, color = T.lime }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 0,
    border: `${T.s2} solid ${T.ink}`, marginBottom: 16, marginTop: 28,
    background: T.ink,
  }}>
    <div style={{
      background: color, width: 40, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "10px 0",
      ...ub, fontSize: 11, fontWeight: 900, color: T.ink,
    }}>{num}</div>
    <div style={{ padding: "10px 14px",
      ...ub, fontSize: 11, fontWeight: 700, color: T.white, letterSpacing: "-0.02em",
    }}>{title}</div>
  </div>
);

const RuleRow = ({ rule, detail, tag, tagColor = T.blue }) => (
  <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${T.border}`, background: T.white }}>
    <div style={{ width: 5, background: tagColor, flexShrink: 0 }} />
    <div style={{ flex: 1, padding: "9px 12px" }}>
      <div style={{ ...ub, fontSize: 10, fontWeight: 700, color: T.ink, letterSpacing: "-0.02em" }}>{rule}</div>
      {detail && <div style={{ ...sans, fontSize: 11, color: T.grey, lineHeight: 1.5, marginTop: 2 }}>{detail}</div>}
    </div>
    {tag && (
      <div style={{ padding: "9px 12px", display: "flex", alignItems: "center" }}>
        <span style={{ ...mono, fontSize: 8, letterSpacing: "0.08em", background: tagColor, color: tagColor === T.lime ? T.ink : T.white, padding: "2px 6px" }}>{tag}</span>
      </div>
    )}
  </div>
);

const CodeBlock = ({ code }) => (
  <div style={{ background: "#1a1a22", border: `${T.s2} solid ${T.ink}`, marginBottom: 16, overflow: "auto" }}>
    <div style={{ background: T.lime, padding: "5px 12px", borderBottom: `1px solid ${T.ink}` }}>
      <span style={{ ...mono, fontSize: 8, fontWeight: 700, color: T.ink, letterSpacing: "0.1em" }}>CSS / TOKENS</span>
    </div>
    <pre style={{ ...mono, fontSize: 10, color: "#C9E52F", padding: "14px 16px", lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {code}
    </pre>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════════

const sections = [
  { id: "overview",    label: "01 Overview",    short: "01" },
  { id: "colour",      label: "02 Colour",       short: "02" },
  { id: "typography",  label: "03 Typography",   short: "03" },
  { id: "strokes",     label: "04 Strokes",      short: "04" },
  { id: "containers",  label: "05 Containers",   short: "05" },
  { id: "textures",    label: "06 Textures",     short: "06" },
  { id: "components",  label: "07 Components",   short: "07" },
  { id: "tokens",      label: "08 Tokens",       short: "08" },
];

// ═══════════════════════════════════════════════════════════════════
// MAIN DOCUMENT
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [active, setActive] = useState("overview");

  return (
    <div style={{ background: T.cream, minHeight: "100vh", fontFamily: F.body }}>

      {/* ── Cover header ── */}
      <div style={{ background: T.ink, padding: "28px 20px 20px", borderBottom: `4px solid ${T.lime}`, ...TX.courtLines(0.05, T.lime) }}>
        <div style={{ ...mono, fontSize: 8, color: T.lime, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 10 }}>padelmatch.in</div>
        <div style={{ ...ub, fontSize: 26, fontWeight: 900, color: T.white, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 4 }}>DESIGN SYSTEM</div>
        <div style={{ ...ub, fontSize: 14, fontWeight: 400, color: T.purple, letterSpacing: "-0.01em", marginBottom: 8 }}>Sport Brutalism — Version 1.0</div>
        <div style={{ ...sans, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>For Claude Code · Emergent · Human developers</div>
      </div>

      {/* ── Navigation ── */}
      <div style={{ background: T.ink, display: "flex", flexWrap: "wrap", borderBottom: `${T.s2} solid ${T.ink}` }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActive(s.id)} style={{
            background: active === s.id ? T.lime : "transparent",
            border: "none", borderRight: `1px solid rgba(255,255,255,0.06)`,
            padding: "9px 10px", cursor: "pointer",
            ...mono, fontSize: 8, fontWeight: 700, letterSpacing: "0.08em",
            color: active === s.id ? T.ink : "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
          }}>{s.short}</button>
        ))}
        <div style={{ flex: 1, padding: "9px 10px", ...mono, fontSize: 8, color: "rgba(255,255,255,0.2)" }}>
          {sections.find(s => s.id === active)?.label}
        </div>
      </div>

      <div style={{ padding: "4px 16px 80px" }}>

        {/* ════════════════════════════════════════════
            01 OVERVIEW
        ════════════════════════════════════════════ */}
        {active === "overview" && (<div>
          <SectionLabel num="01" title="OVERVIEW & DESIGN PHILOSOPHY" />

          <ContainerD label="PRODUCT" accentColor={T.purple} style={{ marginBottom: 12 }}>
            <div style={{ padding: "12px 14px" }}>
              {[
                ["Name", "PadelMatch"],
                ["Domain", "padelmatch.in"],
                ["Type", "Mobile-first PWA — primary breakpoint 390px (iPhone 14)"],
                ["Community", "North Goa Padel — ~100–200 players, 7 courts"],
                ["Tagline", "The right game. The right players. The right time."],
              ].map(([k,v]) => (
                <div key={k} style={{ display: "flex", gap: 12, marginBottom: 8, alignItems: "flex-start" }}>
                  <div style={{ ...mono, fontSize: 9, color: T.grey, letterSpacing: "0.1em", textTransform: "uppercase", width: 80, flexShrink: 0, paddingTop: 1 }}>{k}</div>
                  <div style={{ ...sans, fontSize: 12, color: T.ink, lineHeight: 1.5, flex: 1 }}>{v}</div>
                </div>
              ))}
            </div>
          </ContainerD>

          <ContainerD label="AESTHETIC DIRECTION" accentColor={T.blue} style={{ marginBottom: 12 }}>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ ...ub, fontSize: 14, fontWeight: 900, color: T.ink, letterSpacing: "-0.03em", marginBottom: 8 }}>SPORT BRUTALISM</div>
              <div style={{ ...sans, fontSize: 12, color: T.grey, lineHeight: 1.65 }}>
                Bold, unsentimental, typographic. Treats data like a scoreboard and the rating like a sports jersey number. Structure comes from strong ink, heavy type, and a grid-based layout rooted in the physical geometry of a padel court. The product should feel like it was designed for this community — not adapted from a generic sports app template.
              </div>
            </div>
          </ContainerD>

          <div style={{ border: `${T.s2} solid ${T.ink}`, background: T.white, marginBottom: 12 }}>
            <div style={{ background: T.ink, padding: "6px 14px", borderBottom: `${T.s2} solid ${T.ink}` }}>
              <span style={{ ...ub, fontSize: 8, fontWeight: 700, color: T.lime, letterSpacing: "0.1em" }}>THIS / NOT THIS</span>
            </div>
            {[
              ["✓ DO", "Premium members club energy — like a boutique padel facility", T.win],
              ["✓ DO", "Data-dense but padded — information feels alive, not clinical", T.win],
              ["✓ DO", "The rating number is the hero. Give it maximum visual weight everywhere", T.win],
              ["✓ DO", "Explain every recommendation. No black-box suggestions", T.win],
              ["✗ DON'T", "Generic fitness app with a new logo", T.error],
              ["✗ DON'T", "Beach/Goa clichés — no palm trees, sunset gradients", T.error],
              ["✗ DON'T", "Border-radius as decoration. Corners are hard", T.error],
              ["✗ DON'T", "Inter or Roboto. Never", T.error],
            ].map(([tag, text, col], i) => (
              <div key={i} style={{ display: "flex", gap: 0, borderBottom: i < 7 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ width: 5, background: col, flexShrink: 0 }} />
                <div style={{ padding: "8px 12px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ ...mono, fontSize: 9, fontWeight: 700, color: col, letterSpacing: "0.06em", flexShrink: 0, paddingTop: 1 }}>{tag}</span>
                  <span style={{ ...sans, fontSize: 12, color: T.ink, lineHeight: 1.4 }}>{text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>)}

        {/* ════════════════════════════════════════════
            02 COLOUR
        ════════════════════════════════════════════ */}
        {active === "colour" && (<div>
          <SectionLabel num="02" title="COLOUR SYSTEM" color={T.lime} />

          {/* Palette strip */}
          <div style={{ display: "flex", gap: 0, border: `${T.s2} solid ${T.ink}`, marginBottom: 16 }}>
            {[
              [T.lime,   "#C9E52F", "PRIMARY",   false],
              [T.blue,   "#1A56FF", "SECONDARY", true],
              [T.purple, "#6E28D9", "TERTIARY",  true],
              [T.ink,    "#111118", "INK",       true],
              [T.cream,  "#F5F2E8", "CREAM",     false],
              [T.white,  "#FFFFFF", "WHITE",     false],
              [T.error,  "#FF4136", "ERROR",     true],
            ].map(([bg, hex, role, light]) => (
              <div key={hex} style={{ flex: 1, height: 70, background: bg, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "5px 6px", borderRight: `1px solid ${T.ink}` }}>
                <span style={{ ...mono, fontSize: 6.5, color: light ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.5)", lineHeight: 1.5 }}>{hex}</span>
                <span style={{ ...mono, fontSize: 6, color: light ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }}>{role}</span>
              </div>
            ))}
          </div>

          {/* Contrast checks */}
          <div style={{ border: `${T.s2} solid ${T.ink}`, background: T.white, marginBottom: 16 }}>
            <div style={{ background: T.ink, padding: "6px 14px", borderBottom: `${T.s2} solid ${T.ink}` }}>
              <span style={{ ...ub, fontSize: 8, fontWeight: 700, color: T.lime, letterSpacing: "0.1em" }}>WCAG CONTRAST RATIOS</span>
            </div>
            <div style={{ display: "flex", gap: 0 }}>
              {[[T.lime,T.ink,"Lime/Ink","7.4:1"],[T.blue,T.white,"Blue/White","5.1:1"],[T.purple,T.white,"Purple/White","7.4:1"],[T.error,T.white,"Error/White","4.6:1"]].map(([bg,fg,name,ratio])=>(
                <div key={name} style={{ flex:1, background:bg, padding:"10px 8px", borderRight:`1px solid ${T.ink}` }}>
                  <div style={{ ...ub, fontSize:11, fontWeight:900, color:fg }}>Aa</div>
                  <div style={{ ...mono, fontSize:8, color:fg, opacity:0.8, marginTop:3 }}>{ratio}</div>
                  <div style={{ ...mono, fontSize:7, color:fg, opacity:0.5, marginTop:1 }}>{name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Semantic rules */}
          <div style={{ border: `${T.s2} solid ${T.ink}` }}>
            <div style={{ background: T.ink, padding: "6px 14px", borderBottom: `${T.s2} solid ${T.ink}` }}>
              <span style={{ ...ub, fontSize: 8, fontWeight: 700, color: T.lime, letterSpacing: "0.1em" }}>SEMANTIC USAGE RULES</span>
            </div>
            {[
              [T.lime,   "LIME #C9E52F",   "CTAs · active nav · rating number · #1 rank · preferred court slots · confirm actions · win states (paired with T.win for text)", "NEVER as error or warning"],
              [T.blue,   "BLUE #1A56FF",   "Rank badges · section header bands · Strong Match indicator · game card accent stripe · later-option slots · score entry header", "NEVER as a background with dark text at small sizes — contrast insufficient"],
              [T.purple, "PURPLE #6E28D9", "Player profile header · connection/relationship banners · onboarding section headers · info/context states · tertiary emphasis", "NEVER for availability states or match outcomes"],
              [T.error,  "CORAL #FF4136",  "Unavailable courts · form validation errors · loss state badge · offline/inactive player · system errors", "NEVER decoratively. If in doubt, do not use."],
            ].map(([color, name, use, never], i) => (
              <div key={name} style={{ borderBottom: i < 3 ? `1px solid ${T.border}` : "none", background: T.white }}>
                <div style={{ display: "flex", gap: 0 }}>
                  <div style={{ width: 8, background: color, flexShrink: 0 }} />
                  <div style={{ padding: "10px 12px", flex: 1 }}>
                    <div style={{ ...mono, fontSize: 10, fontWeight: 600, color: T.ink, marginBottom: 3 }}>{name}</div>
                    <div style={{ ...sans, fontSize: 11, color: T.grey, lineHeight: 1.5, marginBottom: 4 }}>✓ {use}</div>
                    <div style={{ ...sans, fontSize: 11, color: T.error, lineHeight: 1.5 }}>✗ {never}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>)}

        {/* ════════════════════════════════════════════
            03 TYPOGRAPHY
        ════════════════════════════════════════════ */}
        {active === "typography" && (<div>
          <SectionLabel num="03" title="TYPOGRAPHY" color={T.purple} />

          {/* Import note */}
          <CodeBlock code={`@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');`} />

          {[
            {
              name: "UNBOUNDED", role: "Display / Headings",
              weights: ["400 — secondary headings, labels in purple", "700 — section headings, card headers", "900 — rating numbers, leaderboard ranks, CTAs, hero text"],
              never: "Body copy. Nothing smaller than 11px. Sentence case.",
              demo: <div>
                <div style={{ ...ub, fontSize: 56, fontWeight: 900, color: T.lime, letterSpacing: "-0.04em", lineHeight: 1 }}>7.2</div>
                <div style={{ ...ub, fontSize: 18, fontWeight: 700, color: T.ink, letterSpacing: "-0.03em" }}>NORTH GOA PADEL</div>
                <div style={{ ...ub, fontSize: 13, fontWeight: 400, color: T.purple, letterSpacing: "-0.01em" }}>Player Profile · Season 2025</div>
              </div>,
              bg: T.cream,
            },
            {
              name: "DM SANS", role: "Body / UI copy",
              weights: ["400 — body text, descriptions, notifications", "500 — labels, secondary headings", "600 — emphasis within body text"],
              never: "Headings or display use. Min size 11px. Avoid all-caps.",
              demo: <div>
                <div style={{ ...sans, fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 4 }}>Be honest — this helps us match you accurately.</div>
                <div style={{ ...sans, fontSize: 12, color: T.grey, lineHeight: 1.65 }}>A game at your #1 venue just opened. Abhizer and David are already in. Two spots left.</div>
              </div>,
              bg: T.white,
            },
            {
              name: "DM MONO", role: "Scores / Ratings / Stats / Labels",
              weights: ["400 — secondary mono text, timestamps, codes", "500 — scores, stat values, rating numbers at small sizes"],
              never: "Body copy or descriptions. Excessive use dilutes the scoreboard character.",
              demo: <div>
                <div style={{ ...mono, fontSize: 22, color: T.ink, letterSpacing: "0.05em" }}>6–2  4–6  7–5</div>
                <div style={{ ...mono, fontSize: 12, color: T.grey, marginTop: 4, letterSpacing: "0.12em", textTransform: "uppercase" }}>Thu 22 May · 19:00–21:00</div>
                <div style={{ ...mono, fontSize: 10, color: T.lime, marginTop: 4, letterSpacing: "0.15em", textTransform: "uppercase" }}>Section Label</div>
              </div>,
              bg: T.white,
            },
          ].map((typeface, i) => (
            <div key={typeface.name} style={{ border: `${T.s2} solid ${T.ink}`, marginBottom: 12, overflow: "hidden" }}>
              <div style={{ background: T.ink, padding: "8px 14px", borderBottom: `${T.s2} solid ${T.ink}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ ...ub, fontSize: 10, fontWeight: 700, color: T.white }}>{typeface.name}</div>
                <div style={{ ...mono, fontSize: 8, color: T.grey, letterSpacing: "0.08em" }}>{typeface.role}</div>
              </div>
              <div style={{ background: typeface.bg, padding: "16px 14px", borderBottom: `1px solid ${T.border}` }}>
                {typeface.demo}
              </div>
              <div style={{ padding: "10px 14px" }}>
                <div style={{ ...mono, fontSize: 8, color: T.grey, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Weights</div>
                {typeface.weights.map(w => (
                  <div key={w} style={{ ...sans, fontSize: 11, color: T.ink, marginBottom: 3 }}>· {w}</div>
                ))}
                <div style={{ ...sans, fontSize: 11, color: T.error, marginTop: 6 }}>✗ {typeface.never}</div>
              </div>
            </div>
          ))}
        </div>)}

        {/* ════════════════════════════════════════════
            04 STROKE WEIGHTS
        ════════════════════════════════════════════ */}
        {active === "strokes" && (<div>
          <SectionLabel num="04" title="STROKE WEIGHT SYSTEM" color={T.blue} />

          <div style={{ ...sans, fontSize: 12, color: T.grey, lineHeight: 1.65, marginBottom: 16 }}>
            Three tiers. If in doubt, use 2px. The 3px border communicates primary structural importance — use it sparingly so it retains that signal. The 1px border is purely organisational: it subdivides without asserting.
          </div>

          {[
            {
              tier: "S3", px: "3px", name: "PRIMARY STRUCTURAL",
              use: "The outermost border of the dominant interactive card on any screen. Game Card, Player Card, Shot Card, Venue Card, Onboarding Step. Use maximum one S3 container per visual cluster.",
              never: "Buttons, pills, secondary containers, row separators, or any container more than 3 per screen",
              color: T.lime,
              demo: (
                <div style={{ border: `3px solid ${T.ink}`, background: T.white, padding: "14px" }}>
                  <div style={{ ...ub, fontSize: 12, fontWeight: 700, color: T.ink }}>GAME CARD — 3px</div>
                  <div style={{ ...sans, fontSize: 11, color: T.grey, marginTop: 3 }}>Primary interactive card container</div>
                </div>
              ),
            },
            {
              tier: "S2", px: "2px", name: "STANDARD",
              use: "Default border weight. All interactive elements (buttons, selects, pills). Secondary cards and containers. Navigation. Modal sheets. The overwhelming majority of borders in the UI.",
              never: "Row separators within a card (use 1px) or anything intended to be subtle/internal",
              color: T.blue,
              demo: (
                <div style={{ border: `2px solid ${T.ink}`, background: T.white, padding: "14px" }}>
                  <div style={{ ...ub, fontSize: 12, fontWeight: 700, color: T.ink }}>SECONDARY CARD — 2px</div>
                  <div style={{ ...sans, fontSize: 11, color: T.grey, marginTop: 3 }}>Standard container, buttons, selects</div>
                </div>
              ),
            },
            {
              tier: "S1", px: "1px", name: "INTERNAL / SUBDIVISION",
              use: "Row separators within a card. Chart and sparkline elements. Internal card divisions (e.g. between stat cells). Subtle section breaks within a single container.",
              never: "Card outer borders, interactive elements, or anything requiring clear visual definition",
              color: T.purple,
              demo: (
                <div style={{ border: `2px solid ${T.ink}`, background: T.white }}>
                  {[["23","Matches"],["61%","Win"],["#4","Rank"]].map(([v,k],i)=>(
                    <div key={k} style={{ display:"flex", alignItems:"center", padding:"10px 14px", borderBottom: i<2 ? `1px solid ${T.border}` : "none" }}>
                      <div style={{ ...mono, fontSize:16, color:T.ink, flex:1 }}>{v}</div>
                      <div style={{ ...sans, fontSize:9, color:T.grey, textTransform:"uppercase", letterSpacing:"0.1em" }}>{k}</div>
                    </div>
                  ))}
                  <div style={{ background:T.blue, padding:"4px 14px", ...mono, fontSize:7, color:T.white, letterSpacing:"0.1em" }}>Row separators = 1px solid border</div>
                </div>
              ),
            },
          ].map((tier) => (
            <div key={tier.tier} style={{ border: `${T.s2} solid ${T.ink}`, marginBottom: 12 }}>
              <div style={{ background: tier.color, padding: "6px 14px", borderBottom: `${T.s2} solid ${T.ink}`, display: "flex", justifyContent: "space-between" }}>
                <div style={{ ...ub, fontSize: 9, fontWeight: 700, color: tier.color === T.lime ? T.ink : T.white, letterSpacing: "0.1em" }}>TIER {tier.tier} — {tier.px}</div>
                <div style={{ ...ub, fontSize: 9, fontWeight: 700, color: tier.color === T.lime ? T.ink : T.white }}>{tier.name}</div>
              </div>
              <div style={{ background: T.cream, padding: "14px", borderBottom: `1px solid ${T.border}` }}>
                {tier.demo}
              </div>
              <div style={{ background: T.white, padding: "10px 14px" }}>
                <div style={{ ...sans, fontSize: 11, color: T.ink, lineHeight: 1.55, marginBottom: 4 }}>✓ {tier.use}</div>
                <div style={{ ...sans, fontSize: 11, color: T.error, lineHeight: 1.55 }}>✗ {tier.never}</div>
              </div>
            </div>
          ))}
        </div>)}

        {/* ════════════════════════════════════════════
            05 CONTAINERS
        ════════════════════════════════════════════ */}
        {active === "containers" && (<div>
          <SectionLabel num="05" title="CONTAINER SYSTEM" color={T.blue} />

          <div style={{ ...sans, fontSize: 12, color: T.grey, lineHeight: 1.65, marginBottom: 16 }}>
            Six container types. Each maps to a specific semantic context. The container type communicates what kind of content you're looking at before you read a word. This grammar is derived from the physical padel court: closed glass panels, open court corners, painted status lines, wire fence for off-limits.
          </div>

          {[
            {
              type: "A", name: "CLOSED PRIMARY",
              stroke: "3px full border + optional 5px accent top",
              source: "Glass wall panels — fully enclosed, structurally definitive",
              use: "Game Card, Player Card, Shot Card, Venue Card, Onboarding Step Card",
              rule: "Maximum one Type A container per visual cluster. Accent top colour identifies category.",
              demo: (
                <ContainerA accentColor={T.blue}>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ ...ub, fontSize: 12, fontWeight: 700, color: T.ink }}>JOLT METHOD</div>
                    <div style={{ ...mono, fontSize: 11, color: T.grey, marginTop: 3 }}>THU 22 MAY · 19:00–21:00</div>
                  </div>
                </ContainerA>
              ),
            },
            {
              type: "B", name: "CORNER MARK",
              stroke: "2px L-shapes at each corner, no connecting stroke",
              source: "Court corner markers — define the boundary without enclosing",
              use: "Stat Block, Rating Display, Availability Grid, Radar Chart, Sparkline container",
              rule: "The open space signals read-only / informational. Never use for interactive elements.",
              demo: (
                <ContainerB style={{ padding: "14px" }}>
                  <div style={{ textAlign: "center", padding: "8px 0" }}>
                    <div style={{ ...ub, fontSize: 42, fontWeight: 900, color: T.ink, letterSpacing: "-0.04em", lineHeight: 1 }}>7.2</div>
                    <div style={{ ...mono, fontSize: 8, color: T.grey, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 4 }}>Game Rating</div>
                  </div>
                </ContainerB>
              ),
            },
            {
              type: "C", name: "LEFT ACCENT",
              stroke: "2px full border + 4px solid left stripe in semantic colour",
              source: "Court painted sidelines — status runs along the vertical axis",
              use: "Notification rows, Match recommendations, Relationship banners, Connection states",
              rule: "Left accent colour = semantic state. Lime=positive/match, Blue=info, Purple=profile/social, Error=problem. The stripe IS the status — no additional badge needed.",
              demo: (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <ContainerC accentColor={T.lime}><div style={{ padding: "9px 12px", ...sans, fontSize: 12, color: T.ink }}>⚡ A game at Jolt Method just opened — Abhizer is in it</div></ContainerC>
                  <ContainerC accentColor={T.blue}><div style={{ padding: "9px 12px", ...sans, fontSize: 12, color: T.ink }}>🏆 You've moved up to #3 in North Goa Padel</div></ContainerC>
                  <ContainerC accentColor={T.purple}><div style={{ padding: "9px 12px", ...sans, fontSize: 12, color: T.ink }}>👤 Priya S. wants to connect</div></ContainerC>
                  <ContainerC accentColor={T.error}><div style={{ padding: "9px 12px", ...sans, fontSize: 12, color: T.ink }}>🚫 Sunday Club Court 2 — unavailable</div></ContainerC>
                </div>
              ),
            },
            {
              type: "D", name: "TOP ACCENT (HEADER BAND)",
              stroke: "2px full border, coloured header band at top",
              source: "Court category/zone markings — the horizontal net defines categories of space",
              use: "Section headers, card category identifiers, modal/sheet headers, onboarding step headers",
              rule: "Top accent = content CATEGORY (what is this card about?). Header band includes a label in Unbounded 700, 8px, 0.12em tracking. Accent colour = category: Blue=game/match, Purple=player/profile, Lime=action/positive.",
              demo: (
                <ContainerD label="PLAYER PROFILE" accentColor={T.purple}>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ ...ub, fontSize: 12, fontWeight: 700, color: T.ink }}>KUNAL MEHTA</div>
                    <div style={{ ...sans, fontSize: 10, color: T.grey, marginTop: 3 }}>Vagator · since 2023</div>
                  </div>
                </ContainerD>
              ),
            },
            {
              type: "E", name: "OPEN-SIDED",
              stroke: "2px on 3 sides, open at bottom (default) or right",
              source: "Court ends — the glass panels don't fully enclose, the net leaves an opening",
              use: "In-progress match card, pending score entry, awaiting confirmation, incomplete action",
              rule: "The open side signals incompleteness — something is still to come. Combine with a ghost CTA at the open edge to invite completion.",
              demo: (
                <ContainerE openSide="bottom">
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ ...ub, fontSize: 11, fontWeight: 700, color: T.ink }}>SCORE PENDING</div>
                    <div style={{ ...sans, fontSize: 11, color: T.grey, marginTop: 4 }}>Jolt Method · Thu 22 May</div>
                    <div style={{ ...mono, fontSize: 18, color: T.ink, marginTop: 8, letterSpacing: "0.06em" }}>_ — _</div>
                  </div>
                </ContainerE>
              ),
            },
            {
              type: "F", name: "DASHED INPUT",
              stroke: "2px dashed #DDDAD0 (border colour) — hover state: 2px dashed ink",
              source: "Empty player slot markers — the court is ready but unfilled",
              use: "Empty player slot, add-connection prompt, unfilled form area, file upload zone, awaiting input",
              rule: "Dashed border = expected input. On hover/focus: border colour transitions from border (#DDDAD0) to ink (#111118). Never use for completed/filled states.",
              demo: (
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ width: 48, height: 48, background: T.lime, border: `2px solid ${T.ink}`, display: "flex", alignItems: "center", justifyContent: "center", ...ub, fontSize: 16, fontWeight: 900, color: T.ink }}>K</div>
                  <div style={{ width: 48, height: 48, background: T.cream, border: `2px solid ${T.ink}`, display: "flex", alignItems: "center", justifyContent: "center", ...ub, fontSize: 16, fontWeight: 900, color: T.ink }}>A</div>
                  <ContainerF style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ ...ub, fontSize: 20, fontWeight: 300, color: T.border }}>+</span>
                  </ContainerF>
                  <ContainerF style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ ...ub, fontSize: 20, fontWeight: 300, color: T.border }}>+</span>
                  </ContainerF>
                </div>
              ),
            },
          ].map((ct) => (
            <div key={ct.type} style={{ border: `${T.s2} solid ${T.ink}`, marginBottom: 12 }}>
              <div style={{ background: T.ink, padding: "7px 14px", borderBottom: `${T.s2} solid ${T.ink}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ ...ub, fontSize: 9, fontWeight: 700, color: T.lime }}>TYPE {ct.type} — {ct.name}</div>
                <div style={{ ...mono, fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>{ct.stroke}</div>
              </div>
              <div style={{ background: T.cream, padding: "16px", borderBottom: `1px solid ${T.border}` }}>
                {ct.demo}
              </div>
              <div style={{ background: T.white, padding: "10px 14px" }}>
                <div style={{ ...mono, fontSize: 8, color: T.grey, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Source: {ct.source}</div>
                <div style={{ ...sans, fontSize: 11, color: T.grey, lineHeight: 1.55, marginBottom: 4 }}>✓ Use for: {ct.use}</div>
                <div style={{ ...sans, fontSize: 11, color: T.ink, lineHeight: 1.55 }}>{ct.rule}</div>
              </div>
            </div>
          ))}
        </div>)}

        {/* ════════════════════════════════════════════
            06 TEXTURES
        ════════════════════════════════════════════ */}
        {active === "textures" && (<div>
          <SectionLabel num="06" title="PADEL-DERIVED TEXTURES" color={T.purple} />

          <div style={{ ...sans, fontSize: 12, color: T.grey, lineHeight: 1.65, marginBottom: 16 }}>
            Five textures drawn directly from the physical padel court. Applied at 4–8% opacity as background textures. Never compete with content. Applied at 15–25% as intentional decorative accents in specific moments (rating reveal, empty states). The NetDivider is a component, not a CSS texture.
          </div>

          {[
            {
              name: "PERFORATIONS",
              source: "~36 circular holes in the racket face, organic cluster pattern",
              css: `/* Dot grid at standard opacity */\nbackground-image: radial-gradient(circle, #111118 1.5px, transparent 1.5px);\nbackground-size: 14px 14px;\nopacity: 0.06;`,
              use: "Rating reveal hero (dot grid + cluster motif). Empty player slot background. Profile card background at 5%.",
              demo: <div style={{ height: 60, background: T.ink, ...TX.perforations(0.07, "#C9E52F"), display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ ...ub, fontSize: 36, fontWeight: 900, color: T.lime, letterSpacing: "-0.04em" }}>7.2</div>
              </div>,
            },
            {
              name: "COURT LINES",
              source: "Top-down view of padel court: 2×1 rectangle divided into service quadrants",
              css: `/* 30px vertical × 60px horizontal grid */\nbackground-image:\n  repeating-linear-gradient(0deg, transparent 29px, #C9E52F 30px),\n  repeating-linear-gradient(90deg, transparent 59px, #C9E52F 60px);\nopacity: 0.05;`,
              use: "Hero header on home dashboard. Leaderboard header band. Full-screen onboarding backgrounds on ink.",
              demo: <div style={{ height: 56, background: T.ink, ...TX.courtLines(0.06, "#C9E52F"), display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ ...mono, fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: "0.15em" }}>COURT LINES AT 6% ON INK</div>
              </div>,
            },
            {
              name: "GLASS PANELS",
              source: "3×2 grid of glass wall panels, each ~2×1m, visible aluminium framing",
              css: `/* 44px × 88px panel grid */\nbackground-image:\n  repeating-linear-gradient(0deg, transparent 43px, #111118 44px),\n  repeating-linear-gradient(90deg, transparent 87px, #111118 88px);\nopacity: 0.05;\n\n/* Also: inner inset border */\n.glass-inset::after {\n  content: '';\n  position: absolute;\n  inset: 4px;\n  border: 1px solid #111118;\n  opacity: 0.07;\n  pointer-events: none;\n}`,
              use: "Section break backgrounds. Login/splash screen. Inner inset border on Type A cards for glass-panel depth.",
              demo: <div style={{ height: 56, background: T.cream, ...TX.glassPanels(0.07), display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ ...mono, fontSize: 9, color: T.grey, letterSpacing: "0.15em" }}>GLASS PANELS AT 7% ON CREAM</div>
              </div>,
            },
            {
              name: "WIRE FENCE",
              source: "Diamond/chainlink fencing above glass panels and at court ends",
              css: `/* 10px diamond mesh */\nbackground-image:\n  repeating-linear-gradient(45deg, #111118 0, #111118 1px, transparent 0, transparent 50%),\n  repeating-linear-gradient(-45deg, #111118 0, #111118 1px, transparent 0, transparent 50%);\nbackground-size: 10px 10px;\nopacity: 0.06;`,
              use: "Empty states ('no games available'). Unavailable court backgrounds. Off-limits / blocked sections. Never on active, positive states.",
              demo: <div style={{ height: 56, background: T.cream, ...TX.wireFence(0.06), display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ ...ub, fontSize: 10, fontWeight: 700, color: T.ink, letterSpacing: "-0.02em" }}>NO GAMES RIGHT NOW</div>
              </div>,
            },
            {
              name: "NET DIVIDER",
              source: "The padel net: 88cm tall, horizontal top/bottom cables, tight vertical mesh",
              css: `/* SVG component — not a CSS texture */\n/* See NetDivider component */\n/* Props: color, opacity */\n/* Default: color=#111118, opacity=0.15 */`,
              use: "Section dividers between dashboard sections. Between venue info and match badge in game card. Replaces all plain <hr> elements in the app.",
              demo: <div style={{ background: T.white, padding: "10px 0" }}>
                <NetDivider color={T.ink} opacity={0.2}/>
              </div>,
            },
          ].map((tx) => (
            <div key={tx.name} style={{ border: `${T.s2} solid ${T.ink}`, marginBottom: 12 }}>
              <div style={{ background: T.ink, padding: "7px 14px", borderBottom: `${T.s2} solid ${T.ink}` }}>
                <div style={{ ...ub, fontSize: 9, fontWeight: 700, color: T.lime, letterSpacing: "0.08em" }}>{tx.name}</div>
                <div style={{ ...mono, fontSize: 8, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{tx.source}</div>
              </div>
              <div style={{ borderBottom: `1px solid ${T.border}` }}>{tx.demo}</div>
              <div style={{ background: "#1a1a22", padding: "10px 14px", borderBottom: `1px solid ${T.border}` }}>
                <pre style={{ ...mono, fontSize: 9, color: T.lime, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{tx.css}</pre>
              </div>
              <div style={{ background: T.white, padding: "10px 14px" }}>
                <div style={{ ...sans, fontSize: 11, color: T.grey, lineHeight: 1.55 }}>✓ {tx.use}</div>
              </div>
            </div>
          ))}
        </div>)}

        {/* ════════════════════════════════════════════
            07 COMPONENTS
        ════════════════════════════════════════════ */}
        {active === "components" && (<div>
          <SectionLabel num="07" title="COMPONENT MAP" color={T.blue} />

          <div style={{ border: `${T.s2} solid ${T.ink}` }}>
            <div style={{ background: T.ink, padding: "6px 14px", borderBottom: `${T.s2} solid ${T.ink}` }}>
              <span style={{ ...ub, fontSize: 8, fontWeight: 700, color: T.lime, letterSpacing: "0.1em" }}>COMPONENT → CONTAINER TYPE → ACCENT COLOUR → TEXTURE</span>
            </div>
            {[
              ["Game Card",          "A (3px, closed)",    "Top: Blue (category)",  "None"],
              ["Player Card",        "A (3px, closed)",    "Top: Purple (profile)",  "Perforations 5% on stat area"],
              ["Shot Card",          "A (3px, closed)",    "None",                  "None"],
              ["Venue Card",         "A (3px, closed)",    "None",                  "None"],
              ["Rating Display",     "B (corner marks)",   "None",                  "Perforations 7% on ink bg"],
              ["Stat Block",         "B (corner marks)",   "None",                  "None"],
              ["Availability Grid",  "B (corner marks)",   "None",                  "None"],
              ["Radar Chart",        "B (corner marks)",   "None",                  "None"],
              ["Notification Row",   "C (left accent)",    "Left: semantic colour", "None"],
              ["Match Banner",       "C (left accent)",    "Left: Lime (match)",    "None"],
              ["Section Header",     "D (top band)",       "Top: contextual",       "Court lines 5% on ink"],
              ["Profile Header",     "D (top band)",       "Top: Purple",           "Perforations 6%"],
              ["Leaderboard",        "D (top band)",       "Top: Ink",              "None"],
              ["Pending Match",      "E (open-sided)",     "None",                  "None"],
              ["Empty Player Slot",  "F (dashed)",         "None",                  "Perforations 8%"],
              ["Add Connection",     "F (dashed)",         "None",                  "None"],
              ["Empty State",        "A (2px, closed)",    "None",                  "Wire fence 5%"],
              ["Unavailable Court",  "A (2px, closed)",    "Left: Error",           "Wire fence 4%"],
              ["Score Entry",        "D (top band)",       "Top: Blue",             "None"],
              ["CTA Button",         "2px, lime fill",     "Arrow: Blue bg",        "None"],
              ["Pill/Chip selected", "2px, lime fill",     "None",                  "None"],
              ["Pill/Chip default",  "2px, border only",   "None",                  "None"],
              ["Bottom Nav",         "Ink bg, no border",  "Centre: Lime fill",     "None"],
              ["Net Divider",        "SVG component",      "N/A",                   "N/A"],
            ].map(([comp, container, accent, texture], i) => (
              <div key={comp} style={{ display: "flex", gap: 0, borderBottom: i < 23 ? `1px solid ${T.border}` : "none", background: T.white }}>
                <div style={{ width: 5, background: i % 3 === 0 ? T.lime : i % 3 === 1 ? T.blue : T.purple, flexShrink: 0 }} />
                <div style={{ width: "38%", padding: "8px 12px", borderRight: `1px solid ${T.border}`, ...ub, fontSize: 9, fontWeight: 700, color: T.ink, letterSpacing: "-0.02em" }}>{comp}</div>
                <div style={{ width: "30%", padding: "8px 10px", borderRight: `1px solid ${T.border}`, ...mono, fontSize: 8, color: T.grey, lineHeight: 1.5 }}>{container}</div>
                <div style={{ flex: 1, padding: "8px 10px" }}>
                  <div style={{ ...mono, fontSize: 8, color: T.grey, lineHeight: 1.4 }}>{accent}</div>
                  <div style={{ ...mono, fontSize: 8, color: T.border, lineHeight: 1.4, marginTop: 1 }}>{texture}</div>
                </div>
              </div>
            ))}
          </div>
        </div>)}

        {/* ════════════════════════════════════════════
            08 TOKENS
        ════════════════════════════════════════════ */}
        {active === "tokens" && (<div>
          <SectionLabel num="08" title="IMPLEMENTATION TOKENS" color={T.lime} />

          <div style={{ ...sans, fontSize: 12, color: T.grey, lineHeight: 1.65, marginBottom: 12 }}>
            Copy these directly into your project. CSS custom properties for web, JS object for React/Emergent.
          </div>

          <CodeBlock code={`:root {
  /* ── COLOURS ───────────────────────────── */
  --pm-lime:    #C9E52F;   /* Primary */
  --pm-blue:    #1A56FF;   /* Secondary */
  --pm-purple:  #6E28D9;   /* Tertiary */
  --pm-ink:     #111118;   /* Anchor */
  --pm-cream:   #F5F2E8;   /* App background */
  --pm-white:   #FFFFFF;   /* Card surface */
  --pm-error:   #FF4136;   /* Error ONLY */
  --pm-win:     #1A6B3A;   /* Win state */
  --pm-loss:    #B52A1C;   /* Loss state */
  --pm-grey:    #888888;   /* Secondary text */
  --pm-border:  #DDDAD0;   /* Subtle borders */

  /* ── TYPOGRAPHY ─────────────────────────── */
  --pm-font-display: 'Unbounded', 'Arial Black', sans-serif;
  --pm-font-body:    'DM Sans', sans-serif;
  --pm-font-mono:    'DM Mono', monospace;

  /* ── STROKE WEIGHTS ─────────────────────── */
  --pm-s1: 1px;   /* Internal subdivisions */
  --pm-s2: 2px;   /* Standard default */
  --pm-s3: 3px;   /* Primary structural */

  /* ── ACCENT STROKES ─────────────────────── */
  --pm-accent-top:  5px;   /* Category (what card IS) */
  --pm-accent-left: 4px;   /* Status (what IS HAPPENING) */

  /* ── SPACING (4px base unit) ────────────── */
  --pm-sp1: 4px;   --pm-sp2: 8px;
  --pm-sp3: 12px;  --pm-sp4: 16px;
  --pm-sp5: 20px;  --pm-sp6: 24px;
  --pm-sp8: 32px;  --pm-sp10: 40px;

  /* ── CONTAINER DETAILS ──────────────────── */
  --pm-corner-mark:  16px;  /* Size of corner L-shapes */
  --pm-inner-inset:  4px;   /* Glass panel inner offset */

  /* ── TEXTURE OPACITIES ──────────────────── */
  --pm-tx-subtle:   0.04;
  --pm-tx-standard: 0.06;
  --pm-tx-bold:     0.12;

  /* ── MIN TOUCH TARGET ───────────────────── */
  --pm-touch-min:   48px;
}`} />

          <CodeBlock code={`// JavaScript / React tokens
export const T = {
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

          <CodeBlock code={`/* ── CONTAINER CLASSES ─────────────────── */

/* Type A — Closed Primary */
.pm-card-a {
  border: var(--pm-s3) solid var(--pm-ink);
  background: var(--pm-white);
  overflow: hidden;
}
.pm-card-a .pm-accent-top {
  height: var(--pm-accent-top);
}

/* Type B — Corner Mark */
.pm-card-b {
  position: relative;
}
.pm-card-b::before, .pm-card-b::after,
.pm-card-b > .pm-corner-bl, .pm-card-b > .pm-corner-br {
  content: '';
  position: absolute;
  width: var(--pm-corner-mark);
  height: var(--pm-corner-mark);
  border-color: var(--pm-ink);
  border-style: solid;
  border-width: 0;
}
.pm-card-b::before  { top:0;    left:0;  border-top-width: var(--pm-s2); border-left-width:  var(--pm-s2); }
.pm-card-b::after   { top:0;    right:0; border-top-width: var(--pm-s2); border-right-width: var(--pm-s2); }

/* Type C — Left Accent */
.pm-card-c {
  display: flex;
  border: var(--pm-s2) solid var(--pm-ink);
  background: var(--pm-white);
  overflow: hidden;
}
.pm-card-c .pm-left-accent {
  width: var(--pm-accent-left);
  flex-shrink: 0;
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

          <CodeBlock code={`/* ── TEXTURE CLASSES ───────────────────── */

.pm-texture-perforations {
  background-image: radial-gradient(
    circle, rgba(17,17,24,0.06) 1.5px, transparent 1.5px
  );
  background-size: 14px 14px;
}
.pm-texture-perforations-lime {
  background-image: radial-gradient(
    circle, rgba(201,229,47,0.07) 1.5px, transparent 1.5px
  );
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
/* Glass inset — add to Type A primary cards */
.pm-glass-inset {
  position: relative;
}
.pm-glass-inset::after {
  content: '';
  position: absolute;
  inset: var(--pm-inner-inset);
  border: 1px solid var(--pm-ink);
  opacity: 0.07;
  pointer-events: none;
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
              ["Which texture for profile/rating?", "Perforations on ink background at 5–7%.", T.lime],
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
        </div>)}

      </div>
    </div>
  );
}
