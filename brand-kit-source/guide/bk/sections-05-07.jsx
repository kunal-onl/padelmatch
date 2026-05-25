// ═══════════════════════════════════════════════════════════════════
//  SECTIONS 05-08: Containers, Textures, Components, Tokens
// ═══════════════════════════════════════════════════════════════════

// Small badge used in place of emojis in notification examples
const NotifBadge = ({ color, label }) => (
  <span style={{
    display: "inline-block", width: 18, height: 18, marginRight: 8,
    background: color, color: color === T.lime ? T.ink : T.white,
    ...mono, fontSize: 8, fontWeight: 700, letterSpacing: 0,
    textAlign: "center", lineHeight: "18px", flexShrink: 0,
  }}>{label}</span>
);

// ── 05 CONTAINERS ──────────────────────────────────────────────────
const Section05 = () => (
  <div>
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
              <div style={{ ...mono, fontSize: 11, color: T.grey, marginTop: 3 }}>THU 22 MAY · 19:00\u201321:00</div>
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
            <ContainerC accentColor={T.lime}>
              <div style={{ padding: "9px 12px", ...sans, fontSize: 12, color: T.ink, display: "flex", alignItems: "center" }}>
                <NotifBadge color={T.lime} label="!" />
                A game at Jolt Method just opened — Abhizer is in it
              </div>
            </ContainerC>
            <ContainerC accentColor={T.blue}>
              <div style={{ padding: "9px 12px", ...sans, fontSize: 12, color: T.ink, display: "flex", alignItems: "center" }}>
                <NotifBadge color={T.blue} label="#3" />
                You've moved up to #3 in North Goa Padel
              </div>
            </ContainerC>
            <ContainerC accentColor={T.purple}>
              <div style={{ padding: "9px 12px", ...sans, fontSize: 12, color: T.ink, display: "flex", alignItems: "center" }}>
                <NotifBadge color={T.purple} label="PS" />
                Priya S. wants to connect
              </div>
            </ContainerC>
            <ContainerC accentColor={T.error}>
              <div style={{ padding: "9px 12px", ...sans, fontSize: 12, color: T.ink, display: "flex", alignItems: "center" }}>
                <NotifBadge color={T.error} label="X" />
                Sunday Club Court 2 — unavailable
              </div>
            </ContainerC>
          </div>
        ),
      },
      {
        type: "D", name: "TOP ACCENT (HEADER BAND)",
        stroke: "2px full border, coloured header band at top",
        source: "Court category / zone markings — the horizontal net defines categories of space",
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
        stroke: "2px dashed #DDDAD0 — hover/focus: 2px dashed ink",
        source: "Empty player slot markers — the court is ready but unfilled",
        use: "Empty player slot, add-connection prompt, unfilled form area, file upload zone, awaiting input",
        rule: "Dashed border = expected input. On hover / focus: border colour transitions from border (#DDDAD0) to ink (#111118). Never use for completed / filled states.",
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
  </div>
);

// ── 06 TEXTURES ────────────────────────────────────────────────────
const Section06 = () => (
  <div>
    <SectionLabel num="06" title="PADEL-DERIVED TEXTURES" color={T.purple} />

    <div style={{ ...sans, fontSize: 12, color: T.grey, lineHeight: 1.65, marginBottom: 16 }}>
      Five textures drawn directly from the physical padel court. Applied at 4\u20138% opacity as background textures. Never compete with content. Applied at 15\u201325% as intentional decorative accents in specific moments (rating reveal, empty states). The NetDivider is a component, not a CSS texture.
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
        source: "Top-down view of padel court: 2\u00d71 rectangle divided into service quadrants",
        css: `/* 30px vertical \u00d7 60px horizontal grid */\nbackground-image:\n  repeating-linear-gradient(0deg, transparent 29px, #C9E52F 30px),\n  repeating-linear-gradient(90deg, transparent 59px, #C9E52F 60px);\nopacity: 0.05;`,
        use: "Hero header on home dashboard. Leaderboard header band. Full-screen onboarding backgrounds on ink.",
        demo: <div style={{ height: 56, background: T.ink, ...TX.courtLines(0.06, "#C9E52F"), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ ...mono, fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: "0.15em" }}>COURT LINES AT 6% ON INK</div>
        </div>,
      },
      {
        name: "GLASS PANELS",
        source: "3\u00d72 grid of glass wall panels, each ~2\u00d71m, visible aluminium framing",
        css: `/* 44px \u00d7 88px panel grid */\nbackground-image:\n  repeating-linear-gradient(0deg, transparent 43px, #111118 44px),\n  repeating-linear-gradient(90deg, transparent 87px, #111118 88px);\nopacity: 0.05;\n\n/* Also: inner inset border */\n.glass-inset::after {\n  content: '';\n  position: absolute;\n  inset: 4px;\n  border: 1px solid #111118;\n  opacity: 0.07;\n  pointer-events: none;\n}`,
        use: "Section break backgrounds. Login / splash screen. Inner inset border on Type A cards for glass-panel depth.",
        demo: <div style={{ height: 56, background: T.cream, ...TX.glassPanels(0.07), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ ...mono, fontSize: 9, color: T.grey, letterSpacing: "0.15em" }}>GLASS PANELS AT 7% ON CREAM</div>
        </div>,
      },
      {
        name: "WIRE FENCE",
        source: "Diamond / chainlink fencing above glass panels and at court ends",
        css: `/* 10px diamond mesh */\nbackground-image:\n  repeating-linear-gradient(45deg, #111118 0, #111118 1px, transparent 0, transparent 50%),\n  repeating-linear-gradient(-45deg, #111118 0, #111118 1px, transparent 0, transparent 50%);\nbackground-size: 10px 10px;\nopacity: 0.06;`,
        use: "Empty states ('no games available'). Unavailable court backgrounds. Off-limits / blocked sections. Never on active, positive states.",
        demo: <div style={{ height: 56, background: T.cream, ...TX.wireFence(0.06), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ ...ub, fontSize: 10, fontWeight: 700, color: T.ink, letterSpacing: "-0.02em" }}>NO GAMES RIGHT NOW</div>
        </div>,
      },
      {
        name: "NET DIVIDER",
        source: "The padel net: 88cm tall, horizontal top / bottom cables, tight vertical mesh",
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
  </div>
);

// ── 07 COMPONENTS MAP ──────────────────────────────────────────────
const Section07 = () => (
  <div>
    <SectionLabel num="07" title="COMPONENT MAP" color={T.blue} />

    <div style={{ border: `${T.s2} solid ${T.ink}` }}>
      <div style={{ background: T.ink, padding: "6px 14px", borderBottom: `${T.s2} solid ${T.ink}` }}>
        <span style={{ ...ub, fontSize: 8, fontWeight: 700, color: T.lime, letterSpacing: "0.1em" }}>COMPONENT → CONTAINER → ACCENT → TEXTURE</span>
      </div>
      {[
        ["Game Card",          "A (3px, closed)",    "Top: Blue (category)",  "None"],
        ["Player Card",        "A (3px, closed)",    "Top: Purple (profile)", "Perforations 5% on stat area"],
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
        ["Pill / Chip selected","2px, lime fill",     "None",                  "None"],
        ["Pill / Chip default","2px, border only",   "None",                  "None"],
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
  </div>
);

Object.assign(window, { Section05, Section06, Section07 });
