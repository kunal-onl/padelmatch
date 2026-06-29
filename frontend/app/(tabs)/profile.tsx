// Profile — administrative identity (the spine's control room for privacy).
// IA refactor: the Growth Record (rating, stats, trend, radar, shot library)
// migrated OUT to the Grow tab. Profile is now thin + administrative: identity,
// privacy settings, notification settings, preferred venues, match history,
// sign-out. NOT a growth surface.
import React, { useCallback, useState } from "react";
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "../../lib/theme";
import { Avatar, Heading, Body, OutlineButton } from "../../lib/ui";
import { api } from "../../lib/api";
import { usePlayer } from "../../lib/context";
import { formatDate } from "../../lib/utils";

export default function Profile() {
  const router = useRouter();
  const { player, refresh, signOut } = usePlayer();
  const [venues, setVenues] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!player) return;
    const [v, ps, ms] = await Promise.all([
      api.listVenues(), api.listPlayers(), api.listMatches(player.id, 20),
    ]);
    setVenues(v); setPlayers(ps); setMatches(ms);
  }, [player]);

  useFocusEffect(useCallback(() => { refresh().then(load); }, [load, refresh]));

  if (!player) return <SafeAreaView style={styles.safe} />;

  const playersById: Record<string, any> = Object.fromEntries(players.map((p) => [p.id, p]));
  const venuesById: Record<string, any> = Object.fromEntries(venues.map((v) => [v.id, v]));

  const soon = (what: string) =>
    Alert.alert(what, "Controls for this are coming in a later update. Your data stays private by default.");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refresh(); await load(); setRefreshing(false); }} />}
      >
        {/* Identity */}
        <View style={styles.hero}>
          <Avatar name={player.name} size={80} bg={C.lime} />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={styles.heroName} numberOfLines={1}>{player.name.toUpperCase()}</Text>
            {!!player.bio && <Text style={styles.heroBio} numberOfLines={2}>{player.bio}</Text>}
          </View>
        </View>

        {/* Settings — privacy + notifications (the administrative control room) */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Heading size={11}>SETTINGS</Heading>
          <TouchableOpacity testID="settings-privacy" activeOpacity={0.85} onPress={() => soon("Privacy")} style={styles.settingRow}>
            <Ionicons name="lock-closed-outline" size={18} color={C.ink} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.settingTitle}>PRIVACY</Text>
              <Text style={styles.settingSub}>Your Growth Record is private by default · you control what's shared</Text>
            </View>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="settings-notifications" activeOpacity={0.85} onPress={() => soon("Notifications")} style={styles.settingRow}>
            <Ionicons name="notifications-outline" size={18} color={C.ink} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.settingTitle}>NOTIFICATIONS</Text>
              <Text style={styles.settingSub}>Choose which loop nudges reach you</Text>
            </View>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Preferred venues */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Heading size={11}>PREFERRED VENUES</Heading>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
            {(player.preferredVenues || []).map((id: string, i: number) => (
              <View key={id} style={styles.venueChip}>
                <Text style={styles.venueChipText}>#{i + 1} {(venuesById[id]?.name || "").toUpperCase()}</Text>
              </View>
            ))}
            {(player.preferredVenues || []).length === 0 && (
              <Body size={11} color={C.grey}>None set yet.</Body>
            )}
          </View>
        </View>

        {/* Match history */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Heading size={11}>MATCH HISTORY</Heading>
          <View style={{ height: 10 }} />
          {matches.length === 0 ? (
            <Body size={11} color={C.grey}>No matches yet.</Body>
          ) : (
            matches.filter((m) => m.status === "scored").map((m) => {
              const onA = m.pairA.includes(player.id);
              const opps = (onA ? m.pairB : m.pairA).map((id: string) => playersById[id]?.name || "?").join(" & ");
              const wonA = m.winner === "pairA";
              const win = (wonA && onA) || (!wonA && !onA);
              const score = m.sets.map((s: any) => `${s.pairA}-${s.pairB}`).join("  ");
              return (
                <View key={m.id} style={[styles.histRow, { borderLeftColor: win ? C.win : C.loss }]} testID={`hist-${m.id}`}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.histDate}>{formatDate(m.date)}</Text>
                    <Text style={styles.histOpp} numberOfLines={1}>vs {opps}</Text>
                  </View>
                  <Text style={styles.histScore}>{score}</Text>
                  <View style={[styles.histBadge, { backgroundColor: win ? C.win : C.loss }]}>
                    <Text style={styles.histBadgeText}>{win ? "WIN" : "LOSS"}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ padding: 16, marginTop: 8 }}>
          <OutlineButton
            testID="sign-out"
            label="SIGN OUT"
            onPress={() => {
              Alert.alert(
                "Sign out?",
                "You'll be returned to the start screen. Your data is safe.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Sign out",
                    style: "destructive",
                    onPress: async () => {
                      await signOut();
                      router.replace("/onboarding/identity");
                    },
                  },
                ],
              );
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  hero: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.blue, padding: 14,
    borderBottomWidth: BORDER, borderBottomColor: C.ink,
  },
  heroName: { fontFamily: F.ub900, fontSize: 22, color: C.white, letterSpacing: -0.8 },
  heroBio: { fontFamily: F.sans, fontSize: 11, color: "rgba(255,255,255,0.85)", fontStyle: "italic", marginTop: 4 },
  settingRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink,
    padding: 14, marginTop: 8,
  },
  settingTitle: { fontFamily: F.ub900, fontSize: 13, color: C.ink, letterSpacing: -0.2 },
  settingSub: { fontFamily: F.mono, fontSize: 10, color: C.grey, letterSpacing: 0.6, marginTop: 3 },
  settingArrow: { fontFamily: F.ub900, fontSize: 18, color: C.ink },
  venueChip: { backgroundColor: C.ink, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6, marginBottom: 6, borderWidth: BORDER, borderColor: C.ink },
  venueChipText: { fontFamily: F.mono, fontSize: 9, color: C.lime, letterSpacing: 1.2 },
  histRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink,
    borderLeftWidth: 4, padding: 12, marginBottom: 8,
  },
  histDate: { fontFamily: F.mono, fontSize: 9, color: C.grey, letterSpacing: 1.2 },
  histOpp: { fontFamily: F.sans, fontSize: 12, color: C.ink, marginTop: 2 },
  histScore: { fontFamily: F.mono, fontSize: 13, color: C.ink, marginHorizontal: 8 },
  histBadge: { paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: C.ink },
  histBadgeText: { fontFamily: F.ub900, fontSize: 9, color: C.white, letterSpacing: 0.6 },
});
