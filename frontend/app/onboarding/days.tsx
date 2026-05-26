// Step 4 of 9: Days — rank up to 7 days of the week by preference.
// V2 spec: tap a day to add it to the ranked list. A small numeric badge
// in the top right shows its preference order. The "Sessions Per Week —
// Up to N" is auto-derived from the count of selected days.
import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, Heading, MicroLabel, Body } from "../../lib/ui";
import { OnboardingHeader } from "../../lib/onboarding-header";
import { ALL_DAYS, loadDraft, saveDraft } from "../../lib/onboarding-draft";

export default function Days() {
  const router = useRouter();
  const [ranked, setRanked] = useState<string[]>([]);

  useEffect(() => {
    loadDraft().then((d) => setRanked(d.rankedDays));
  }, []);

  const toggle = (key: string) => {
    setRanked((p) => (p.includes(key) ? p.filter((x) => x !== key) : [...p, key]));
  };

  const onNext = async () => {
    if (ranked.length === 0) {
      return Alert.alert("Pick a day", "Tap the days you can play — in preference order.");
    }
    await saveDraft({ rankedDays: ranked });
    router.push("/onboarding/timings");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <OnboardingHeader step={4} />
      <View style={{ paddingHorizontal: 16 }}>
        <Heading size={22} style={{ marginBottom: 6 }}>WHEN WOULD YOU PREFER TO PLAY?</Heading>
        <Body size={11} color={C.grey}>
          Tap days in order of preference. Up to 7. The badge shows your rank.
        </Body>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}>
        <View style={styles.grid}>
          {ALL_DAYS.map((d) => {
            const idx = ranked.indexOf(d.key);
            const selected = idx >= 0;
            return (
              <TouchableOpacity
                key={d.key}
                testID={`day-tile-${d.key}`}
                onPress={() => toggle(d.key)}
                activeOpacity={0.85}
                style={[
                  styles.dayTile,
                  selected ? { backgroundColor: C.lime } : { backgroundColor: C.white },
                ]}
              >
                <Text style={[styles.dayLabel, { color: C.ink }]}>{d.full}</Text>
                {selected && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeNum}>{idx + 1}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sessions}>
          <MicroLabel style={{ marginBottom: 6 }}>SESSIONS PER WEEK — UP TO</MicroLabel>
          <Text style={styles.sessionsNum}>{ranked.length}</Text>
        </View>
      </ScrollView>

      <View style={{ padding: 20 }}>
        <SplitCTA testID="onboarding-step4-continue" label="CONTINUE" onPress={onNext} disabled={ranked.length === 0} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  grid: {},
  dayTile: {
    borderWidth: BORDER, borderColor: C.ink,
    paddingHorizontal: 16, paddingVertical: 18,
    marginBottom: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  dayLabel: { fontFamily: F.ub900, fontSize: 16, letterSpacing: -0.4 },
  badge: {
    width: 30, height: 30,
    backgroundColor: C.ink,
    alignItems: "center", justifyContent: "center",
  },
  badgeNum: { fontFamily: F.ub900, color: C.lime, fontSize: 13 },
  sessions: {
    marginTop: 18,
    backgroundColor: C.ink,
    padding: 16,
    borderWidth: BORDER, borderColor: C.ink,
    alignItems: "center",
  },
  sessionsNum: { fontFamily: F.ub900, color: C.lime, fontSize: 56, letterSpacing: -2, lineHeight: 60 },
});
