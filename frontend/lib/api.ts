// API client for Padel Match backend.
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api`;

const CURRENT_PLAYER_KEY = "pm.currentPlayerId";

export async function getCurrentPlayerId(): Promise<string | null> {
  return AsyncStorage.getItem(CURRENT_PLAYER_KEY);
}
export async function setCurrentPlayerId(id: string) {
  await AsyncStorage.setItem(CURRENT_PLAYER_KEY, id);
}
export async function clearCurrentPlayer() {
  await AsyncStorage.removeItem(CURRENT_PLAYER_KEY);
}

async function req(path: string, opts: RequestInit = {}) {
  const pid = await getCurrentPlayerId();
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(opts.headers as any),
  };
  if (pid) headers["x-player-id"] = pid;
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${res.status}: ${txt}`);
  }
  return res.json();
}

export const api = {
  // venues / players
  listVenues: () => req("/venues"),
  listPlayers: () => req("/players"),
  getPlayer: (id: string) => req(`/players/${id}`),
  createPlayer: (data: any) =>
    req("/players", { method: "POST", body: JSON.stringify(data) }),
  patchPlayer: (id: string, data: any) =>
    req(`/players/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  // games
  listGames: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "") as any,
    ).toString();
    return req(`/games${qs ? `?${qs}` : ""}`);
  },
  getGame: (id: string) => req(`/games/${id}`),
  createGame: (data: any) =>
    req("/games", { method: "POST", body: JSON.stringify(data) }),
  joinGame: (id: string) => req(`/games/${id}/join`, { method: "POST" }),
  leaveGame: (id: string) => req(`/games/${id}/leave`, { method: "POST" }),
  bookGame: (id: string, hudleBookingUrl: string) =>
    req(`/games/${id}/book`, { method: "PATCH", body: JSON.stringify({ hudleBookingUrl }) }),
  cancelGame: (id: string) => req(`/games/${id}/cancel`, { method: "POST" }),
  pendingCompletion: () => req(`/games/pending-completion`),
  dismissPrompt: (id: string, dismiss = true) =>
    req(`/games/${id}/dismiss-prompt`, { method: "POST", body: JSON.stringify({ dismiss }) }),
  submitReflection: (id: string, text: string, focusAreas: string[]) =>
    req(`/games/${id}/reflect`, { method: "POST", body: JSON.stringify({ text, focusAreas }) }),
  submitPeerRatings: (id: string, ratings: Record<string, Record<string, number>>) =>
    req(`/games/${id}/peer-ratings`, { method: "POST", body: JSON.stringify({ ratings }) }),
  submitAttendance: (id: string, attendance: Record<string, boolean>) =>
    req(`/games/${id}/attendance`, { method: "POST", body: JSON.stringify({ attendance }) }),

  // recommendations / leaderboard
  recommendations: (limit = 5) => req(`/recommendations?limit=${limit}`),
  leaderboard: () => req("/leaderboard"),

  // matches
  listMatches: (playerId?: string, limit = 20) =>
    req(`/matches?${playerId ? `playerId=${playerId}&` : ""}limit=${limit}`),
  getMatch: (id: string) => req(`/matches/${id}`),
  enterScore: (id: string, data: any) =>
    req(`/matches/${id}/score`, { method: "POST", body: JSON.stringify(data) }),

  // notifications
  notifications: () => req("/notifications"),
  markRead: (id: string) =>
    req(`/notifications/${id}/read`, { method: "POST" }),
};
