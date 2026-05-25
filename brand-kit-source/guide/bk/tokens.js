// ═══════════════════════════════════════════════════════════════════
//  PADELMATCH BRAND KIT — DESIGN TOKENS
//  Single source of truth. Attached to window so every Babel script
//  can read them without a module system.
// ═══════════════════════════════════════════════════════════════════

window.T = /*EDITMODE-BEGIN*/{
  // COLOUR
  "lime":    "#C9E52F",  // Primary — action, CTA, active, rating, #1
  "blue":    "#1A56FF",  // Secondary — rank, section headers, later-slots
  "purple":  "#6E28D9",  // Tertiary — profile, info, connections, onboarding
  "ink":     "#111118",  // Anchor — all type, borders, nav bg, structural
  "cream":   "#F5F2E8",  // Background — warm app surface
  "white":   "#FFFFFF",  // Card surface — content areas only
  "error":   "#FF4136",  // Error ONLY
  "win":     "#1A6B3A",  // Win state
  "loss":    "#B52A1C",  // Loss state
  "grey":    "#888888",  // Secondary text
  "border":  "#DDDAD0",  // Subtle borders

  // STROKE WEIGHTS
  "s1": "1px", "s2": "2px", "s3": "3px",

  // ACCENT STROKES
  "accentTop":  "5px",
  "accentLeft": "4px",

  // SPACING (4px base unit)
  "sp1": "4px",  "sp2": "8px",  "sp3": "12px",  "sp4": "16px",
  "sp5": "20px", "sp6": "24px", "sp8": "32px", "sp10": "40px",

  // CONTAINER DETAILS
  "cornerMark": "16px",
  "innerInset": "4px",

  // TEXTURE OPACITIES
  "txSubtle":   0.04,
  "txStandard": 0.06,
  "txBold":     0.12
}/*EDITMODE-END*/;

window.F = {
  display: "'Unbounded', 'Arial Black', sans-serif",
  body:    "'DM Sans', sans-serif",
  mono:    "'DM Mono', monospace",
};

// Style shortcuts
window.ub   = { fontFamily: window.F.display };
window.sans = { fontFamily: window.F.body };
window.mono = { fontFamily: window.F.mono };
