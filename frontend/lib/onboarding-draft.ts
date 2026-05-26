// Onboarding draft store — persisted to AsyncStorage after every step.
//
// V2 (Feb 2026) added the following fields:
//   rankedDays              — Up to 7 day-of-week strings in preference order
//   preferredStartTime/End  — Single preferred window (HH:MM, 24h)
//   rankedTimeBlocks        — Drag-ranked day-of-week labels for Step 6
//   gameTypes               — Multi-select: ["competitive","social"]
//   connections             — relationship is always "played_with";
//                             reasons live on `tags: string[]`
//   whatsappVerified        — Set true after OTP step
//
// Legacy fields (availabilitySlots, gamesPerWeek, gameOrientation, shotComfort)
// remain so previous flows still function — they're derived/back-filled at
// submit time from the new fields.

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "pm.onboarding.draft.v2";

export type ConnectionDraft = {
  playerId: string;
  relationship: "played_with";
  tags: string[];           // e.g. ["social","competitive"]
  reason: string | null;    // legacy single-reason (back-fill)
  addedAt: string;
};

export type Draft = {
  // Step 1
  name: string;
  phone: string;
  // Step 2
  yearsPlayed: string;
  frequency: string;
  competitiveExperience: string;
  wallControl: string;
  // Step 3
  preferredVenues: string[];
  // Step 4
  rankedDays: string[];          // ordered subset of monday..sunday
  // Step 5
  preferredStartTime: string;    // "HH:MM" 24h
  preferredEndTime: string;      // "HH:MM" 24h
  // Step 6
  rankedTimeBlocks: string[];    // ordered day-of-week list (uses preferred window)
  // Step 7
  gameTypes: string[];           // subset of ["competitive","social"]
  // Step 8
  connections: ConnectionDraft[];
  // Optional / profile-only (rate-your-shots was moved out of onboarding)
  shotComfort: Record<string, number>;
  // Step 9
  whatsappVerified: boolean;
  // legacy display
  profilePhoto: string | null;
  bio: string;
};

const DEFAULT: Draft = {
  name: "",
  phone: "",
  yearsPlayed: "",
  frequency: "",
  competitiveExperience: "",
  wallControl: "",
  preferredVenues: [],
  rankedDays: [],
  preferredStartTime: "",
  preferredEndTime: "",
  rankedTimeBlocks: [],
  gameTypes: [],
  connections: [],
  shotComfort: {},
  whatsappVerified: false,
  profilePhoto: null,
  bio: "",
};

export const draft: Draft = { ...DEFAULT };

let loaded = false;

export async function loadDraft(): Promise<Draft> {
  if (loaded) return draft;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.assign(draft, DEFAULT, parsed);
    }
  } catch {
    // ignore
  }
  loaded = true;
  return draft;
}

export async function saveDraft(patch: Partial<Draft> = {}): Promise<void> {
  Object.assign(draft, patch);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // ignore
  }
}

export async function resetDraft(): Promise<void> {
  Object.assign(draft, DEFAULT);
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

// Helpers ---------------------------------------------------------------

export const ALL_DAYS = [
  { key: "monday", label: "MON", full: "MONDAY" },
  { key: "tuesday", label: "TUE", full: "TUESDAY" },
  { key: "wednesday", label: "WED", full: "WEDNESDAY" },
  { key: "thursday", label: "THU", full: "THURSDAY" },
  { key: "friday", label: "FRI", full: "FRIDAY" },
  { key: "saturday", label: "SAT", full: "SATURDAY" },
  { key: "sunday", label: "SUN", full: "SUNDAY" },
];

export function dayLabel(key: string): string {
  return ALL_DAYS.find((d) => d.key === key)?.label || key.slice(0, 3).toUpperCase();
}

export function fullDayLabel(key: string): string {
  return ALL_DAYS.find((d) => d.key === key)?.full || key.toUpperCase();
}

// Format 24h time as "8:30 AM"
export function fmtTime(t: string): string {
  if (!t || !t.includes(":")) return t;
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return t;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

// Derive legacy availabilitySlots from new fields (used at submit time).
export function deriveAvailabilitySlots(): { dayOfWeek: string; startTime: string; endTime: string }[] {
  if (!draft.rankedDays.length || !draft.preferredStartTime || !draft.preferredEndTime) return [];
  return draft.rankedDays.map((d) => ({
    dayOfWeek: d,
    startTime: draft.preferredStartTime,
    endTime: draft.preferredEndTime,
  }));
}

// Derive legacy gameOrientation from gameTypes multi-select.
export function deriveGameOrientation(): string {
  const set = new Set(draft.gameTypes);
  if (set.has("competitive") && set.has("social")) return "both";
  if (set.has("competitive")) return "competitive";
  if (set.has("social")) return "social";
  return "both";
}
