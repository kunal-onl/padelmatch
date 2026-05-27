// Home / Dashboard.
import React, { useCallback, useEffect, useState } from "react";
import { View, ScrollView, Text, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, Heading, MicroLabel, StatChip, Avatar, Body } from "../../lib/ui";
import { GameCard } from "../../lib/game-card";
import { api } from "../../lib/api";
import { usePlayer } from "../../lib/context";
import { greeting, formatDate } from "../../lib/utils";

export default function Home() {
  const router = useRouter();
  const { player, refresh } = usePlayer();
  const [recs, setRecs] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, v, ps, ms, pc] = await Promise.all([
        api.recommendations(5),
        api.listVenues(),
        api.listPlayers(),
        api.listMatches(player?.id, 5),
        api.pendingCompletion(),
      ]);
      setRecs(r); setVenues(v); setPlayers(ps); setMatches(ms); setPending(pc);
    } catch {}
  }, [player?.id]);

  useFocusEffect(useCallback(() => { load(); refresh(); }, [load, refresh]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load(); await refresh();
    setRefreshing(false);
  };

  if (!player) return null;
  const venuesById: Record<string, any> = Object.fromEntries(venues.map((v) => [v.id, v]));
  const playersById: Record<string, any> = Object.fromEntries(players.map((p) => [p.id, p]));

  const winRate = player.matchesPlayed > 0 ? Math.round((player.wins / player.matchesPlayed) * 100) : 0;

  // Players available this week — those with at least one slot matching any of my days.
  const myDays = new Set((player.availabilitySlots || []).map((s: any) => s.dayOfWeek));
  const available = players
    .filter((p) => p.id !== player.id && (p.availabilitySlots || []).some((s: any) => myDays.has(s.dayOfWeek)))
    .slice(0, 12);

  const myMatches = matches.filter((m) =>
    [...m.pairA, ...m.pairB].includes(player.id) && m.status === "scored",
  ).slice(0, 3);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Top ink header */}
      <View style={styles.header}>
        <Text style={styles.greet}>
          {greeting()}, {player.name.split(" ")[0].toUpperCase()}
        </Text>
        <TouchableOpacity onPress={() => router.push("/notifications")} testID="nav-notifications">
          <Ionicons name="notifications-outline" size={22} color={C.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.ink} />}
      >
        {/* Post-match prompt cards — surface above all content for any of
            my BOOKED games that have just transitioned to COMPLETED. */}
        {pending
          .filter((g) => !(g.promptDismissedBy || []).includes(player.id))
          .filter((g) => {
            const scored = (g.scoresSubmittedBy || []).includes(player.id);
            const reflected = (g.reflectionsBy || []).includes(player.id);
            const rated = (g.peerRatingsBy || []).includes(player.id);
            return !(scored && reflected && rated);
          })
          .map((g) => {
            const v = venuesById[g.venueId];
            const dateLabel = (() => {
              try { return new Date(g.date).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }).toUpperCase(); } catch { return g.date; }
            })();
            const scored = (g.scoresSubmittedBy || []).includes(player.id);
            const reflected = (g.reflectionsBy || []).includes(player.id);
            const rated = (g.peerRatingsBy || []).includes(player.id);
            const row = (label: string, done: boolean, href: string, tid: string) => (
              <TouchableOpacity
                key={label}
                testID={tid}
                onPress={() => router.push(href)}
                style={pmStyles.row}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={done ? "checkmark-circle" : "ellipse-outline"}
                  size={18}
                  color={done ? C.lime : "rgba(255,255,255,0.55)"}
                />
                <Text style={[pmStyles.rowText, done && { color: "rgba(255,255,255,0.55)", textDecorationLine: "line-through" }]}>
                  {label}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.55)" />
              </TouchableOpacity>
            );
            return (
              <View key={g.id} style={pmStyles.card} testID={`postmatch-prompt-${g.id}`}>
                <View style={pmStyles.leftAccent} />
                <View style={{ flex: 1, padding: 16 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={pmStyles.title}>HOW DID IT GO?</Text>
                    <TouchableOpacity
                      testID={`postmatch-dismiss-${g.id}`}
                      onPress={async () => {
                        try { await api.dismissPrompt(g.id, true); load(); } catch {}
                      }}
                    >
                      <Text style={pmStyles.dismiss}>LATER</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={pmStyles.meta}>
                    {(v?.name || "VENUE").toUpperCase()} · {dateLabel} · {g.startTime}–{g.endTime}
                  </Text>
                  <View style={{ height: 12 }} />
                  {row("ENTER SCORES",      scored,    `/score/${g.matchId || g.id}?gameId=${g.id}`, `pm-scores-${g.id}`)}
                  {row("SELF-REFLECT",      reflected, `/reflect/${g.id}`,                            `pm-reflect-${g.id}`)}
                  {row("RATE YOUR PARTNERS", rated,    `/feedback/${g.id}`,                           `pm-rate-${g.id}`)}
                </View>
              </View>
            );
          })}

        {/* Stat strip */}
        <View style={styles.statStrip}>
          <StatChip bg={C.ink} valueColor={C.lime} value={player.gameRating.toFixed(1)} label="RATING" testID="stat-rating" />
          <View style={styles.statDivider} />
          <StatChip bg={C.purple} valueColor={C.white} value={player.communityRank ? `#${player.communityRank}` : "—"} label="NORTH GOA" testID="stat-rank" />
          <View style={styles.statDivider} />
          <StatChip bg={C.white} value={String(player.matchesPlayed)} label="PLAYED" testID="stat-played" />
          <View style={styles.statDivider} />
          <StatChip bg={C.lime} value={`${winRate}%`} label="WIN RATE" testID="stat-winrate" />
        </View>

        {/* Primary CTA */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <SplitCTA testID="cta-find-game" label="FIND A GAME" onPress={() => router.push("/(tabs)/games")} />
        </View>

        {/* Strong matches */}
        <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
          <Heading size={11}>STRONG MATCHES FOR YOU</Heading>
          <View style={{ height: 10 }} />
          {recs.length === 0 ? (
            <Body size={11} color={C.grey}>No open games match your filters yet. Create one?</Body>
          ) : (
            recs.slice(0, 3).map((r: any) => (
              <GameCard
                key={r.game.id}
                testID={`rec-card-${r.game.id}`}
                game={r.game}
                venue={venuesById[r.game.venueId]}
                players={playersById}
                onPress={() => router.push(`/games/${r.game.id}`)}
              />
            ))
          )}
        </View>

        {/* Players available this week */}
        <View style={{ marginTop: 12, paddingLeft: 16 }}>
          <Heading size={11} style={{ marginBottom: 10 }}>PLAYERS AVAILABLE THIS WEEK</Heading>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
            {available.map((p) => (
              <TouchableOpacity
                key={p.id}
                testID={`avail-player-${p.id}`}
                onPress={() => router.push(`/profile/${p.id}`)}
                style={styles.playerChip}
              >
                <Avatar name={p.name} size={44} />
                <Text style={styles.chipName} numberOfLines={1}>{p.name.toUpperCase()}</Text>
                <Text style={styles.chipRating}>{p.gameRating.toFixed(1)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent results */}
        <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
          <Heading size={11}>RECENT RESULTS</Heading>
          <View style={{ height: 10 }} />
          {myMatches.length === 0 ? (
            <Body size={11} color={C.grey}>No scored matches yet. Play a game and enter the score.</Body>
          ) : (
            myMatches.map((m) => {
              const onA = m.pairA.includes(player.id);
              const opps = (onA ? m.pairB : m.pairA).map((id: string) => playersById[id]?.name || "?").join(" & ");
              const wonA = m.winner === "pairA";
              const win = (wonA && onA) || (!wonA && !onA);
              const score = m.sets.map((s: any) => `${s.pairA}-${s.pairB}`).join("  ");
              return (
                <View key={m.id} style={[styles.resultRow, { borderLeftColor: win ? C.win : C.loss }]} testID={`match-${m.id}`}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultDate}>{formatDate(m.date)}</Text>
                    <Text style={styles.resultOpp} numberOfLines={1}>vs {opps}</Text>
                  </View>
                  <Text style={styles.resultScore}>{score}</Text>
                  <View style={[styles.resultBadge, { backgroundColor: win ? C.win : C.loss }]}>
                    <Text style={styles.resultBadgeText}>{win ? "WIN" : "LOSS"}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  header: {
    backgroundColor: C.ink,
    paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderBottomWidth: BORDER, borderBottomColor: C.ink,
  },
  greet: { fontFamily: F.ub700, fontSize: 13, color: C.white, letterSpacing: 1 },
  statStrip: {
    flexDirection: "row",
    backgroundColor: C.ink,
    borderBottomWidth: BORDER, borderBottomColor: C.ink,
  },
  statDivider: { width: BORDER, backgroundColor: C.ink },
  playerChip: { width: 80, marginRight: 10, alignItems: "center" },
  chipName: { fontFamily: F.ub700, fontSize: 10, color: C.ink, marginTop: 6, letterSpacing: -0.2 },
  chipRating: { fontFamily: F.mono, fontSize: 10, color: C.grey, marginTop: 2 },
  resultRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink,
    borderLeftWidth: 4, padding: 12, marginBottom: 8,
  },
  resultDate: { fontFamily: F.mono, fontSize: 9, color: C.grey, letterSpacing: 1.2 },
  resultOpp: { fontFamily: F.sans, fontSize: 12, color: C.ink, marginTop: 2 },
  resultScore: { fontFamily: F.mono, fontSize: 13, color: C.ink, marginHorizontal: 8 },
  resultBadge: { paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: C.ink },
  resultBadgeText: { fontFamily: F.ub900, fontSize: 9, color: C.white, letterSpacing: 0.6 },
});

const pmStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: C.ink,
    marginHorizontal: 16, marginTop: 14,
    borderWidth: BORDER, borderColor: C.ink,
  },
  leftAccent: { width: 4, backgroundColor: C.lime },
  title: { fontFamily: F.ub700, fontSize: 14, color: C.white, letterSpacing: 0.5 },
  dismiss: { fontFamily: F.mono, fontSize: 9, color: "rgba(255,255,255,0.55)", letterSpacing: 1.4 },
  meta: { fontFamily: F.mono, fontSize: 10, color: "rgba(255,255,255,0.7)", letterSpacing: 1.2, marginTop: 6 },
  row: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  rowText: {
    flex: 1, marginLeft: 10,
    fontFamily: F.ub700, fontSize: 12, color: C.white, letterSpacing: 0.6,
  },
});
