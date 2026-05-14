// 36-shot library for the Shot Comfort onboarding step.
export type Shot = {
  slug: string;
  name: string;
  spanish: string | null;
  category: "serves" | "volleys" | "overheads" | "groundstrokes" | "defensive";
  description: string;
  tier: 1 | 2 | 3;
};

export const SHOTS: Shot[] = [
  // SERVES & RETURNS
  { slug: "flat_serve", name: "Flat Serve", spanish: null, category: "serves",
    description: "A standard serve hit with a neutral racket face for maximum accuracy. The ball travels straight and fast with minimal spin.", tier: 1 },
  { slug: "slice_serve", name: "Slice Serve", spanish: null, category: "serves",
    description: "A serve struck with backspin that stays low after the bounce and slides toward the side wall. Effective for pushing the receiver wide.", tier: 2 },
  { slug: "topspin_serve", name: "Topspin Serve", spanish: null, category: "serves",
    description: "A serve with heavy forward spin that bounces high and kicks aggressively toward the back glass. Forces the receiver deep.", tier: 2 },
  { slug: "short_serve", name: "Short Serve", spanish: null, category: "serves",
    description: "A soft serve directed close to the net or short service line to force the receiver forward. Disrupts rhythm.", tier: 1 },
  { slug: "deep_serve", name: "Deep Serve", spanish: null, category: "serves",
    description: "A deeply struck serve targeting the rear corners to trap the receiver behind the service line. Limits return options.", tier: 1 },
  { slug: "t_serve", name: "T-Serve", spanish: null, category: "serves",
    description: "A serve aimed precisely down the centre line to limit the receiver's return angles. The most accurate serve in the game.", tier: 2 },
  { slug: "wide_serve", name: "Wide Serve", spanish: null, category: "serves",
    description: "A serve angled outward to force the receiver wide toward the side glass. Creates open court for the serving team.", tier: 1 },
  { slug: "drive_return", name: "Drive Return", spanish: null, category: "serves",
    description: "An aggressive, flat or topspin baseline return aimed directly at the incoming net players. Takes time away from the serving team.", tier: 2 },
  { slug: "lob_return", name: "Lob Return", spanish: null, category: "serves",
    description: "A high, defensive return lifted over the net players to reclaim the net position. The most reliable return against a strong serve.", tier: 1 },

  // VOLLEYS
  { slug: "forehand_volley", name: "Forehand Volley", spanish: null, category: "volleys",
    description: "A classic attacking net shot hit from the dominant side with controlled backspin. The bread-and-butter of net play.", tier: 1 },
  { slug: "backhand_volley", name: "Backhand Volley", spanish: null, category: "volleys",
    description: "A net shot from the non-dominant side requiring strong wrist stabilisation. Accuracy over power.", tier: 1 },
  { slug: "chiquita", name: "Chiquita", spanish: "Chiquita", category: "volleys",
    description: "A soft, dipping volley hit low at the feet of oncoming opponents to force them into a difficult low ball. A touch shot requiring precise timing.", tier: 3 },
  { slug: "drop_volley", name: "Drop Volley", spanish: "Amortiguación", category: "volleys",
    description: "A dead-handed volley placed just over the net with heavy backspin, dying before reaching the wall. Ends points at net.", tier: 2 },
  { slug: "deep_volley", name: "Deep Volley", spanish: null, category: "volleys",
    description: "A firmly driven volley targeting the opponent's back feet or rear corners. Used to push opponents away from the net.", tier: 1 },
  { slug: "block_volley", name: "Block Volley", spanish: null, category: "volleys",
    description: "A stationary, rigid racket position used to absorb high-speed incoming shots. Essential when under pressure at net.", tier: 1 },
  { slug: "blocking_drop_volley", name: "Blocking Drop Volley", spanish: null, category: "volleys",
    description: "A soft block that kills all ball momentum right behind the net. Combines blocking and drop shot technique.", tier: 3 },

  // OVERHEADS
  { slug: "bandeja", name: "Bandeja", spanish: "Bandeja", category: "overheads",
    description: "A defensive-aggressive tactical overhead hit with slice from deep positions to retain the net. The most important overhead in padel.", tier: 2 },
  { slug: "vibora", name: "Víbora", spanish: "Víbora", category: "overheads",
    description: "An aggressive, heavily sidespinned overhead struck at eye level that curves sharply and stays low off the back glass. A signature padel weapon.", tier: 3 },
  { slug: "kick_smash", name: "Kick Smash", spanish: "Por Tres", category: "overheads",
    description: "A heavy topspin overhead that bounces over the 3-metre side wall, forcing opponents to retrieve from outside the court.", tier: 3 },
  { slug: "flat_smash", name: "Flat Smash", spanish: "Por Cuatro", category: "overheads",
    description: "A maximum-power smash hit forward so hard it bounces over the 4-metre back wall. The most attacking overhead in the game.", tier: 3 },
  { slug: "rulo", name: "Rulo", spanish: "Rulo", category: "overheads",
    description: "A soft, dipping topspin overhead hit cross-court into the side grid. Uses spin rather than power to create an unplayable angle.", tier: 3 },
  { slug: "fake_smash", name: "Fake Smash", spanish: null, category: "overheads",
    description: "A disguised overhead motion that deceives opponents expecting power but drops short into a delicate touch shot. A pure deception play.", tier: 3 },
  { slug: "backhand_overhead", name: "Backhand Overhead", spanish: "Gancho", category: "overheads",
    description: "A hooked backhand smash used when caught out of position on the backhand side overhead. Requires exceptional timing and shoulder rotation.", tier: 3 },

  // GROUNDSTROKES
  { slug: "flat_forehand", name: "Flat Forehand", spanish: null, category: "groundstrokes",
    description: "A neutral, direct shot hit from the back of the court without spin. The foundation of baseline play.", tier: 1 },
  { slug: "sliced_forehand", name: "Sliced Forehand", spanish: null, category: "groundstrokes",
    description: "A baseline shot cut with backspin to keep the bounce exceptionally low off the glass. Disrupts attacking opponents.", tier: 2 },
  { slug: "topspin_forehand", name: "Topspin Forehand", spanish: null, category: "groundstrokes",
    description: "An accelerated upward strike creating forward rotation to dip the ball early and kick off the back wall. Forces opponents deep.", tier: 2 },
  { slug: "flat_backhand", name: "Flat Backhand", spanish: null, category: "groundstrokes",
    description: "A standard neutral baseline drive from the non-dominant side. Control and placement over power.", tier: 1 },
  { slug: "sliced_backhand", name: "Sliced Backhand", spanish: null, category: "groundstrokes",
    description: "A defensive or directional baseline cut shot keeping the ball low over the net. Reliable under pressure.", tier: 1 },
  { slug: "topspin_backhand", name: "Topspin Backhand", spanish: null, category: "groundstrokes",
    description: "A baseline lift shot with forward rotation to push opponents back and generate pace off the wall.", tier: 2 },
  { slug: "passing_shot", name: "Passing Shot", spanish: null, category: "groundstrokes",
    description: "A low, fast baseline drive hit past net players into open space. The primary weapon against aggressive net players.", tier: 2 },

  // DEFENSIVE & WALL
  { slug: "lob", name: "Lob", spanish: "Globo", category: "defensive",
    description: "A high, deep defensive shot designed to clear net players and force them back to the baseline. The most fundamental defensive shot.", tier: 1 },
  { slug: "bajada", name: "Bajada", spanish: "Bajada / Cuchilla", category: "defensive",
    description: "An aggressive smash hit directly off a high bounce from the back wall. Transforms a defensive situation into an attacking one.", tier: 3 },
  { slug: "salida_de_pared", name: "Wall Exit", spanish: "Salida de Pared", category: "defensive",
    description: "A normal groundstroke played after the ball rebounds off the rear glass. The most common shot in padel — mastering this is essential.", tier: 1 },
  { slug: "contrapared", name: "Contrapared", spanish: "Contrapared", category: "defensive",
    description: "An emergency shot hit directly into your own back glass so the ball flies over the net. A last-resort play requiring precise angle judgement.", tier: 3 },
  { slug: "lateral_wall_exit", name: "Lateral Wall Exit", spanish: null, category: "defensive",
    description: "A shot played after the ball strikes both the back wall and side wall. Requires reading the double-wall rebound angle.", tier: 2 },
  { slug: "dormilona", name: "Dormilona", spanish: "Dormilona", category: "defensive",
    description: "A delicate touch shot placed right at the net after an opponent's smash rebounds off the back wall. Pure touch and anticipation.", tier: 3 },
];

export const CATEGORIES: Array<{ key: Shot["category"]; label: string }> = [
  { key: "serves", label: "SERVES" },
  { key: "volleys", label: "VOLLEYS" },
  { key: "overheads", label: "OVERHEADS" },
  { key: "groundstrokes", label: "GROUNDS" },
  { key: "defensive", label: "WALLS" },
];

export const COMFORT_LABELS = ["NEVER", "KNOW IT", "SOMETIMES", "COMFY", "CONFIDENT"];
