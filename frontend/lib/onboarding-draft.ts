// Mutable draft shared across onboarding screens.
export type Draft = {
  name: string;
  phone: string;
  profilePhoto: string | null;
  bio: string;
  yearsPlayed: string;
  frequency: string;
  competitiveExperience: string;
  wallControl: string;
  preferredVenues: string[];
  availabilitySlots: Array<{ dayOfWeek: string; startTime: string; endTime: string }>;
  gamesPerWeek: number;
  gameOrientation: string;
  connections: Array<{ playerId: string; relationship: string; reason: string | null; addedAt: string }>;
  shotComfort: Record<string, number>;
};

export const draft: Draft = {
  name: "",
  phone: "",
  profilePhoto: null,
  bio: "",
  yearsPlayed: "",
  frequency: "",
  competitiveExperience: "",
  wallControl: "",
  preferredVenues: [],
  availabilitySlots: [],
  gamesPerWeek: 2,
  gameOrientation: "",
  connections: [],
  shotComfort: {},
};

export function resetDraft() {
  draft.name = "";
  draft.phone = "";
  draft.profilePhoto = null;
  draft.bio = "";
  draft.yearsPlayed = "";
  draft.frequency = "";
  draft.competitiveExperience = "";
  draft.wallControl = "";
  draft.preferredVenues = [];
  draft.availabilitySlots = [];
  draft.gamesPerWeek = 2;
  draft.gameOrientation = "";
  draft.connections = [];
  draft.shotComfort = {};
}
