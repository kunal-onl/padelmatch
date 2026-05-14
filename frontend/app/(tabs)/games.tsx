// Games feed.
import React, { useCallback, useEffect, useState } from "react";
import { View, ScrollView, Text, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
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
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const params: any = {};
    if (when !== "all") params.when = when;
    if (tab === "available") params.openOnly = true;
    const [g, v] = await Promise.all([api.listGames(params), api.listVenues()]);
    setGames(g);
    setVenues(v);
  }, [when, tab]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const venuesById: Record<string, any> = Object.fromEntries(venues.map((v) => [v.id, v]));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Heading size={20}>GAMES FEED</Heading>
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
            <Text style={styles.emptyCreate}>CREATE ONE →</Text>
          </View>
        ) : (
          games.map((g) => (
            <GameCard
              key={g.id}
              testID={`game-card-${g.id}`}
              game={g}
              venueName={venuesById[g.venueId]?.name || ""}
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
  },
  filterRow: { flexDirection: "row", padding: 8, backgroundColor: C.cream },
  tabsRow: { flexDirection: "row", paddingHorizontal: 8, paddingBottom: 8, backgroundColor: C.cream },
  emptyBig: { fontFamily: F.ub900, fontSize: 30, color: C.ink, letterSpacing: -1, textAlign: "center" },
  emptyCreate: { fontFamily: F.ub700, fontSize: 14, color: C.lime, marginTop: 18, letterSpacing: 1 },
});
