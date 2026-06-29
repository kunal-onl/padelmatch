// Court-comfort map helpers. Reads the canonical shot-taxonomy.json (position-
// keyed shot vocabulary) and computes the per-cell overview math. The taxonomy
// is incomplete by design — everything here renders only what's present and
// tolerates stubbed/missing cells.
import taxonomy from "./shot-taxonomy.json";
import { C } from "./theme";

const TAX: any = taxonomy;

export type Side = "right" | "left";

// 0..6 behavioral anchors (from taxonomy comfort_scale). 0 = awareness gap.
export const COMFORT_LABELS: string[] = [
  "Never heard of it",   // 0
  "Very uncomfortable",  // 1
  "Uncomfortable",       // 2
  "Play it when forced", // 3
  "Comfortable",         // 4
  "Look for it",         // 5
  "Excellent at it",     // 6
];

export const SIDES: Side[] = (TAX.sides as Side[]) || ["right", "left"];
export const BANDS: string[] = TAX.vertical_bands?.order_net_to_baseline || [];
export const COLS: string[] = TAX.horizontal_bands?.order_side_to_center || [];
export const BAND_LABEL: Record<string, string> = {
  net: "NET", "attack-control": "ATTACK", "recovery-transition": "TRANSITION", defense: "DEFENSE",
};
export const COL_LABEL: Record<string, string> = { side: "SIDE", middle: "MIDDLE", T: "T" };

const SHOTS_BY_ID: Record<string, any> = Object.fromEntries((TAX.shots || []).map((s: any) => [s.id, s]));
export function shotName(id: string): string { return SHOTS_BY_ID[id]?.name || id; }

export type Cell = {
  side: Side; band: string; col: string;
  key: string;        // "side/band-col" — matches the backend comfort key
  cellId: string;     // "band-col" — taxonomy cell id
  status: string; shotIds: string[]; present: boolean;
};

// Every band×col for a side, in net→baseline / side→T order. Cells absent from
// the taxonomy are returned with present=false (rendered as not-yet-mapped).
export function cellsForSide(side: Side): Cell[] {
  const raw = TAX.cells?.[side] || {};
  const out: Cell[] = [];
  for (const band of BANDS) {
    for (const col of COLS) {
      const cellId = `${band}-${col}`;
      const c = raw[cellId];
      const shotIds: string[] = c && Array.isArray(c.shot_ids) ? c.shot_ids : [];
      out.push({
        side, band, col, key: `${side}/${cellId}`, cellId,
        status: c?.status || "MISSING", shotIds, present: !!c,
      });
    }
  }
  return out;
}

export function comfortKey(cellKey: string, shotId: string): string {
  return `${cellKey}|${shotId}`;
}

export type CellAgg = { avg: number | null; knownCount: number; undiscovered: number; ratedCount: number; total: number };

// A cell's overview reading. Average is over KNOWN shots (comfort 1..6); 0s
// ("never heard of it") are excluded from the average and counted separately as
// "undiscovered" (an awareness gap, categorically different from a competence gap).
export function cellAgg(cell: Cell, ratings: Record<string, number>): CellAgg {
  let sum = 0, known = 0, undiscovered = 0, rated = 0;
  for (const sid of cell.shotIds) {
    const v = ratings[comfortKey(cell.key, sid)];
    if (v === undefined) continue;
    rated++;
    if (v === 0) { undiscovered++; continue; }
    sum += v; known++;
  }
  return { avg: known > 0 ? sum / known : null, knownCount: known, undiscovered, ratedCount: rated, total: cell.shotIds.length };
}

// Neutral → lime gradient (low → high comfort). A gap is an opportunity, NOT an
// error: coral is never used here. Unrated/known-empty cells read neutral.
export function comfortColor(avg: number | null): string {
  if (avg === null) return "#EEEDE6";        // neutral (invitation)
  if (avg < 2) return "#EAEBD6";
  if (avg < 3) return "#E2EBBE";
  if (avg < 4) return "#D8E99A";
  if (avg < 5) return "#CDE76E";
  return C.lime;                              // strong
}

// v1 has no curated library yet → the interlock always degrades gracefully.
export function videoForShot(_shotId: string): string | null {
  return null;
}

export const LEFT_NOT_STARTED = !(TAX.cells?.left && Object.keys(TAX.cells.left).some((k) => !k.startsWith("_")));
