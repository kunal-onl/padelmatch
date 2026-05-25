// ═══════════════════════════════════════════════════════════════════
//  PADELMATCH BRAND KIT — DESIGN TOKENS (JS)
//  For React / JSX use. Same values as tokens.css.
// ═══════════════════════════════════════════════════════════════════

export const T = {
  // COLOUR
  lime:    '#C9E52F',
  blue:    '#1A56FF',
  purple:  '#6E28D9',
  ink:     '#111118',
  cream:   '#F5F2E8',
  white:   '#FFFFFF',
  error:   '#FF4136',
  win:     '#1A6B3A',
  loss:    '#B52A1C',
  grey:    '#888888',
  border:  '#DDDAD0',

  // STROKE WEIGHTS
  s1: '1px',
  s2: '2px',
  s3: '3px',

  // ACCENT STROKES
  accentTop:  '5px',
  accentLeft: '4px',

  // SPACING (4px base)
  sp1: '4px',  sp2: '8px',  sp3: '12px', sp4: '16px',
  sp5: '20px', sp6: '24px', sp8: '32px', sp10: '40px',

  // CONTAINER DETAILS
  cornerMark: '16px',
  innerInset: '4px',

  // TEXTURE OPACITIES
  txSubtle:   0.04,
  txStandard: 0.06,
  txBold:     0.12,
};

export const F = {
  display: "'Unbounded', 'Arial Black', sans-serif",
  body:    "'DM Sans', sans-serif",
  mono:    "'DM Mono', monospace",
};

// Style shortcuts
export const ub   = { fontFamily: F.display };
export const sans = { fontFamily: F.body };
export const mono = { fontFamily: F.mono };
