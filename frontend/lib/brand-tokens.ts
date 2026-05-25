// ═══════════════════════════════════════════════════════════════════
//  PADELMATCH BRAND KIT — DESIGN TOKENS (React Native)
//  Synced from the canonical brand kit:
//    /app/brand-kit-source/guide/padelmatch-brand-kit/tokens.js
//    /app/brand-kit-source/assets/padelmatch-tokens.json
//  Numeric values for RN border/spacing/font where the web kit uses
//  pixel strings.
// ═══════════════════════════════════════════════════════════════════
import { F as FONTS } from "./theme";

export const T = {
  // COLOUR (canonical)
  lime:   "#C9E52F",
  blue:   "#1A56FF",
  purple: "#6E28D9",
  ink:    "#111118",
  cream:  "#F5F2E8",
  white:  "#FFFFFF",
  error:  "#FF4136",
  // Extended (not in canonical tokens.json but in tokens.js — used app-wide)
  win:    "#1A6B3A",
  loss:   "#B52A1C",
  grey:   "#888888",
  border: "#DDDAD0",

  // STROKE WEIGHTS (canonical strings → RN numbers)
  s1: 1,
  s2: 2,
  s3: 3,

  // ACCENT STROKES
  accentTop: 5,
  accentLeft: 4,

  // SPACING (4px base)
  sp1: 4,  sp2: 8,  sp3: 12, sp4: 16,
  sp5: 20, sp6: 24, sp8: 32, sp10: 40,

  // CONTAINER DETAILS
  cornerMark: 16,
  innerInset: 4,

  // TEXTURE OPACITIES (0-1)
  txSubtle: 0.04,
  txStandard: 0.06,
  txBold: 0.12,
} as const;

// Font families — canonical kit uses CSS family strings (e.g. "'Unbounded',…").
// In RN with expo-font each weight is loaded as a distinct family — map onto
// the constants we already load in app/_layout.tsx.
export const F = {
  display: FONTS.ub900,         // Unbounded Black (display)
  displayBold: FONTS.ub700,     // Unbounded Bold
  displayRegular: FONTS.ub400,  // Unbounded Regular
  body: FONTS.sans,             // DM Sans
  bodyMedium: FONTS.sansM,
  mono: FONTS.mono,             // DM Mono
  monoMedium: FONTS.monoM,
} as const;

// Style shortcuts mirroring the canonical kit
export const ub = { fontFamily: F.display };
export const ubBold = { fontFamily: F.displayBold };
export const sans = { fontFamily: F.body };
export const mono = { fontFamily: F.mono };
