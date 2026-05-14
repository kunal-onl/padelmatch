// Game Detail screen.
import React, { useCallback, useEffect, useState } from "react";
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, OutlineButton, MicroLabel, Heading, Avatar, Body } from "../../lib/ui";
import { api } from "../../lib/api";
import { usePlayer } from "../../lib/context";
import { formatDate } from "../../lib/utils";

export default function GameDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { player } = usePlayer();
  const [game, setGame] = useState<any>(null);
  const [venue, setVenue] = useState<any>(null);
  const [playersById, setPlayersById] = useState<Record<string, any>>({});
  const [reasons, setReasons] = useState<{ label: string | null; reasons: string[] }>({ label: null, reasons: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const g = await api.getGame(String(id));
      setGame(g);
      const [venues, ps, recs] = await Promise.all([api.listVenues(), api.listPlayers(), api.recommendations(20)]);
      setVenue(venues.find((v: any) => v.id === g.venueId));
      setPlayersById(Object.fromEntries(ps.map((p: any) => [p.id, p])));
      const match = recs.find((r: any) => r.game.id === g.id);
      if (match) setReasons({ label: match.label, reasons: match.reasons });
    } catch {} finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const onJoin = async () => {
    try { setGame(await api.joinGame(String(id))); }
    catch {}
  };
  const onLeave = async () => {
    try { setGame(await api.leaveGame(String(id))); }
    catch {}
  };

  if (loading || !game || !venue) {
    return <SafeAreaView style={styles.safe}><ActivityIndicator color={C.ink} style={{ marginTop: 40 }} /></SafeAreaView>;
  }

  const court = venue.courts.find((c: any) => c.id === game.courtId);
  const slots = Array.from({ length: 4 }).map((_, i) => game.players[i] || null);
  const isIn = !!player && game.players.includes(player.id);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.back}>
        <TouchableOpacity onPress={() => router.back()} testID="gd-back">
          <Ionicons name="chevron-back" size={26} color={C.ink} />
        </TouchableOpacity>
      </View>

      <View style={styles.venueHeader}>
        <Text style={styles.venueName}>{venue.name.toUpperCase()}</Text>
        <Text style={styles.venueSub}>{court?.name?.toUpperCase()} · {venue.area.toUpperCase()}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {/* stat row */}
        <View style={styles.statRow}>
          <View style={styles.statCol}><MicroLabel>DATE</MicroLabel><Text style={styles.statVal}>{formatDate(game.date)}</Text></View>
          <View style={[styles.statCol, styles.statColMid]}><MicroLabel>TIME</MicroLabel><Text style={styles.statVal}>{game.startTime}–{game.endTime}</Text></View>
          <View style={styles.statCol}><MicroLabel>SKILL</MicroLabel><Text style={styles.statVal}>{game.skillLabel.toUpperCase()}</Text></View>
        </View>

        {reasons.label && (
          <View style={styles.matchBanner}>
            <Text style={styles.matchBannerTitle}>⚡ {reasons.label}</Text>
            {reasons.reasons.map((r, i) => (
              <Text key={i} style={styles.matchBannerLine}>· {r}</Text>
            ))}
          </View>
        )}

        <Heading size={11} style={{ marginTop: 18, marginBottom: 10 }}>PLAYERS</Heading>
        <View style={styles.grid2x2}>
          {slots.map((pid: string | null, i: number) => {
            const p = pid ? playersById[pid] : null;
            return (
              <View key={i} style={styles.slot}>
                {p ? (
                  <>
                    <Avatar name={p.name} size={48} />
                    <Text style={styles.slotName} numberOfLines={1}>{p.name.toUpperCase()}</Text>
                    <Text style={styles.slotRating}>{p.gameRating.toFixed(1)}</Text>
                    {p.id === game.hostId && (
                      <View style={styles.hostBadge}>
                        <Ionicons name="star" size={10} color={C.ink} />
                        <Text style={styles.hostBadgeText}>HOST</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.empty}>
                    <Ionicons name="add" size={26} color={C.grey} />
                    <Text style={{ fontFamily: F.mono, fontSize: 9, color: C.grey, letterSpacing: 1.2, marginTop: 4 }}>OPEN SPOT</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ marginTop: 18 }}>
          {isIn ? (
            <SplitCTA testID="leave-game" label="YOU'RE IN  ·  TAP TO LEAVE" onPress={onLeave} filledColor={C.lime} arrowIcon="close" />
          ) : (
            <SplitCTA testID="join-game" label={`JOIN GAME (${4 - game.players.length} SPOT${game.players.length === 3 ? "" : "S"})`} onPress={onJoin} disabled={game.players.length >= 4} />
          )}
        </View>

        <View style={{ marginTop: 12 }}>
          <OutlineButton testID="hudle-link" label="BOOK COURT ON HUDLE" rightIcon="open-outline" onPress={() => Linking.openURL(venue.hudleUrl)} />
        </View>

        <View style={{ marginTop: 16 }}>
          <Body size={11} color={C.grey}>Share link: {game.shareLink}</Body>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  back: { paddingHorizontal: 12, paddingVertical: 8 },
  venueHeader: { backgroundColor: C.coral, paddingHorizontal: 16, paddingVertical: 18, borderBottomWidth: BORDER, borderBottomColor: C.ink },
  venueName: { fontFamily: F.ub900, color: C.white, fontSize: 24, letterSpacing: -1 },
  venueSub: { fontFamily: F.mono, color: C.lime, fontSize: 10, letterSpacing: 1.6, marginTop: 4 },
  statRow: {
    flexDirection: "row", borderWidth: BORDER, borderColor: C.ink, backgroundColor: C.cream,
  },
  statCol: { flex: 1, padding: 12 },
  statColMid: { borderLeftWidth: BORDER, borderRightWidth: BORDER, borderColor: C.ink },
  statVal: { fontFamily: F.ub700, fontSize: 12, color: C.ink, marginTop: 4 },
  matchBanner: { backgroundColor: C.lime, padding: 12, marginTop: 14, borderWidth: BORDER, borderColor: C.ink },
  matchBannerTitle: { fontFamily: F.ub900, fontSize: 12, color: C.ink, marginBottom: 6, letterSpacing: 0.4 },
  matchBannerLine: { fontFamily: F.sans, fontSize: 11, color: C.ink, lineHeight: 16 },
  grid2x2: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  slot: {
    width: "50%", aspectRatio: 1.1, padding: 4,
  },
  empty: {
    flex: 1, backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center",
  },
  slotName: { fontFamily: F.ub700, fontSize: 11, color: C.ink, marginTop: 8, letterSpacing: -0.3 },
  slotRating: { fontFamily: F.mono, fontSize: 13, color: C.lime, backgroundColor: C.ink, paddingHorizontal: 6, marginTop: 4 },
  hostBadge: { flexDirection: "row", alignItems: "center", backgroundColor: C.lime, paddingHorizontal: 6, paddingVertical: 2, marginTop: 6, borderWidth: 1, borderColor: C.ink },
  hostBadgeText: { fontFamily: F.ub700, fontSize: 8, color: C.ink, letterSpacing: 0.6, marginLeft: 2 },
});

// Apply: slot containers should be full cards (white + 2px border) for filled ones.
// We override with a derived style above; ensure visual consistency:
const _slotBase = StyleSheet.create({
  filled: { flex: 1, backgroundColor: C.cream, borderWidth: BORDER, borderColor: C.ink, alignItems: "center", justifyContent: "center", padding: 8 },
});
// (Not used – simplified visual structure inline.)
