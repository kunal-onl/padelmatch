// Own profile — blue hero, large rating, sparkline, radar (simple SVG), stats, history.
import React, { useCallback, useMemo, useState } from "react";
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import Svg, { Polyline, Polygon, Circle, Line, Text as SvgText } from "react-native-svg";
import { C, F, BORDER } from "../../lib/theme";
import { Avatar, MicroLabel, StatChip, OutlineButton, Heading, Body } from "../../lib/ui";
import { api } from "../../lib/api";
import { usePlayer } from "../../lib/context";
import { formatDate } from "../../lib/utils";
import { SHOTS, CATEGORIES } from "../../lib/shots";

export default function Profile() {
  const router = useRouter();
  const { player, refresh, signOut } = usePlayer();
  const [venues, setVenues] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!player) return;
    const [v, ps, ms] = await Promise.all([api.listVenues(), api.listPlayers(), api.listMatches(player.id, 20)]);
    setVenues(v); setPlayers(ps); setMatches(ms);
  }, [player]);

  useFocusEffect(useCallback(() => { refresh().then(load); }, [load, refresh]));

  // Sparkline data — compute defensively so hooks run regardless of player.
  const history: any[] = player?.gameRatingHistory || [];
  const sparkPoints = useMemo(() => {
    if (history.length < 2) return "";
    const W = 320, H = 60, P = 6;
    const min = Math.min(...history.map((h) => h.rating));
    const max = Math.max(...history.map((h) => h.rating));
    const span = Math.max(0.4, max - min);
    return history.slice(-10).map((h, i, arr) => {
      const x = P + (i / (arr.length - 1)) * (W - P * 2);
      const y = H - P - ((h.rating - min) / span) * (H - P * 2);
      return `${x},${y}`;
    }).join(" ");
  }, [history]);

  // Radar — average per category (1-5 scale → mapped to radius)
  const radar = useMemo(() => {
    const cats = CATEGORIES.map(({ key, label }) => {
      const inCat = SHOTS.filter((s) => s.category === key);
      const vals = inCat.map((s) => player?.shotComfort?.[s.slug] || 0).filter((v) => v > 0);
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return { key, label, value: avg };
    });
    return cats;
  }, [player?.shotComfort]);

  if (!player) return <SafeAreaView style={styles.safe} />;

  const playersById: Record<string, any> = Object.fromEntries(players.map((p) => [p.id, p]));
  const venuesById: Record<string, any> = Object.fromEntries(venues.map((v) => [v.id, v]));
  const winRate = player.matchesPlayed > 0 ? Math.round((player.wins / player.matchesPlayed) * 100) : 0;

  const lastTen = history.slice(-10);
  const sparkDelta = lastTen.length >= 2 ? Math.round((lastTen[lastTen.length - 1].rating - lastTen[0].rating) * 10) / 10 : 0;
  const deltaPositive = sparkDelta >= 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refresh(); await load(); setRefreshing(false); }} />}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Avatar name={player.name} size={80} bg={C.lime} />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={styles.heroName} numberOfLines={1}>{player.name.toUpperCase()}</Text>
            {!!player.bio && <Text style={styles.heroBio} numberOfLines={2}>{player.bio}</Text>}
          </View>
        </View>

        {/* Rating block */}
        <View style={styles.ratingBlock}>
          <MicroLabel color={C.lime}>GAME RATING</MicroLabel>
          <Text style={styles.ratingNum} testID="own-rating">{player.gameRating.toFixed(1)}</Text>
          <View style={{ height: 4, width: 100, backgroundColor: C.lime, marginTop: 4 }} />
          <Text style={styles.statusLabel}>{(player.gameRatingStatus || "estimated").toUpperCase()}</Text>
          {sparkDelta !== 0 && (
            <Text style={[styles.trend, { color: deltaPositive ? C.win : C.loss }]}>
              {deltaPositive ? "▲" : "▼"} {Math.abs(sparkDelta).toFixed(1)} RECENT
            </Text>
          )}
        </View>

        {/* Rank band */}
        {player.communityRank && (
          <View style={styles.rankBand}>
            <Text style={styles.rankBandText}>#{player.communityRank} IN NORTH GOA PADEL</Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statStrip}>
          <StatChip bg={C.white} value={String(player.matchesPlayed)} label="MATCHES" />
          <View style={styles.div} />
          <StatChip bg={C.lime} value={String(player.wins)} label="WINS" />
          <View style={styles.div} />
          <StatChip bg={C.coral} valueColor={C.white} value={String(player.losses)} label="LOSSES" />
          <View style={styles.div} />
          <StatChip bg={C.white} value={`${winRate}%`} label="WIN RATE" />
        </View>

        {/* Sparkline */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Heading size={11}>RATING TREND</Heading>
          <View style={styles.chartCard}>
            {history.length >= 2 ? (
              <Svg width="100%" height={70} viewBox="0 0 320 60" preserveAspectRatio="none">
                <Polyline points={sparkPoints} fill="none" stroke={C.lime} strokeWidth={3} />
              </Svg>
            ) : (
              <Body size={11} color={C.grey}>Not enough match data yet.</Body>
            )}
          </View>
        </View>

        {/* Radar */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Heading size={11}>SHOT COMFORT</Heading>
            <TouchableOpacity
              testID="rate-shots-entry"
              onPress={() => router.push("/profile/shots")}
              style={{ paddingVertical: 4, paddingHorizontal: 8 }}
            >
              <Text style={{ fontFamily: F.mono, fontSize: 10, color: C.blue, letterSpacing: 1.4 }}>
                RATE YOUR SHOTS →
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chartCard}>
            <RadarChart data={radar} />
          </View>
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
          <OutlineButton testID="sign-out" label="SIGN OUT (DEV)" onPress={async () => { await signOut(); router.replace("/onboarding/identity"); }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RadarChart({ data }: { data: { key: string; label: string; value: number }[] }) {
  const SIZE = 220, CX = SIZE / 2, CY = SIZE / 2, R = 80;
  const n = data.length;
  const points = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const radius = (Math.max(0, Math.min(5, d.value)) / 5) * R;
    return `${CX + Math.cos(angle) * radius},${CY + Math.sin(angle) * radius}`;
  }).join(" ");
  const grid = [1, 2, 3, 4, 5].map((step) => {
    return data.map((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const radius = (step / 5) * R;
      return `${CX + Math.cos(angle) * radius},${CY + Math.sin(angle) * radius}`;
    }).join(" ");
  });
  return (
    <Svg width="100%" height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      {grid.map((pts, i) => (
        <Polygon key={i} points={pts} fill="none" stroke={C.border} strokeWidth={1} />
      ))}
      {data.map((d, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const x = CX + Math.cos(angle) * R;
        const y = CY + Math.sin(angle) * R;
        return <Line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke={C.border} strokeWidth={1} />;
      })}
      <Polygon points={points} fill={C.lime} fillOpacity={0.45} stroke={C.ink} strokeWidth={2} />
      {data.map((d, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const lx = CX + Math.cos(angle) * (R + 18);
        const ly = CY + Math.sin(angle) * (R + 18);
        return (
          <SvgText key={d.key} x={lx} y={ly} fontFamily={F.mono} fontSize={9} fill={C.ink} textAnchor="middle">
            {d.label}
          </SvgText>
        );
      })}
    </Svg>
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
  ratingBlock: {
    alignItems: "center", paddingVertical: 28,
    backgroundColor: C.cream,
    borderBottomWidth: BORDER, borderBottomColor: C.ink,
  },
  ratingNum: { fontFamily: F.ub900, fontSize: 88, color: C.ink, letterSpacing: -3, lineHeight: 92, marginTop: 6 },
  statusLabel: { fontFamily: F.mono, fontSize: 9, color: C.grey, marginTop: 10, letterSpacing: 1.6 },
  trend: { fontFamily: F.mono, fontSize: 11, marginTop: 4, letterSpacing: 1 },
  rankBand: { backgroundColor: C.purple, paddingVertical: 12, alignItems: "center", borderBottomWidth: BORDER, borderColor: C.ink },
  rankBandText: { fontFamily: F.ub900, fontSize: 16, color: C.white, letterSpacing: -0.4 },
  statStrip: { flexDirection: "row", backgroundColor: C.ink },
  div: { width: BORDER, backgroundColor: C.ink },
  chartCard: { backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, padding: 12, marginTop: 8 },
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
