// Step 3: Preferences — venues (ordered), availability days/times, frequency, orientation.
import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, Heading, MicroLabel, Pill, Body } from "../../lib/ui";
import { OnboardingHeader } from "../../lib/onboarding-header";
import { draft } from "../../lib/onboarding-draft";
import { api } from "../../lib/api";
import { DAYS } from "../../lib/utils";

const TIME_SLOTS = [
  { key: "morning", label: "MORNING", startTime: "07:00", endTime: "09:00" },
  { key: "evening", label: "EVENING", startTime: "18:00", endTime: "20:00" },
];

export default function Preferences() {
  const router = useRouter();
  const [venues, setVenues] = useState<any[]>([]);
  const [preferred, setPreferred] = useState<string[]>(draft.preferredVenues);
  const [avail, setAvail] = useState<{ dayOfWeek: string; startTime: string; endTime: string }[]>(
    draft.availabilitySlots,
  );
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [gpw, setGpw] = useState<number>(draft.gamesPerWeek || 2);
  const [orient, setOrient] = useState<string>(draft.gameOrientation);

  useEffect(() => {
    api.listVenues().then(setVenues).catch(() => {});
  }, []);

  const toggleVenue = (id: string) => {
    setPreferred((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const toggleSlot = (day: string, slot: { startTime: string; endTime: string }) => {
    setAvail((a) => {
      const idx = a.findIndex(
        (s) => s.dayOfWeek === day && s.startTime === slot.startTime && s.endTime === slot.endTime,
      );
      if (idx >= 0) return a.filter((_, i) => i !== idx);
      return [...a, { dayOfWeek: day, ...slot }];
    });
  };

  const onNext = () => {
    if (preferred.length === 0) return Alert.alert("Pick venues", "Tap at least one venue you like.");
    if (avail.length === 0) return Alert.alert("Pick availability", "Tap at least one day + time slot.");
    if (!orient) return Alert.alert("Pick orientation", "Choose competitive, social, or both.");
    draft.preferredVenues = preferred;
    draft.availabilitySlots = avail;
    draft.gamesPerWeek = gpw;
    draft.gameOrientation = orient;
    router.push("/onboarding/connections");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <OnboardingHeader step={3} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <Heading size={20} style={{ marginBottom: 6 }}>YOUR PREFERENCES</Heading>

        {/* VENUES */}
        <MicroLabel style={{ marginTop: 12, marginBottom: 8 }}>TAP VENUES IN ORDER OF PREFERENCE</MicroLabel>
        <View style={styles.venuesGrid}>
          {venues.map((v) => {
            const idx = preferred.indexOf(v.id);
            const selected = idx >= 0;
            return (
              <TouchableOpacity
                key={v.id}
                testID={`venue-card-${v.id}`}
                onPress={() => toggleVenue(v.id)}
                activeOpacity={0.85}
                style={[styles.venueCard, selected && { borderLeftWidth: 6, borderLeftColor: C.lime }]}
              >
                {selected && (
                  <View style={styles.venueBadge}>
                    <Text style={{ fontFamily: F.ub900, color: C.ink, fontSize: 11 }}>{idx + 1}</Text>
                  </View>
                )}
                <Text style={styles.venueName} numberOfLines={2}>{v.name.toUpperCase()}</Text>
                <Text style={styles.venueArea}>{v.area.toUpperCase()}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* AVAILABILITY */}
        <MicroLabel style={{ marginTop: 22, marginBottom: 8 }}>WHEN DO YOU USUALLY PLAY?</MicroLabel>
        <View style={styles.daysRow}>
          {DAYS.map((d) => (
            <TouchableOpacity
              key={d.key}
              testID={`day-${d.key}`}
              onPress={() => setOpenDay((cur) => (cur === d.key ? null : d.key))}
              style={[styles.dayBtn, openDay === d.key && { backgroundColor: C.lime }]}
            >
              <Text style={{ fontFamily: F.mono, fontSize: 10, color: C.ink }}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {openDay && (
          <View style={styles.slotPanel}>
            <MicroLabel style={{ marginBottom: 8 }}>{openDay.toUpperCase()} SLOTS</MicroLabel>
            {TIME_SLOTS.map((s) => {
              const active = avail.some(
                (a) => a.dayOfWeek === openDay && a.startTime === s.startTime && a.endTime === s.endTime,
              );
              return (
                <Pill
                  key={s.key}
                  testID={`slot-${openDay}-${s.key}`}
                  label={`${s.label} · ${s.startTime}–${s.endTime}`}
                  active={active}
                  onPress={() => toggleSlot(openDay, s)}
                  style={{ marginBottom: 8 }}
                />
              );
            })}
          </View>
        )}

        {avail.length > 0 && (
          <Body size={10} color={C.grey} style={{ marginTop: 6 }}>
            We match games within 60 minutes of your stated times.
          </Body>
        )}

        {/* FREQUENCY */}
        <MicroLabel style={{ marginTop: 22, marginBottom: 8 }}>GAMES PER WEEK</MicroLabel>
        <View style={styles.stepRow}>
          <TouchableOpacity
            testID="gpw-minus"
            style={[styles.stepBtn, { backgroundColor: C.ink }]}
            onPress={() => setGpw((n) => Math.max(1, n - 1))}
          >
            <Text style={[styles.stepIcon, { color: C.white }]}>−</Text>
          </TouchableOpacity>
          <View style={styles.stepValueBox}>
            <Text style={styles.stepValue}>{gpw}</Text>
          </View>
          <TouchableOpacity
            testID="gpw-plus"
            style={[styles.stepBtn, { backgroundColor: C.lime }]}
            onPress={() => setGpw((n) => Math.min(5, n + 1))}
          >
            <Text style={styles.stepIcon}>+</Text>
          </TouchableOpacity>
        </View>

        {/* ORIENTATION */}
        <MicroLabel style={{ marginTop: 22, marginBottom: 8 }}>GAME ORIENTATION</MicroLabel>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {["competitive", "social", "both"].map((o) => (
            <View key={o} style={{ flex: 1 }}>
              <Pill
                testID={`orient-${o}`}
                label={o.toUpperCase()}
                active={orient === o}
                onPress={() => setOrient(o)}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{ padding: 20 }}>
        <SplitCTA testID="onboarding-step3-continue" label="CONTINUE" onPress={onNext} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  venuesGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  venueCard: {
    width: "48%", backgroundColor: C.ink, padding: 12, marginBottom: 10,
    borderWidth: BORDER, borderColor: C.ink, minHeight: 78, justifyContent: "center", position: "relative",
  },
  venueBadge: {
    position: "absolute", top: 6, right: 6, width: 24, height: 24,
    backgroundColor: C.lime, alignItems: "center", justifyContent: "center",
    borderWidth: BORDER, borderColor: C.ink,
  },
  venueName: { fontFamily: F.ub700, color: C.white, fontSize: 12, letterSpacing: -0.3 },
  venueArea: { fontFamily: F.mono, color: C.lime, fontSize: 9, letterSpacing: 1.4, marginTop: 4 },

  daysRow: { flexDirection: "row", justifyContent: "space-between" },
  dayBtn: {
    flex: 1, marginHorizontal: 2, paddingVertical: 12, alignItems: "center",
    borderWidth: BORDER, borderColor: C.ink, backgroundColor: C.white,
  },
  slotPanel: { backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, padding: 12, marginTop: 10 },

  stepRow: { flexDirection: "row", alignItems: "stretch", borderWidth: BORDER, borderColor: C.ink },
  stepBtn: { width: 64, alignItems: "center", justifyContent: "center", borderRightWidth: BORDER, borderColor: C.ink },
  stepIcon: { fontFamily: F.ub900, color: C.ink, fontSize: 26 },
  stepValueBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 18, backgroundColor: C.white },
  stepValue: { fontFamily: F.ub900, fontSize: 38, color: C.ink, letterSpacing: -1 },
});
