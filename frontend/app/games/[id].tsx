// Game Detail screen.
import React, { useCallback, useEffect, useState } from "react";
import { View, ScrollView, Text, TextInput, StyleSheet, TouchableOpacity, Linking, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, OutlineButton, MicroLabel, Heading, Avatar, Body } from "../../lib/ui";
import { api } from "../../lib/api";
import { usePlayer } from "../../lib/context";
import { formatDate } from "../../lib/utils";

// Game Journey Rework (Feb 2026): status vocab is PLANNING / NEEDS_COURT /
// CONFIRMED / PLAYED / SCORED / CANCELLED. CONFIRMED here means "booked".
const STATE_STEPS = ["PLANNING", "NEEDS_COURT", "CONFIRMED", "PLAYED", "SCORED"] as const;
const STATE_LABELS: Record<string, string> = {
  PLANNING: "PLANNING",
  NEEDS_COURT: "NEEDS COURT",
  CONFIRMED: "CONFIRMED",
  PLAYED: "PLAYED",
  SCORED: "SCORED",
};

function StateStrip({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return (
      <View style={[ssStyles.row, { backgroundColor: C.coral }]}>
        <Text style={ssStyles.cancelledText}>CANCELLED</Text>
      </View>
    );
  }
  const currentIdx = STATE_STEPS.indexOf(status as any);
  return (
    <View style={ssStyles.row}>
      {STATE_STEPS.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <View key={s} style={ssStyles.stepWrap}>
            <View
              style={[
                ssStyles.dot,
                active && { backgroundColor: C.lime, borderColor: C.ink },
                done && { backgroundColor: C.ink, borderColor: C.ink },
              ]}
            />
            <Text style={[ssStyles.label, (active || done) && { color: C.ink }]} numberOfLines={1}>
              {STATE_LABELS[s]}
            </Text>
            {i < STATE_STEPS.length - 1 && (
              <View style={[ssStyles.connector, (i < currentIdx) && { backgroundColor: C.ink }]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const ssStyles = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "flex-start",
    paddingVertical: 14, paddingHorizontal: 12,
    borderWidth: BORDER, borderColor: C.ink, backgroundColor: C.white,
    marginBottom: 14,
  },
  stepWrap: { flex: 1, alignItems: "center", position: "relative" },
  dot: {
    width: 14, height: 14, borderRadius: 999,
    borderWidth: 2, borderColor: C.ink, backgroundColor: C.white, marginBottom: 6,
  },
  label: { fontFamily: F.ub900, fontSize: 8, color: C.grey, letterSpacing: 0.6, textAlign: "center" },
  connector: { position: "absolute", top: 6, right: "-50%", width: "100%", height: 2, backgroundColor: C.cream },
  cancelledText: { flex: 1, fontFamily: F.ub900, color: C.white, fontSize: 13, letterSpacing: 1.4, textAlign: "center" },
});

export default function GameDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { player } = usePlayer();
  const [game, setGame] = useState<any>(null);
  const [venue, setVenue] = useState<any>(null);
  const [playersById, setPlayersById] = useState<Record<string, any>>({});
  const [reasons, setReasons] = useState<{ label: string | null; reasons: string[] }>({ label: null, reasons: [] });
  const [loading, setLoading] = useState(true);
  const [bookingInput, setBookingInput] = useState("");
  const [showBookInput, setShowBookInput] = useState(false);

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
  const isHost = !!player && game.hostId === player.id;

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
        <StateStrip status={game.status || "PLANNING"} />

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
          {/* ── Join / Leave (only when PLANNING — roster open) ──────── */}
          {game.status === "PLANNING" && (
            isIn ? (
              <SplitCTA testID="leave-game" label="YOU'RE IN  ·  TAP TO LEAVE" onPress={onLeave} filledColor={C.lime} arrowIcon="close" />
            ) : (
              <SplitCTA testID="join-game" label={`JOIN GAME (${4 - game.players.length} SPOT${game.players.length === 3 ? "" : "S"})`} onPress={onJoin} disabled={game.players.length >= 4} />
            )
          )}

          {/* ── NEEDS_COURT: host books, others wait ─────────────────── */}
          {game.status === "NEEDS_COURT" && isHost && (
            <View style={styles.actionBlock}>
              <Text style={styles.actionTitle}>COURT NOT YET BOOKED</Text>
              <Body size={11} color={C.grey} style={{ marginTop: 4 }}>
                4 players confirmed. Book a court and paste the link back here.
              </Body>
              <View style={{ height: 12 }} />
              <OutlineButton testID="book-on-hudle" label="BOOK ON HUDLE →" rightIcon="open-outline" onPress={() => Linking.openURL(venue.hudleUrl)} />
              <View style={{ height: 10 }} />
              {!showBookInput ? (
                <SplitCTA testID="mark-as-booked" label="MARK AS BOOKED" onPress={() => setShowBookInput(true)} />
              ) : (
                <View>
                  <MicroLabel style={{ marginBottom: 6 }}>PASTE HUDLE BOOKING LINK</MicroLabel>
                  <TextInput
                    testID="hudle-booking-input"
                    value={bookingInput}
                    onChangeText={setBookingInput}
                    placeholder="https://hudle.in/bookings/..."
                    placeholderTextColor={C.grey}
                    autoCapitalize="none"
                    style={styles.bookInput}
                  />
                  <View style={{ height: 8 }} />
                  <SplitCTA
                    testID="confirm-booking"
                    label="SAVE BOOKING"
                    disabled={!bookingInput.trim()}
                    onPress={async () => {
                      try {
                        const updated = await api.bookGame(game.id, bookingInput.trim());
                        setGame(updated);
                        setShowBookInput(false);
                      } catch (e: any) {
                        Alert.alert("Couldn't save", e.message ?? "Try again");
                      }
                    }}
                  />
                </View>
              )}
            </View>
          )}
          {game.status === "NEEDS_COURT" && !isHost && (
            <View style={styles.actionBlock}>
              <Text style={styles.actionTitle}>WAITING FOR HOST TO BOOK COURT</Text>
              <Body size={11} color={C.grey} style={{ marginTop: 4 }}>
                {playersById[game.hostId]?.name?.toUpperCase() || "HOST"} will reserve a court on Hudle and share the link here.
              </Body>
            </View>
          )}

          {/* ── CONFIRMED: court booked, link visible to all ─────────── */}
          {game.status === "CONFIRMED" && (
            <View style={[styles.actionBlock, { backgroundColor: C.ink }]}>
              <Text style={[styles.actionTitle, { color: C.lime }]}>COURT BOOKED ✓</Text>
              <Body size={11} color="rgba(255,255,255,0.7)" style={{ marginTop: 4 }}>
                See you at {venue?.name?.toUpperCase()}. Cancellations are at the host's discretion.
              </Body>
              <View style={{ height: 12 }} />
              {!!game.hudleBookingUrl && (
                <OutlineButton
                  testID="view-booking"
                  label="VIEW BOOKING →"
                  rightIcon="open-outline"
                  onPress={() => Linking.openURL(game.hudleBookingUrl)}
                />
              )}
            </View>
          )}

          {/* ── PLAYED / SCORED ──────────────────────────────────────── */}
          {game.status === "PLAYED" && isIn && (
            <View style={styles.actionBlock}>
              <Text style={styles.actionTitle}>HOW DID IT GO?</Text>
              <Body size={11} color={C.grey} style={{ marginTop: 4 }}>
                Enter scores, write a quick reflection, and rate your partners.
              </Body>
              <View style={{ height: 12 }} />
              <SplitCTA testID="open-postmatch" label="OPEN POST-MATCH" onPress={() => router.push("/(tabs)/home")} />
            </View>
          )}
          {game.status === "SCORED" && (
            <View style={[styles.actionBlock, { backgroundColor: C.cream }]}>
              <Text style={styles.actionTitle}>SCORED · {game.gameType === "social" ? "SOCIAL" : "RANKED"}</Text>
              <Body size={11} color={C.grey} style={{ marginTop: 4 }}>
                Match recorded.{game.gameType === "social" ? " Ratings unchanged." : " Ratings updated."}
              </Body>
            </View>
          )}

          {/* ── Host cancel (any state except CANCELLED) ─────────────── */}
          {isHost && game.status !== "CANCELLED" && game.status !== "SCORED" && (
            <TouchableOpacity
              testID="cancel-game"
              onPress={() =>
                Alert.alert("Cancel game?", "All confirmed players will be notified.", [
                  { text: "Keep", style: "cancel" },
                  {
                    text: "Cancel",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        const updated = await api.cancelGame(game.id);
                        setGame(updated);
                      } catch (e: any) {
                        Alert.alert("Couldn't cancel", e.message ?? "Try again");
                      }
                    },
                  },
                ])
              }
              style={{ marginTop: 16, alignItems: "center" }}
            >
              <Text style={{ fontFamily: F.mono, fontSize: 10, color: C.coral, letterSpacing: 1.4 }}>
                CANCEL GAME
              </Text>
            </TouchableOpacity>
          )}
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
  venueHeader: { backgroundColor: C.blue, paddingHorizontal: 16, paddingVertical: 18, borderBottomWidth: BORDER, borderBottomColor: C.ink },
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
  actionBlock: {
    padding: 14, backgroundColor: C.white,
    borderWidth: BORDER, borderColor: C.ink,
    marginTop: 10,
  },
  actionTitle: { fontFamily: F.ub900, fontSize: 13, color: C.ink, letterSpacing: 0.6 },
  bookInput: {
    paddingHorizontal: 12, paddingVertical: 12, minHeight: 44,
    borderWidth: BORDER, borderColor: C.ink, backgroundColor: C.cream,
    color: C.ink, fontFamily: F.mono, fontSize: 12,
  },
});

// Apply: slot containers should be full cards (white + 2px border) for filled ones.
// We override with a derived style above; ensure visual consistency:
const _slotBase = StyleSheet.create({
  filled: { flex: 1, backgroundColor: C.cream, borderWidth: BORDER, borderColor: C.ink, alignItems: "center", justifyContent: "center", padding: 8 },
});
// (Not used – simplified visual structure inline.)
