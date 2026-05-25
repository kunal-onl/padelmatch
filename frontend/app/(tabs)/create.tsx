// Create Game — 3 steps: Where, When, Preview & Share.
import React, { useEffect, useMemo, useState } from "react";
import {
  View, ScrollView, TouchableOpacity, Text, StyleSheet, Share, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, Heading, MicroLabel, Pill, OutlineButton, Body } from "../../lib/ui";
import { api } from "../../lib/api";
import { usePlayer } from "../../lib/context";
import { DAYS, rangeLabel, formatDate } from "../../lib/utils";

const DURATIONS = [60, 75, 90, 120];
const START_TIMES = ["06:00","06:30","07:00","07:30","08:00","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function nextDateFor(day: string): string {
  const idx = DAYS.findIndex((d) => d.key === day);
  const today = new Date();
  const todayIdx = (today.getDay() + 6) % 7; // Monday = 0
  const diff = (idx - todayIdx + 7) % 7 || 7;
  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export default function CreateGame() {
  const router = useRouter();
  const { player } = usePlayer();
  const [step, setStep] = useState(1);
  const [venues, setVenues] = useState<any[]>([]);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [courtId, setCourtId] = useState<string | null>(null);
  const [dayKey, setDayKey] = useState<string>(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1].key);
  const [startTime, setStartTime] = useState("18:00");
  const [duration, setDuration] = useState(90);
  const [minSkill, setMinSkill] = useState(5.0);
  const [maxSkill, setMaxSkill] = useState(7.5);
  const [created, setCreated] = useState<any>(null);

  useEffect(() => { api.listVenues().then(setVenues).catch(() => {}); }, []);

  const venue = useMemo(() => venues.find((v) => v.id === venueId), [venues, venueId]);
  const endTime = addMinutes(startTime, duration);
  const date = nextDateFor(dayKey);

  const onPickVenue = (id: string) => {
    setVenueId(id);
    const v = venues.find((x) => x.id === id);
    if (v && v.courts.length === 1) setCourtId(v.courts[0].id);
    else setCourtId(null);
  };

  const onCreate = async () => {
    if (!player || !venueId || !courtId) return;
    try {
      const g = await api.createGame({
        hostId: player.id,
        venueId, courtId, date, startTime, endTime,
        skillLevelMin: minSkill, skillLevelMax: maxSkill,
        skillLabel: rangeLabel(minSkill, maxSkill),
      });
      setCreated(g);
      setStep(3);
    } catch (e: any) {
      Alert.alert("Could not create", e.message ?? "Try again");
    }
  };

  const onShare = async () => {
    if (!created) return;
    try {
      await Share.share({ message: created.whatsappText });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Heading size={20}>CREATE GAME</Heading>
        <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={{ flex: 1, height: 6, backgroundColor: s <= step ? C.lime : "transparent", borderWidth: BORDER, borderColor: C.ink }} />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <>
            <MicroLabel style={{ marginBottom: 8 }}>WHERE</MicroLabel>
            {venues.map((v) => {
              const selected = v.id === venueId;
              return (
                <View key={v.id} style={{ marginBottom: 8 }}>
                  <TouchableOpacity
                    testID={`create-venue-${v.id}`}
                    onPress={() => onPickVenue(v.id)}
                    style={[styles.venueRow, selected && { backgroundColor: C.lime }]}
                  >
                    <View>
                      <Text style={{ fontFamily: F.ub700, fontSize: 13, color: C.ink }}>{v.name.toUpperCase()}</Text>
                      <Text style={{ fontFamily: F.mono, fontSize: 10, color: C.ink2, marginTop: 2 }}>{v.area.toUpperCase()}</Text>
                    </View>
                    <Text style={{ fontFamily: F.mono, fontSize: 10, color: C.ink2 }}>{v.courts.length} COURT{v.courts.length > 1 ? "S" : ""}</Text>
                  </TouchableOpacity>
                  {selected && v.courts.length > 1 && (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", padding: 8, backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, borderTopWidth: 0 }}>
                      {v.courts.map((c: any) => (
                        <View key={c.id} style={{ marginRight: 8, marginBottom: 8 }}>
                          <Pill testID={`create-court-${c.id}`} label={c.name.toUpperCase()} active={courtId === c.id} onPress={() => setCourtId(c.id)} />
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        {step === 2 && (
          <>
            <MicroLabel style={{ marginBottom: 8 }}>WHEN (NEXT)</MicroLabel>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              {DAYS.map((d) => (
                <TouchableOpacity
                  key={d.key}
                  testID={`create-day-${d.key}`}
                  onPress={() => setDayKey(d.key)}
                  style={[styles.dayBtn, dayKey === d.key && { backgroundColor: C.lime }]}
                >
                  <Text style={{ fontFamily: F.mono, fontSize: 10, color: C.ink }}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Body size={10} color={C.grey} style={{ marginTop: 6 }}>{formatDate(date)}</Body>

            <MicroLabel style={{ marginTop: 18, marginBottom: 8 }}>START TIME</MicroLabel>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {START_TIMES.map((t) => (
                <View key={t} style={{ marginRight: 6, marginBottom: 6 }}>
                  <Pill testID={`create-time-${t}`} label={t} active={startTime === t} onPress={() => setStartTime(t)} />
                </View>
              ))}
            </View>

            <MicroLabel style={{ marginTop: 18, marginBottom: 8 }}>DURATION (MIN)</MicroLabel>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {DURATIONS.map((d) => (
                <View key={d} style={{ marginRight: 6 }}>
                  <Pill testID={`create-dur-${d}`} label={`${d}`} active={duration === d} onPress={() => setDuration(d)} />
                </View>
              ))}
            </View>

            <MicroLabel style={{ marginTop: 18, marginBottom: 8 }}>SKILL RANGE</MicroLabel>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={[styles.stepBox, { backgroundColor: C.cream }]}>
                <Text style={styles.stepCaption}>MIN</Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity testID="min-down" onPress={() => setMinSkill((v) => Math.max(1, v - 0.5))} style={styles.miniBtn}><Text style={styles.miniBtnText}>−</Text></TouchableOpacity>
                  <Text style={styles.skillValue}>{minSkill.toFixed(1)}</Text>
                  <TouchableOpacity testID="min-up" onPress={() => setMinSkill((v) => Math.min(maxSkill - 0.5, v + 0.5))} style={styles.miniBtn}><Text style={styles.miniBtnText}>+</Text></TouchableOpacity>
                </View>
              </View>
              <View style={[styles.stepBox, { backgroundColor: C.cream }]}>
                <Text style={styles.stepCaption}>MAX</Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity testID="max-down" onPress={() => setMaxSkill((v) => Math.max(minSkill + 0.5, v - 0.5))} style={styles.miniBtn}><Text style={styles.miniBtnText}>−</Text></TouchableOpacity>
                  <Text style={styles.skillValue}>{maxSkill.toFixed(1)}</Text>
                  <TouchableOpacity testID="max-up" onPress={() => setMaxSkill((v) => Math.min(10, v + 0.5))} style={styles.miniBtn}><Text style={styles.miniBtnText}>+</Text></TouchableOpacity>
                </View>
              </View>
            </View>
            <Body size={10} color={C.grey} style={{ marginTop: 6 }}>
              {rangeLabel(minSkill, maxSkill)} ({minSkill.toFixed(1)}–{maxSkill.toFixed(1)})
            </Body>
          </>
        )}

        {step === 3 && created && (
          <>
            <MicroLabel style={{ marginBottom: 8 }}>PREVIEW</MicroLabel>
            <View style={styles.previewCard}>
              <View style={[styles.previewBand]}><Text style={styles.previewBandText}>{venue?.name.toUpperCase()}</Text></View>
              <View style={{ padding: 14 }}>
                <Text style={styles.previewDate}>{formatDate(created.date)} · {created.startTime}–{created.endTime}</Text>
                <Text style={styles.previewSkill}>{created.skillLabel.toUpperCase()} · {created.skillLevelMin}–{created.skillLevelMax}</Text>
                <Text style={styles.previewLink}>{created.shareLink}</Text>
                <View style={{ backgroundColor: C.cream, padding: 12, marginTop: 12, borderWidth: BORDER, borderColor: C.ink }}>
                  <Text style={{ fontFamily: F.mono, fontSize: 11, color: C.ink, lineHeight: 18 }}>{created.whatsappText}</Text>
                </View>
              </View>
            </View>
            <View style={{ height: 16 }} />
            <SplitCTA testID="share-whatsapp" label="SHARE TO WHATSAPP" onPress={onShare} arrowIcon="share-outline" />
          </>
        )}
      </ScrollView>

      <View style={{ padding: 16, flexDirection: "row", gap: 10 }}>
        {step > 1 && step !== 3 && (
          <View style={{ flex: 1 }}>
            <OutlineButton label="BACK" onPress={() => setStep((s) => s - 1)} testID="create-back" />
          </View>
        )}
        {step === 1 && (
          <View style={{ flex: 2 }}>
            <SplitCTA testID="create-next-1" label="NEXT" onPress={() => setStep(2)} disabled={!venueId || !courtId} />
          </View>
        )}
        {step === 2 && (
          <View style={{ flex: 2 }}>
            <SplitCTA testID="create-publish" label="PUBLISH GAME" onPress={onCreate} />
          </View>
        )}
        {step === 3 && (
          <View style={{ flex: 1 }}>
            <OutlineButton testID="create-done" label="DONE" onPress={() => { setStep(1); setCreated(null); setVenueId(null); setCourtId(null); router.push("/(tabs)/games"); }} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: BORDER, borderBottomColor: C.ink },
  venueRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 14, backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink,
  },
  dayBtn: {
    flex: 1, marginHorizontal: 2, paddingVertical: 12, alignItems: "center",
    borderWidth: BORDER, borderColor: C.ink, backgroundColor: C.white,
  },
  stepBox: { flex: 1, padding: 10, borderWidth: BORDER, borderColor: C.ink },
  stepCaption: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.4, color: C.grey, marginBottom: 4 },
  skillValue: { fontFamily: F.ub900, fontSize: 26, color: C.ink, marginHorizontal: 10 },
  miniBtn: { width: 30, height: 30, backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, alignItems: "center", justifyContent: "center" },
  miniBtnText: { fontFamily: F.ub900, fontSize: 18, color: C.ink },
  previewCard: { backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink },
  previewBand: { backgroundColor: C.blue, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: BORDER, borderColor: C.ink },
  previewBandText: { fontFamily: F.ub900, fontSize: 13, color: C.white, letterSpacing: -0.3 },
  previewDate: { fontFamily: F.mono, fontSize: 12, color: C.ink },
  previewSkill: { fontFamily: F.ub700, fontSize: 11, color: C.ink, marginTop: 6, letterSpacing: 0.6 },
  previewLink: { fontFamily: F.mono, fontSize: 11, color: C.blue, marginTop: 8 },
});
