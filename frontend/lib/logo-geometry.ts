// ═══════════════════════════════════════════════════════════════════
//  PADELMATCH BRAND KIT — LOGO GEOMETRY
//  Source-of-truth mark geometry for rendering without an SVG file.
// ═══════════════════════════════════════════════════════════════════

export type Cell = { x: number; y: number; w: number; h: number };
export type LetterKey = "P" | "M";

export const LOGO_GEOMETRY = {
  aspectRatio: 2.5,
  viewBox: "0 0 100 36",

  cells: {
    TL: { x: 4, y: 4, w: 14, h: 14 },
    TR: { x: 22, y: 4, w: 14, h: 14 },
    BL: { x: 4, y: 22, w: 14, h: 14 },
    BR: { x: 22, y: 22, w: 14, h: 14 },
  } as Record<"TL" | "TR" | "BL" | "BR", Cell>,

  courtPath: "M 4,4 H 36 V 36 H 4 Z M 8,8 H 32 V 32 H 8 Z M 18,8 V 32 M 8,18 H 32",

  net: { x: 17, y: 10, w: 2, h: 16 } as Cell,

  letterRects: {
    P: [
      { x: 44, y: 4, w: 3, h: 14 },
      { x: 47, y: 4, w: 8, h: 3 },
      { x: 47, y: 10, w: 8, h: 3 },
    ],
    M: [
      { x: 60, y: 6, w: 3, h: 12 },
      { x: 66, y: 6, w: 3, h: 12 },
      { x: 63, y: 9, w: 3, h: 3 },
    ],
  } as Record<LetterKey, Cell[]>,
};
