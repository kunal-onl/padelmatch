// Games feed.
import React, { useCallback, useEffect, useState } from "react";
import { View, ScrollView, Text, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "../../lib/theme";
import { Heading, MicroLabel, Pill } from "../../lib/ui";
import { GameCard } from "../../lib/game-card";
import { api } from "../../lib/api";

export default function Games() {
  const router = useRouter();
  const [when, setWhen] = useState<"today" | "week" | "all">("week");
  const [tab, setTab] = useState<"available" | "all">("available");
  const [games, setGames] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const params: any = {};
    if (when !== "all") params.when = when;
    if (tab === "available") params.openOnly = true;
    const [g, v, p] = await Promise.all([api.listGames(params), api.listVenues(), api.listPlayers()]);
    setGames(g);
    setVenues(v);
    setPlayers(p);
  }, [when, tab]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const venuesById: Record<string, any> = Object.fromEntries(venues.map((v) => [v.id, v]));
  const playersById: Record<string, any> = Object.fromEntries(players.map((p) => [p.id, p]));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Heading size={20}>GAMES FEED</Heading>
        <TouchableOpacity
          testID="games-create-cta"
          onPress={() => router.push("/create")}
          style={styles.createBtn}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color={C.ink} />
          <Text style={styles.createBtnText}>CREATE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {(["today", "week", "all"] as const).map((k) => (
          <View key={k} style={{ flex: 1, marginHorizontal: 2 }}>
            <Pill testID={`filter-${k}`} label={k.toUpperCase()} active={when === k} onPress={() => setWhen(k)} />
          </View>
        ))}
      </View>

      <View style={styles.tabsRow}>
        {[
          { key: "available", label: "AVAILABLE" },
          { key: "all", label: "ALL GAMES" },
        ].map((t) => {
          const active = tab === t.key;
          return (
            <View
              key={t.key}
              style={{
                flex: 1,
                borderBottomWidth: 3,
                borderBottomColor: active ? C.lime : "transparent",
              }}
            >
              <Pill
                testID={`tab-${t.key}`}
                label={t.label}
                active={active}
                onPress={() => setTab(t.key as any)}
                style={{ borderWidth: 0 }}
              />
            </View>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {games.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Text style={styles.emptyBig}>NO GAMES MATCH</Text>
            <Text style={styles.emptyBig}>YOUR PREFERENCES</Text>
            <TouchableOpacity testID="games-empty-create" onPress={() => router.push("/create")} style={{ marginTop: 18 }}>
              <Text style={styles.emptyCreate}>CREATE ONE →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          games.map((g) => (
            <GameCard
              key={g.id}
              testID={`game-card-${g.id}`}
              game={g}
              venue={venuesById[g.venueId]}
              players={playersById}
              onPress={() => router.push(`/games/${g.id}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  header: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: BORDER, borderBottomColor: C.ink, backgroundColor: C.cream,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  createBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.lime, borderWidth: BORDER, borderColor: C.ink,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  createBtnText: { fontFamily: F.ub900, fontSize: 11, color: C.ink, letterSpacing: 1, marginLeft: 4 },
  filterRow: { flexDirection: "row", padding: 8, backgroundColor: C.cream },
  tabsRow: { flexDirection: "row", paddingHorizontal: 8, paddingBottom: 8, backgroundColor: C.cream },
  emptyBig: { fontFamily: F.ub900, fontSize: 30, color: C.ink, letterSpacing: -1, textAlign: "center" },
  emptyCreate: { fontFamily: F.ub700, fontSize: 14, color: C.lime, marginTop: 18, letterSpacing: 1 },
});
