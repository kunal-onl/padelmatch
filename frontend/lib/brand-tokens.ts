// ═══════════════════════════════════════════════════════════════════
//  PADELMATCH BRAND KIT — DESIGN TOKENS (React Native)
//  Mirrors the CSS variables defined in the brand kit spec, adapted
//  for Expo React Native consumption (numeric values where RN needs
//  numbers, strings where it needs strings).
//  Co-exists with /lib/theme.ts which holds the existing app palette.
// ═══════════════════════════════════════════════════════════════════
import { F as FONTS } from "./theme";

export const T = {
  // COLOUR
  lime:   "#C9E52F",
  blue:   "#1A56FF",
  purple: "#6E28D9",
  ink:    "#111118",
  cream:  "#F5F2E8",
  white:  "#FFFFFF",
  error:  "#FF4136",
  win:    "#1A6B3A",
  loss:   "#B52A1C",
  grey:   "#888888",
  border: "#DDDAD0",

  // STROKE WEIGHTS (numbers — RN borderWidth wants Number)
  s1: 1,
  s2: 2,
  s3: 3,

  // ACCENT STROKES
  accentTop: 5,
  accentLeft: 4,

  // SPACING (4px base) — numbers for RN
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

// Font families — RN with expo-font loads each weight as its own family.
// `display` always maps to Unbounded_900Black; if you need a lighter
// display weight use F.displayHeavy / F.displayBold explicitly.
export const F = {
  display: FONTS.ub900,        // 'Unbounded_900Black'
  displayBold: FONTS.ub700,    // 'Unbounded_700Bold'
  displayRegular: FONTS.ub400, // 'Unbounded_400Regular'
  body: FONTS.sans,            // 'DMSans_400Regular'
  bodyMedium: FONTS.sansM,     // 'DMSans_500Medium'
  mono: FONTS.mono,            // 'DMMono_400Regular'
  monoMedium: FONTS.monoM,     // 'DMMono_500Medium'
} as const;

// Style shortcuts (use as `style={[ub, { fontSize: 20 }]}`)
export const ub = { fontFamily: F.display };
export const ubBold = { fontFamily: F.displayBold };
export const sans = { fontFamily: F.body };
export const mono = { fontFamily: F.mono };
