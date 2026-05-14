// Step 2: Experience — 4 question cards.
import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, Heading, MicroLabel, Pill } from "../../lib/ui";
import { OnboardingHeader } from "../../lib/onboarding-header";
import { draft } from "../../lib/onboarding-draft";

type Q = { key: string; label: string; accent: string; options: Array<{ value: string; label: string }> };

const QUESTIONS: Q[] = [
  {
    key: "yearsPlayed", label: "HOW LONG HAVE YOU PLAYED PADEL OR TENNIS?", accent: C.lime,
    options: [
      { value: "under1", label: "< 1 YEAR" },
      { value: "1to3", label: "1–3 YEARS" },
      { value: "3to5", label: "3–5 YEARS" },
      { value: "5plus", label: "5+ YEARS" },
    ],
  },
  {
    key: "frequency", label: "HOW OFTEN DO YOU PLAY?", accent: C.coral,
    options: [
      { value: "rarely", label: "RARELY" },
      { value: "monthly", label: "MONTHLY" },
      { value: "weekly", label: "WEEKLY" },
      { value: "multipleWeekly", label: "MULTIPLE / WEEK" },
    ],
  },
  {
    key: "competitiveExperience", label: "COMPETITIVE EXPERIENCE?", accent: C.blue,
    options: [
      { value: "none", label: "NONE" },
      { value: "casual", label: "CASUAL TOURNAMENTS" },
      { value: "regular", label: "REGULAR LEAGUES" },
    ],
  },
  {
    key: "wallControl", label: "COURT CONTROL — DIRECTION, POWER, WALLS?", accent: C.ink,
    options: [
      { value: "no", label: "NOT YET" },
      { value: "somewhat", label: "GETTING THERE" },
      { value: "yes", label: "YES, CONSISTENTLY" },
    ],
  },
];

export default function Experience() {
  const router = useRouter();
  const [vals, setVals] = useState<Record<string, string>>({
    yearsPlayed: draft.yearsPlayed,
    frequency: draft.frequency,
    competitiveExperience: draft.competitiveExperience,
    wallControl: draft.wallControl,
  });

  const setVal = (k: string, v: string) => setVals((s) => ({ ...s, [k]: v }));
  const valid = QUESTIONS.every((q) => vals[q.key]);

  const onNext = () => {
    draft.yearsPlayed = vals.yearsPlayed;
    draft.frequency = vals.frequency;
    draft.competitiveExperience = vals.competitiveExperience;
    draft.wallControl = vals.wallControl;
    router.push("/onboarding/preferences");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <OnboardingHeader step={2} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <Heading size={22} style={{ marginTop: 4, marginBottom: 16 }}>TELL US YOUR GAME</Heading>

        {QUESTIONS.map((q) => (
          <View key={q.key} style={styles.qCard} testID={`q-card-${q.key}`}>
            <View style={[styles.accent, { backgroundColor: q.accent }]} />
            <View style={{ padding: 14 }}>
              <MicroLabel style={{ marginBottom: 10 }}>{q.label}</MicroLabel>
              <View style={styles.pillsWrap}>
                {q.options.map((o) => (
                  <Pill
                    key={o.value}
                    testID={`q-${q.key}-${o.value}`}
                    label={o.label}
                    active={vals[q.key] === o.value}
                    onPress={() => setVal(q.key, o.value)}
                    style={{ marginRight: 8, marginBottom: 8 }}
                  />
                ))}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={{ padding: 20 }}>
        <SplitCTA testID="onboarding-step2-continue" label="CONTINUE" onPress={onNext} disabled={!valid} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  qCard: {
    flexDirection: "row",
    backgroundColor: C.white,
    borderWidth: BORDER, borderColor: C.ink,
    marginBottom: 14,
  },
  accent: { width: 4 },
  pillsWrap: { flexDirection: "row", flexWrap: "wrap" },
});
