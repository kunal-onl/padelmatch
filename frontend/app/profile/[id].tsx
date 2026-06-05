// Other player's profile.
import React, { useCallback, useEffect, useState } from "react";
import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "../../lib/theme";
import { Avatar, MicroLabel, StatChip, SplitCTA, Heading, Body } from "../../lib/ui";
import { api } from "../../lib/api";
import { usePlayer } from "../../lib/context";
import { formatDate } from "../../lib/utils";

export default function OtherProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { player: me } = usePlayer();
  const [p, setP] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [playersById, setPlayersById] = useState<Record<string, any>>({});

  const load = useCallback(async () => {
    const target = await api.getPlayer(String(id));
    setP(target);
    const [ms, ps] = await Promise.all([api.listMatches(String(id), 20), api.listPlayers()]);
    setMatches(ms);
    setPlayersById(Object.fromEntries(ps.map((x: any) => [x.id, x])));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (!p) return <SafeAreaView style={styles.safe} />;

  // Played-together stats
  const sharedMatches = matches.filter((m) => me && [...m.pairA, ...m.pairB].includes(me.id) && m.status === "scored");
  const wins = sharedMatches.filter((m) => {
    const onA = m.pairA.includes(me!.id) && m.pairA.includes(p.id);
    const onB = m.pairB.includes(me!.id) && m.pairB.includes(p.id);
    if (!onA && !onB) return false;
    return (onA && m.winner === "pairA") || (onB && m.winner === "pairB");
  }).length;
  const losses = sharedMatches.filter((m) => (m.pairA.includes(me!.id) && m.pairA.includes(p.id)) || (m.pairB.includes(me!.id) && m.pairB.includes(p.id))).length - wins;
  const total = wins + losses;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        <TouchableOpacity onPress={() => router.back()} testID="op-back">
          <Ionicons name="chevron-back" size={26} color={C.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.hero}>
          <Avatar name={p.name} size={80} bg={C.lime} />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={styles.heroName} numberOfLines={1}>{p.name.toUpperCase()}</Text>
            {!!p.bio && <Text style={styles.heroBio} numberOfLines={2}>{p.bio}</Text>}
          </View>
        </View>

        <View style={styles.ratingBlock}>
          <MicroLabel color={C.lime}>GAME RATING</MicroLabel>
          <Text style={styles.ratingNum} testID="op-rating">{p.gameRating.toFixed(1)}</Text>
          <View style={{ height: 4, width: 100, backgroundColor: C.lime, marginTop: 4 }} />
          <Text style={styles.statusLabel}>{(p.gameRatingStatus || "estimated").toUpperCase()}</Text>
        </View>

        {p.communityRank && (
          <View style={styles.rankBand}>
            <Text style={styles.rankBandText}>#{p.communityRank} IN NORTH GOA PADEL</Text>
          </View>
        )}

        <View style={styles.relationship}>
          {total > 0 ? (
            <Text style={styles.relText}>YOU'VE PLAYED {total} MATCH{total === 1 ? "" : "ES"} — {wins} WIN{wins === 1 ? "" : "S"}, {losses} LOSS{losses === 1 ? "" : "ES"}</Text>
          ) : (
            <Text style={styles.relText}>YOU HAVEN'T PLAYED YET — STRONG PROFILE MATCH</Text>
          )}
        </View>

        <View style={styles.statStrip}>
          <StatChip bg={C.white} value={String(p.matchesPlayed)} label="MATCHES" />
          <View style={styles.div} />
          <StatChip bg={C.lime} value={String(p.wins)} label="WINS" />
          <View style={styles.div} />
          <StatChip bg={C.coral} valueColor={C.white} value={String(p.losses)} label="LOSSES" />
          <View style={styles.div} />
          <StatChip bg={C.white} value={`${p.matchesPlayed ? Math.round((p.wins / p.matchesPlayed) * 100) : 0}%`} label="WIN RATE" />
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Heading size={11}>RECENT MATCHES</Heading>
          <View style={{ height: 10 }} />
          {matches.filter((m) => m.status === "scored").slice(0, 6).map((m) => {
            const onA = m.pairA.includes(p.id);
            const opps = (onA ? m.pairB : m.pairA).map((id: string) => playersById[id]?.name || "?").join(" & ");
            const wonA = m.winner === "pairA";
            const win = (wonA && onA) || (!wonA && !onA);
            const score = m.sets.map((s: any) => `${s.pairA}-${s.pairB}`).join("  ");
            return (
              <View key={m.id} style={[styles.histRow, { borderLeftColor: win ? C.win : C.loss }]}>
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
          })}
        </View>
      </ScrollView>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: C.cream, borderTopWidth: BORDER, borderTopColor: C.ink }}>
        <SplitCTA testID="invite-to-game" label="INVITE TO GAME" intent="forward" onPress={() => router.push("/host" as any)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  hero: { flexDirection: "row", alignItems: "center", backgroundColor: C.blue, padding: 14, borderTopWidth: BORDER, borderBottomWidth: BORDER, borderColor: C.ink },
  heroName: { fontFamily: F.ub900, fontSize: 22, color: C.white, letterSpacing: -0.8 },
  heroBio: { fontFamily: F.sans, fontSize: 11, color: "rgba(255,255,255,0.85)", fontStyle: "italic", marginTop: 4 },
  ratingBlock: { alignItems: "center", paddingVertical: 24, backgroundColor: C.cream, borderBottomWidth: BORDER, borderColor: C.ink },
  ratingNum: { fontFamily: F.ub900, fontSize: 88, color: C.ink, letterSpacing: -3, lineHeight: 92, marginTop: 6 },
  statusLabel: { fontFamily: F.mono, fontSize: 9, color: C.grey, marginTop: 10, letterSpacing: 1.6 },
  rankBand: { backgroundColor: C.purple, paddingVertical: 12, alignItems: "center", borderBottomWidth: BORDER, borderColor: C.ink },
  rankBandText: { fontFamily: F.ub900, fontSize: 16, color: C.white, letterSpacing: -0.4 },
  relationship: { backgroundColor: C.white, padding: 14, borderBottomWidth: BORDER, borderColor: C.ink },
  relText: { fontFamily: F.ub700, fontSize: 12, color: C.ink, letterSpacing: -0.2, textAlign: "center" },
  statStrip: { flexDirection: "row", backgroundColor: C.ink },
  div: { width: BORDER, backgroundColor: C.ink },
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
