// ═══════════════════════════════════════════════════════════════════
//  PADELMATCH LOGO GEOMETRY — source of truth
//  Synced verbatim from the canonical brand kit:
//    /app/brand-kit-source/guide/padelmatch-brand-kit/logo-geometry.js
//
//  NOTE: We deliberately ship the real PNG/SVG asset files (see
//  /assets/brand/) for in-app rendering. This geometry is exposed only
//  for tooling / introspection so consumers can read the cell layout
//  without parsing an SVG.
// ═══════════════════════════════════════════════════════════════════

export type Cell = { x: number; y: number; w: number; h: number };
export type CellKey = "L" | "TL" | "BL" | "TR" | "BR" | "R";
export type LetterKey = "P" | "M";

export const LOGO_GEOMETRY = {
  viewBox: "5 30 90 36",
  aspectRatio: 2.5, // width / height

  // Six interior cells.
  // L/R are the outer strips (used only by the M-letter variant).
  // TL/TR/BL/BR are the four squares; by default TL=blue, BR=lime.
  cells: {
    L:  { x: 7,  y: 32, w: 3,  h: 32 },
    TL: { x: 23, y: 35, w: 23, h: 13 },
    BL: { x: 23, y: 49, w: 23, h: 12.5 },
    TR: { x: 54, y: 35, w: 23, h: 13 },
    BR: { x: 54, y: 49, w: 23, h: 12.5 },
    R:  { x: 90, y: 32, w: 3,  h: 32 },
  } as Record<CellKey, Cell>,

  // The two cages + outer walls as a single evenodd path.
  // Canonical SVG file uses a more precise path; this approximation is
  // here for parity with the brand kit source.
  courtPath:
    "M 11 32 L 45 32 A 2 2 0 0 1 47 34 L 47 62 A 2 2 0 0 1 45 64 L 11 64 " +
    "A 4 4 0 0 1 7 60 L 7 36 A 4 4 0 0 1 11 32 Z " +
    "M 10 35 L 10 61 L 20 61 L 20 49.5 L 46 49.5 L 46 46 L 20 46 L 20 35 Z " +
    "M 55 32 L 89 32 A 4 4 0 0 1 93 36 L 93 60 A 4 4 0 0 1 89 64 L 55 64 " +
    "A 2 2 0 0 1 53 62 L 53 34 A 2 2 0 0 1 55 32 Z " +
    "M 90 35 L 80 35 L 80 46 L 54 46 L 54 49.5 L 80 49.5 L 80 61 L 90 61 Z",

  // Net — always rendered in the ink/white stroke colour, never tinted.
  net: { x: 47.5, y: 35, w: 5, h: 26 } as Cell,

  // Monogram overlays — sit exactly on existing court walls.
  letterRects: {
    P: [
      { x: 20, y: 32,   w: 3,  h: 32 }, // spine
      { x: 20, y: 32,   w: 26, h: 3  }, // top bowl
      { x: 20, y: 46.5, w: 26, h: 3  }, // bottom of bowl
      { x: 46, y: 35,   w: 3,  h: 14 }, // right of bowl
    ],
    M: [
      { x: 7,  y: 32, w: 3,  h: 32 }, // left leg
      { x: 91, y: 32, w: 3,  h: 32 }, // right leg
      { x: 7,  y: 32, w: 87, h: 3  }, // top connector
      { x: 46, y: 35, w: 9,  h: 13 }, // top of central stem
    ],
  } as Record<LetterKey, Cell[]>,

  // Default cell fills.
  defaultCells: { TL: "#1A56FF", BR: "#C9E52F" } as Partial<Record<CellKey, string>>,
};
