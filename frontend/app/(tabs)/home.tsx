// Home — the loop's spine surface. Leads with ORIENTATION (where you are right
// now — the calibration reading) and WHAT-NEEDS-YOU (slim routing items), and is
// the notification routing hub (the bell + each item routes into the relevant
// surface). IA refactor: post-game actions are now slim rows that route into the
// game (where the lifecycle stepper handles scoring/reflection/rating) — NOT
// full-height hero cards stacked above orientation.
import React, { useCallback, useState } from "react";
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
  const [domains, setDomains] = useState<any>(null);
  const [checkinDismissed, setCheckinDismissed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, v, ps, ms, pc, dm] = await Promise.all([
        api.recommendations(5),
        api.listVenues(),
        api.listPlayers(),
        api.listMatches(player?.id, 5),
        api.pendingCompletion(),
        api.getDomains().catch(() => null),
      ]);
      setRecs(r); setVenues(v); setPlayers(ps); setMatches(ms); setPending(pc);
      setDomains(dm?.domains || null);
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
  const checkinDue = !!domains && Object.values(domains).some((d: any) => !d || !d.editableAt);

  const myDays = new Set((player.availabilitySlots || []).map((s: any) => s.dayOfWeek));
  const available = players
    .filter((p) => p.id !== player.id && (p.availabilitySlots || []).some((s: any) => myDays.has(s.dayOfWeek)))
    .slice(0, 12);

  const myMatches = matches.filter((m) =>
    [...m.pairA, ...m.pairB].includes(player.id) && m.status === "scored",
  ).slice(0, 3);

  // What needs you — booked games that just finished and still want a reading.
  const needsYou = pending
    .filter((g) => !(g.promptDismissedBy || []).includes(player.id))
    .filter((g) => {
      const scored = (g.scoresSubmittedBy || []).includes(player.id);
      const reflected = (g.reflectionsBy || []).includes(player.id);
      const rated = (g.peerRatingsBy || []).includes(player.id);
      return !(scored && reflected && rated);
    });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Top ink header — greeting + the notification routing hub. */}
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
        {/* Orientation — where you are right now; leads the page. RATING is the
            one accented hero tile; the rest are neutral data. */}
        <View style={styles.statStrip}>
          <StatChip bg={C.ink} valueColor={C.lime} value={player.gameRating.toFixed(1)} label="RATING" testID="stat-rating" />
          <View style={styles.statDivider} />
          <StatChip bg={C.white} value={player.communityRank ? `#${player.communityRank}` : "—"} label="NORTH GOA" testID="stat-rank" />
          <View style={styles.statDivider} />
          <StatChip bg={C.white} value={String(player.matchesPlayed)} label="PLAYED" testID="stat-played" />
          <View style={styles.statDivider} />
          <StatChip bg={C.white} value={`${winRate}%`} label="WIN RATE" testID="stat-winrate" />
        </View>

        {/* Weekly self-improvement check-in — what you're working on. */}
        {checkinDue && !checkinDismissed && (
          <TouchableOpacity activeOpacity={0.9} testID="weekly-checkin-banner"
            onPress={() => router.push("/skill-checkin" as any)} style={styles.checkinBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.checkinTitle}>TIME FOR YOUR WEEKLY CHECK-IN</Text>
              <Text style={styles.checkinSub}>Has anything moved? Update your four domains.  REVIEW →</Text>
            </View>
            <TouchableOpacity testID="checkin-dismiss" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={(e: any) => { e?.stopPropagation?.(); setCheckinDismissed(true); }}>
              <Ionicons name="close" size={18} color={C.ink} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Needs you — slim routing rows into the game (where the lifecycle
            stepper handles scoring/reflection/rating). Not full-height cards. */}
        {needsYou.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <Heading size={11}>NEEDS YOU</Heading>
            <View style={{ height: 8 }} />
            {needsYou.map((g) => {
              const v = venuesById[g.venueId];
              const dateLabel = (() => {
                try { return new Date(g.date).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }).toUpperCase(); } catch { return g.date; }
              })();
              return (
                <TouchableOpacity key={g.id} testID={`needs-${g.id}`} activeOpacity={0.85}
                  onPress={() => router.push(`/games/${g.id}`)} style={styles.needsRow}>
                  <View style={styles.needsAccent} />
                  <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 12 }}>
                    <Text style={styles.needsTitle}>HOW DID IT GO?</Text>
                    <Text style={styles.needsMeta}>{(v?.name || "VENUE").toUpperCase()} · {dateLabel}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={C.ink} style={{ marginRight: 12 }} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Primary CTA */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <SplitCTA testID="cta-find-game" label="FIND A GAME" intent="forward" onPress={() => router.push("/(tabs)/play" as any)} />
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
  checkinBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.lime, borderWidth: BORDER, borderColor: C.ink,
    marginHorizontal: 16, marginTop: 16, padding: 12,
  },
  checkinTitle: { fontFamily: F.ub900, fontSize: 12, color: C.ink, letterSpacing: 0.3 },
  checkinSub: { fontFamily: F.mono, fontSize: 10, color: C.ink, letterSpacing: 0.6, marginTop: 3 },
  needsRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink,
    marginBottom: 8,
  },
  needsAccent: { width: 4, alignSelf: "stretch", backgroundColor: C.lime },
  needsTitle: { fontFamily: F.ub700, fontSize: 13, color: C.ink, letterSpacing: 0.3 },
  needsMeta: { fontFamily: F.mono, fontSize: 10, color: C.grey, letterSpacing: 1, marginTop: 3 },
  statStrip: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: BORDER, borderColor: C.ink,
    backgroundColor: C.white,
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
