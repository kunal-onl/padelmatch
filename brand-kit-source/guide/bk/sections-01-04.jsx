// ═══════════════════════════════════════════════════════════════════
//  SECTIONS 01-04: Overview, Colour, Typography, Strokes
// ═══════════════════════════════════════════════════════════════════

// ── 01 OVERVIEW ────────────────────────────────────────────────────
const Section01 = () => (
  <div>
    <SectionLabel num="01" title="OVERVIEW & DESIGN PHILOSOPHY" />

    <ContainerD label="PRODUCT" accentColor={T.purple} style={{ marginBottom: 12 }}>
      <div style={{ padding: "12px 14px" }}>
        {[
          ["Name", "PadelMatch"],
          ["Domain", "padelmatch.in"],
          ["Type", "Mobile-first PWA — primary breakpoint 390px (iPhone 14)"],
          ["Community", "North Goa Padel — ~100\u2013200 players, 7 courts"],
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
        ["✗ DON'T", "Beach / Goa clichés — no palm trees, sunset gradients", T.error],
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
  </div>
);

// ── 02 COLOUR ──────────────────────────────────────────────────────
const Section02 = () => (
  <div>
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
        [T.purple, "PURPLE #6E28D9", "Player profile header · connection / relationship banners · onboarding section headers · info / context states · tertiary emphasis", "NEVER for availability states or match outcomes"],
        [T.error,  "CORAL #FF4136",  "Unavailable courts · form validation errors · loss state badge · offline / inactive player · system errors", "NEVER decoratively. If in doubt, do not use."],
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
  </div>
);

// ── 03 TYPOGRAPHY ──────────────────────────────────────────────────
const Section03 = () => (
  <div>
    <SectionLabel num="03" title="TYPOGRAPHY" color={T.purple} />

    <CodeBlock label="GOOGLE FONTS IMPORT" code={`@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');`} />

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
          <div style={{ ...mono, fontSize: 22, color: T.ink, letterSpacing: "0.05em" }}>6\u20132  4\u20136  7\u20135</div>
          <div style={{ ...mono, fontSize: 12, color: T.grey, marginTop: 4, letterSpacing: "0.12em", textTransform: "uppercase" }}>Thu 22 May · 19:00\u201321:00</div>
          <div style={{ ...mono, fontSize: 10, color: T.lime, marginTop: 4, letterSpacing: "0.15em", textTransform: "uppercase" }}>Section Label</div>
        </div>,
        bg: T.white,
      },
    ].map((typeface) => (
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
  </div>
);

// ── 04 STROKE WEIGHTS ──────────────────────────────────────────────
const Section04 = () => (
  <div>
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
        never: "Row separators within a card (use 1px) or anything intended to be subtle / internal",
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
  </div>
);

Object.assign(window, { Section01, Section02, Section03, Section04 });
