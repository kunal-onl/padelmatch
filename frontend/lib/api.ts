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
