// Self-Improvement Score — shared content for the four independent domains.
// Single source of truth for tier→band labels, the strokes gating rubric, and
// the tactics/inner/outer self-pick descriptors. Edit copy here only.

export type DomainKey = "strokes" | "tactics" | "inner" | "outer";

export const DOMAIN_META: { key: DomainKey; short: string; label: string; blurb: string }[] = [
  { key: "strokes", short: "STROKES", label: "STROKES & TECHNIQUE", blurb: "Shot execution — grounds, walls, volleys, bandeja, víbora, smashes" },
  { key: "tactics", short: "TACTICS", label: "STRATEGY & TACTICS", blurb: "Positioning, shot selection, point construction, reading the game" },
  { key: "inner", short: "INNER", label: "INNER STRENGTH", blurb: "Mental strength, partnership, sportsmanship" },
  { key: "outer", short: "OUTER", label: "OUTER STRENGTH", blurb: "Stamina, power, mobility" },
];

// Tier 1..6 → band label (index = tier).
export const TIER_BANDS = ["", "BEGINNER", "LATE BEGINNER", "LOWER INT.", "INTERMEDIATE", "HIGH INT.", "ADVANCED"];

// Strokes gating rubric — observable can-do statements per tier.
export const STROKES_RUBRIC: { tier: number; band: string; statements: string[] }[] = [
  { tier: 1, band: "BEGINNER", statements: [
    "I can serve underarm into the correct box more often than not.",
    "I can return a gentle serve back over the net.",
    "I can rally 3–4 balls from the back of the court.",
    "I can make contact with a ball off the back glass.",
    "I know which side (forehand/backhand) to take a ball on.",
  ] },
  { tier: 2, band: "LATE BEGINNER", statements: [
    "My forehand and backhand consistently clear the net and land in.",
    "I can serve into the box at a steady pace with control.",
    "I can hit a lob that clears net players past the service line.",
    "I can block a slow volley back with a stable racket face.",
    "I can hold basic position with my partner (both back / both up).",
  ] },
  { tier: 3, band: "LOWER INTERMEDIATE", statements: [
    "I can play a normal groundstroke off the back glass (salida de pared) back into court.",
    "I can direct my groundstrokes cross or down-the-line on purpose.",
    "I can hit a controlled reset lob under pressure.",
    "I can place my volleys, not just block them.",
    "I can put away or place a slow overhead.",
    "I recover to position after most shots.",
  ] },
  { tier: 4, band: "INTERMEDIATE", statements: [
    "I can hit a bandeja that lands past the service line and stays below shoulder height — a rally shot, not a panic swat.",
    "I can play back-wall recoveries consistently to both sides.",
    "I can mix slice and flat groundstrokes to change the rhythm.",
    "I can hold the net with controlled volleys and drops.",
    "I can hit a varied serve (flat/slice) and a drive-or-lob return at will.",
    "I read where the ball is going off the glass early.",
  ] },
  { tier: 5, band: "HIGH INTERMEDIATE", statements: [
    "I can hit a víbora that curves and stays low off the back glass.",
    "I can recover balls out of the corner off a double wall (back + side).",
    "I can hit a kick smash (por tres) that takes the ball out over the side wall.",
    "I construct points — move opponents, open the court, then finish.",
    "I can defend a strong smash and turn defence back to neutral or attack.",
    "My unforced errors are uncommon.",
  ] },
  { tier: 6, band: "ADVANCED", statements: [
    "I use the full overhead range (bandeja/víbora/rulo/flat/por cuatro) and pick the right one.",
    "I can attack the back-wall extremity (contrapared/bajada) when forced.",
    "I hold up technically under fast, high-pressure exchanges.",
    "I vary spin, pace and height deliberately to dismantle a structured defence.",
    "Opponents have to earn every point against me.",
  ] },
];

// Tactics / Inner / Outer — single self-pick descriptors (index 0 = tier 1).
export const DOMAIN_PICKS: Record<Exclude<DomainKey, "strokes">, string[]> = {
  tactics: [
    "I'm mostly just trying to return the ball; not thinking about position yet.",
    "I know the basics (get to the net, lob when pushed) but apply them inconsistently.",
    "I move with my partner and pick safe shots, though I lose the thread under pressure.",
    "I construct points with intent and usually pick the right shot.",
    "I read opponents, exploit weaknesses, and control the tempo of most points.",
    "I out-think strong opponents — anticipation and positioning are a weapon.",
  ],
  inner: [
    "I rattle easily and my head drops after mistakes.",
    "I keep going but my mood swings with the score.",
    "I stay mostly composed and support my partner on good days.",
    "I reset quickly after errors and communicate well with my partner.",
    "I'm a calm, steadying presence — I lift my partner and stay level in tight moments.",
    "I'm mentally relentless: unshakeable under pressure and a partner others want.",
  ],
  outer: [
    "I tire quickly and struggle to cover the court.",
    "I last a set but slow down noticeably after that.",
    "I have decent stamina and reach most balls at a comfortable pace.",
    "I'm fit enough to play hard for a full match and move well to the ball.",
    "I'm quick, explosive and still strong deep into long matches.",
    "Athletically I'm a step ahead — power, speed and endurance are an edge.",
  ],
};

// Derive the strokes tier from checked gating statements (key = "tier-index").
// Highest band where >= half its statements are met, requiring each lower band
// also met (monotonic ladder). Anything checked floors at tier 1.
export function deriveStrokesTier(checked: Record<string, boolean>): number {
  let tier = 0;
  for (const block of STROKES_RUBRIC) {
    const met = block.statements.filter((_, i) => checked[`${block.tier}-${i}`]).length;
    if (met >= Math.ceil(block.statements.length / 2)) tier = block.tier;
    else break;
  }
  if (tier === 0 && Object.values(checked).some(Boolean)) tier = 1;
  return tier;
}
