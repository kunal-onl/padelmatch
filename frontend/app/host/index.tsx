// Game Journey Rework — "Host a Game" flow (Jun 2026).
//
// Replaces the old `create.tsx` 3-step compose. New flow:
//   Step 1 — When & Where (date / time window / venue preference / type)
//   Step 2 — Availability gate (call the finder, host picks a concrete slot)
//   Step 3 — Skill range
//   Step 4 — Invite list + cascade window + pre-confirm + post-public
//   Step 5 — Preview & publish
//
// Routes through POST /api/games which spawns the cascade automatically.
// `skillLabel` is derived server-side now.
import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput, Switch, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, Pill, MicroLabel, Heading, Body } from "../../lib/ui";
import { OnboardingHeader } from "../../lib/onboarding-header";
import { api, getCurrentPlayerId } from "../../lib/api";

const DURATIONS = [60, 75, 90, 120];
const WINDOWS = [
  { val: 1, label: "1 MIN" },
  { val: 15, label: "15 MIN" },
  { val: 60, label: "1 HOUR" },
  { val: 60 * 24, label: "MANUAL" },
];

function nextDateFor(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}

function shortDay(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }).toUpperCase();
}

function endFor(start: string, durMin: number): string {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + durMin;
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
}

export default function HostGame() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1
  const [dayOffset, setDayOffset] = useState(2);
  const [startTime, setStartTime] = useState("18:00");
  const [duration, setDuration] = useState(90);
  const [gameType, setGameType] = useState<"competitive" | "social">("competitive");

  // Step 2 — availability
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [availability, setAvailability] = useState<any | null>(null);
  const [pickedVenueId, setPickedVenueId] = useState<string | null>(null);
  const [pickedHudleUrl, setPickedHudleUrl] = useState<string | null>(null);

  // Step 3 — skill
  const [skillMin, setSkillMin] = useState(4.5);
  const [skillMax, setSkillMax] = useState(6.5);

  // Step 4 — invites
  const [players, setPlayers] = useState<any[]>([]);
  const [me, setMe] = useState<string>("kunal");
  const [inviteList, setInviteList] = useState<string[]>([]);
  const [preConfirm, setPreConfirm] = useState<Record<string, boolean>>({});
  const [cascadeWindow, setCascadeWindow] = useState(1);
  const [postedToPublic, setPostedToPublic] = useState(false);

  // Step 5 — publish
  const [publishing, setPublishing] = useState(false);

  const date = nextDateFor(dayOffset);
  const endTime = endFor(startTime, duration);

  useEffect(() => {
    getCurrentPlayerId().then((id) => id && setMe(id));
    api.listPlayers().then((list) => setPlayers(list.filter((p: any) => p.status === "active")));
  }, []);

  const runAvailability = async () => {
    setLoadingAvail(true);
    setAvailability(null);
    setPickedVenueId(null);
    setPickedHudleUrl(null);
    try {
      const r = await api.availabilityCheck(date, startTime, endTime, false);
      setAvailability(r);
    } catch (e: any) {
      Alert.alert("Couldn't check availability", String(e?.message || e));
    } finally {
      setLoadingAvail(false);
    }
  };

  const publish = async () => {
    if (!pickedVenueId) return Alert.alert("Pick a venue", "Choose an available slot first.");
    setPublishing(true);
    try {
      const preConfirmIds = Object.keys(preConfirm).filter((k) => preConfirm[k]);
      const cleanInvites = inviteList.filter((id) => !preConfirmIds.includes(id) && id !== me);
      const venue = (availability?.options || []).find((o: any) => o.venueId === pickedVenueId);
      const game = await api.createGame({
        hostId: me,
        venueId: pickedVenueId,
        courtId: `${pickedVenueId}-1`,
        date, startTime, endTime,
        skillLevelMin: skillMin,
        skillLevelMax: skillMax,
        gameType,
        inviteList: cleanInvites,
        preConfirmIds,
        cascadeWindowMinutes: cascadeWindow,
        availabilitySnapshot: availability,
        postedToPublic,
      });
      router.replace({ pathname: "/games/[id]", params: { id: game.id } } as any);
    } catch (e: any) {
      Alert.alert("Couldn't publish game", String(e?.message || e));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <OnboardingHeader step={step} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <View style={{ marginBottom: 12 }}>
          <Heading size={22}>HOST A GAME</Heading>
          <Body size={11} color={C.grey}>STEP {step} OF 5</Body>
        </View>

        {/* ─────────────── Step 1 — When & Where ─────────────── */}
        {step === 1 && (
          <>
            <MicroLabel style={{ marginTop: 6 }}>WHEN</MicroLabel>
            <View style={styles.row}>
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <Pill key={d} label={shortDay(nextDateFor(d))} active={dayOffset === d}
                      onPress={() => setDayOffset(d)} small />
              ))}
            </View>
            <MicroLabel style={{ marginTop: 14 }}>START</MicroLabel>
            <View style={styles.row}>
              {["06:00", "07:00", "08:00", "17:00", "18:00", "19:00", "20:00"].map((t) => (
                <Pill key={t} label={t} active={startTime === t} onPress={() => setStartTime(t)} small />
              ))}
            </View>
            <MicroLabel style={{ marginTop: 14 }}>DURATION</MicroLabel>
            <View style={styles.row}>
              {DURATIONS.map((d) => (
                <Pill key={d} label={`${d} MIN`} active={duration === d}
                      onPress={() => setDuration(d)} small />
              ))}
            </View>
            <MicroLabel style={{ marginTop: 14 }}>TYPE</MicroLabel>
            <View style={styles.row}>
              <Pill label="COMPETITIVE" active={gameType === "competitive"}
                    onPress={() => setGameType("competitive")} activeColor={C.lime} />
              <Pill label="SOCIAL" active={gameType === "social"}
                    onPress={() => setGameType("social")} activeColor={C.purple} />
            </View>
            <Body size={10} color={C.grey} style={{ marginTop: 6 }}>
              {gameType === "competitive"
                ? "Scores affect your skill rating."
                : "Scores recorded · rating unaffected."}
            </Body>
            <View style={{ height: 24 }} />
            <SplitCTA label="CHECK AVAILABILITY →" onPress={() => { setStep(2); runAvailability(); }} />
          </>
        )}

        {/* ─────────────── Step 2 — Availability ─────────────── */}
        {step === 2 && (
          <>
            <Body size={12} color={C.grey} style={{ marginBottom: 12 }}>
              {date.toUpperCase()} · {startTime}–{endTime}
            </Body>
            {loadingAvail && (
              <View style={styles.loaderBlock}>
                <ActivityIndicator size="large" color={C.ink} />
                <Text style={styles.loaderText}>CHECKING 8 VENUES…</Text>
                <Body size={11} color={C.grey} style={{ marginTop: 6 }}>~40 SEC</Body>
              </View>
            )}
            {!loadingAvail && availability && (
              <>
                <MicroLabel>AVAILABLE VENUES ({availability.source.toUpperCase()})</MicroLabel>
                {availability.options.filter((o: any) => o.available).map((o: any) => (
                  <TouchableOpacity key={o.venueId} onPress={() => { setPickedVenueId(o.venueId); setPickedHudleUrl(o.hudleUrl); }}
                                    activeOpacity={0.85}
                                    style={[styles.availCard, pickedVenueId === o.venueId && styles.availCardSel]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.availName}>{o.venueName.toUpperCase()}</Text>
                      <Text style={styles.availMeta}>{o.location?.toUpperCase()} · ₹{o.price ?? "?"}</Text>
                    </View>
                    {pickedVenueId === o.venueId
                      ? <Ionicons name="checkmark" size={22} color={C.lime} />
                      : <Ionicons name="add" size={20} color={C.grey} />}
                  </TouchableOpacity>
                ))}
                <MicroLabel style={{ marginTop: 16 }}>UNAVAILABLE</MicroLabel>
                {availability.options.filter((o: any) => !o.available).map((o: any) => (
                  <View key={o.venueId} style={styles.availCardDim}>
                    <Text style={[styles.availName, { color: C.grey }]}>{o.venueName.toUpperCase()}</Text>
                    <Text style={styles.availMeta}>FULL</Text>
                  </View>
                ))}
                <TouchableOpacity onPress={runAvailability} style={styles.refreshBtn}>
                  <Ionicons name="refresh" size={16} color={C.ink} />
                  <Text style={styles.refreshTxt}>REFRESH</Text>
                </TouchableOpacity>
              </>
            )}
            <View style={{ height: 24 }} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <SplitCTA label="← BACK" onPress={() => setStep(1)} filledColor={C.white} arrowIcon="arrow-back" />
              </View>
              <View style={{ flex: 2 }}>
                <SplitCTA label="NEXT →" onPress={() => setStep(3)} disabled={!pickedVenueId} />
              </View>
            </View>
          </>
        )}

        {/* ─────────────── Step 3 — Skill ─────────────── */}
        {step === 3 && (
          <>
            <MicroLabel>SKILL RANGE</MicroLabel>
            <View style={styles.skillRow}>
              <View style={styles.stepBox}>
                <Text style={styles.stepLbl}>MIN</Text>
                <View style={styles.stepCtrl}>
                  <TouchableOpacity onPress={() => setSkillMin(Math.max(1, +(skillMin - 0.5).toFixed(1)))}>
                    <Ionicons name="remove" size={20} color={C.ink} />
                  </TouchableOpacity>
                  <Text style={styles.stepVal}>{skillMin.toFixed(1)}</Text>
                  <TouchableOpacity onPress={() => setSkillMin(Math.min(skillMax - 0.5, +(skillMin + 0.5).toFixed(1)))}>
                    <Ionicons name="add" size={20} color={C.ink} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.stepBox}>
                <Text style={styles.stepLbl}>MAX</Text>
                <View style={styles.stepCtrl}>
                  <TouchableOpacity onPress={() => setSkillMax(Math.max(skillMin + 0.5, +(skillMax - 0.5).toFixed(1)))}>
                    <Ionicons name="remove" size={20} color={C.ink} />
                  </TouchableOpacity>
                  <Text style={styles.stepVal}>{skillMax.toFixed(1)}</Text>
                  <TouchableOpacity onPress={() => setSkillMax(Math.min(10, +(skillMax + 0.5).toFixed(1)))}>
                    <Ionicons name="add" size={20} color={C.ink} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <Body size={11} color={C.grey} style={{ marginTop: 8 }}>
              Label is computed server-side from the range.
            </Body>
            <View style={{ height: 24 }} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <SplitCTA label="← BACK" onPress={() => setStep(2)} filledColor={C.white} arrowIcon="arrow-back" />
              </View>
              <View style={{ flex: 2 }}>
                <SplitCTA label="NEXT →" onPress={() => setStep(4)} />
              </View>
            </View>
          </>
        )}

        {/* ─────────────── Step 4 — Invites ─────────────── */}
        {step === 4 && (
          <>
            <MicroLabel>RESPONSE WINDOW</MicroLabel>
            <View style={styles.row}>
              {WINDOWS.map((w) => (
                <Pill key={w.val} label={w.label} active={cascadeWindow === w.val}
                      onPress={() => setCascadeWindow(w.val)} small />
              ))}
            </View>

            <MicroLabel style={{ marginTop: 14 }}>INVITE QUEUE — TAP TO ADD</MicroLabel>
            <Body size={10} color={C.grey}>One invite at a time. Order matters.</Body>
            <View style={{ marginTop: 8 }}>
              {players.filter((p) => p.id !== me).slice(0, 20).map((p) => {
                const queued = inviteList.indexOf(p.id);
                const isPre = !!preConfirm[p.id];
                return (
                  <View key={p.id} style={styles.invRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.invName}>{p.name.toUpperCase()}</Text>
                      <Text style={styles.invMeta}>R: {(p.gameRating || 5).toFixed(1)}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setPreConfirm((x) => ({ ...x, [p.id]: !x[p.id] }))}
                      style={[styles.preBtn, isPre && { backgroundColor: C.purple }]}
                    >
                      <Text style={[styles.preTxt, isPre && { color: C.white }]}>PRE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        if (isPre) return;
                        setInviteList((q) => q.includes(p.id) ? q.filter((x) => x !== p.id) : [...q, p.id]);
                      }}
                      style={[styles.qBtn, queued >= 0 && { backgroundColor: C.lime }]}
                    >
                      <Text style={styles.qTxt}>{queued >= 0 ? `${queued + 1}` : "+"}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            <View style={styles.publicRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.invName}>POST TO PUBLIC FEED</Text>
                <Body size={10} color={C.grey}>Anyone eligible can join, first-come.</Body>
              </View>
              <Switch value={postedToPublic} onValueChange={setPostedToPublic}
                      trackColor={{ false: C.grey, true: C.lime }} thumbColor={C.ink} />
            </View>

            <View style={{ height: 24 }} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <SplitCTA label="← BACK" onPress={() => setStep(3)} filledColor={C.white} arrowIcon="arrow-back" />
              </View>
              <View style={{ flex: 2 }}>
                <SplitCTA label="PREVIEW →" onPress={() => setStep(5)} />
              </View>
            </View>
          </>
        )}

        {/* ─────────────── Step 5 — Publish ─────────────── */}
        {step === 5 && (
          <>
            <View style={styles.previewCard}>
              <View style={[styles.previewBand, { backgroundColor: C.blue }]} />
              <View style={{ padding: 14 }}>
                <Text style={styles.previewVenue}>
                  {(availability?.options || []).find((o: any) => o.venueId === pickedVenueId)?.venueName?.toUpperCase()}
                </Text>
                <Body size={11} color={C.grey} style={{ marginTop: 4 }}>
                  {shortDay(date)} · {startTime}–{endTime}
                </Body>
                <Body size={11} color={C.grey} style={{ marginTop: 4 }}>
                  RANGE {skillMin.toFixed(1)}–{skillMax.toFixed(1)} · {gameType.toUpperCase()}
                </Body>
                <Body size={10} color={C.grey} style={{ marginTop: 8 }}>
                  Pre-confirmed: {Object.keys(preConfirm).filter((k) => preConfirm[k]).length} · Invite queue: {inviteList.filter((id) => !preConfirm[id]).length}
                </Body>
                <Body size={10} color={C.grey}>
                  Response window: {cascadeWindow >= 60 * 24 ? "manual" : `${cascadeWindow} min`} · Public: {postedToPublic ? "YES" : "no"}
                </Body>
              </View>
            </View>
            <View style={{ height: 24 }} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <SplitCTA label="← BACK" onPress={() => setStep(4)} filledColor={C.white} arrowIcon="arrow-back" />
              </View>
              <View style={{ flex: 2 }}>
                <SplitCTA testID="host-publish-cta" label={publishing ? "PUBLISHING…" : "PUBLISH GAME →"}
                         onPress={publish} disabled={publishing} />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  loaderBlock: { alignItems: "center", paddingVertical: 32 },
  loaderText: { fontFamily: F.ub900, fontSize: 14, letterSpacing: 1.4, color: C.ink, marginTop: 10 },
  availCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink,
    paddingHorizontal: 14, paddingVertical: 14, marginTop: 8,
  },
  availCardSel: { borderWidth: 3 },
  availCardDim: {
    backgroundColor: "rgba(0,0,0,0.04)", borderWidth: 1, borderColor: "rgba(0,0,0,0.2)",
    padding: 12, marginTop: 6,
  },
  availName: { fontFamily: F.ub900, fontSize: 14, letterSpacing: -0.3, color: C.ink },
  availMeta: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.4, color: C.grey, marginTop: 2 },
  refreshBtn: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start",
                marginTop: 12, paddingHorizontal: 10, paddingVertical: 6,
                borderWidth: 1.5, borderColor: C.ink },
  refreshTxt: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.4, color: C.ink, marginLeft: 4 },
  skillRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  stepBox: { flex: 1, borderWidth: BORDER, borderColor: C.ink, backgroundColor: C.white, padding: 12 },
  stepLbl: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.6, color: C.grey },
  stepCtrl: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  stepVal: { fontFamily: F.ub900, fontSize: 28, color: C.ink },
  invRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderColor: "#00000010",
            paddingVertical: 10 },
  invName: { fontFamily: F.ub900, fontSize: 13, letterSpacing: -0.2, color: C.ink },
  invMeta: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.grey, marginTop: 2 },
  preBtn: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1.5, borderColor: C.purple, marginRight: 6 },
  preTxt: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.4, color: C.purple },
  qBtn: { width: 36, height: 36, borderWidth: 1.5, borderColor: C.ink,
          alignItems: "center", justifyContent: "center" },
  qTxt: { fontFamily: F.ub900, fontSize: 14, color: C.ink },
  publicRow: { flexDirection: "row", alignItems: "center", marginTop: 14,
               borderTopWidth: 1, borderColor: "#00000020", paddingTop: 14 },
  previewCard: { backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink },
  previewBand: { height: 6 },
  previewVenue: { fontFamily: F.ub900, fontSize: 18, letterSpacing: -0.4, color: C.ink },
});
