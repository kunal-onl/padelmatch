// Player auth-lite context (no real auth — just the local current player).
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getCurrentPlayerId, setCurrentPlayerId, clearCurrentPlayer } from "./api";

export type Player = any;

type Ctx = {
  player: Player | null;
  loading: boolean;
  signIn: (id: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const PlayerCtx = createContext<Ctx>({
  player: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  refresh: async () => {},
});

export const usePlayer = () => useContext(PlayerCtx);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const id = await getCurrentPlayerId();
    if (!id) {
      setPlayer(null);
      setLoading(false);
      return;
    }
    try {
      const p = await api.getPlayer(id);
      setPlayer(p);
    } catch {
      setPlayer(null);
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (id: string) => {
    await setCurrentPlayerId(id);
    await refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await clearCurrentPlayer();
    setPlayer(null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <PlayerCtx.Provider value={{ player, loading, signIn, signOut, refresh }}>
      {children}
    </PlayerCtx.Provider>
  );
}
