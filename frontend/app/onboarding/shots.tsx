// Step 5: Shot Comfort — 5 category tabs, rate each shot 1-5.
import React, { useMemo, useState } from "react";
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, Heading, MicroLabel, Body } from "../../lib/ui";
import { OnboardingHeader } from "../../lib/onboarding-header";
import { draft } from "../../lib/onboarding-draft";
import { SHOTS, CATEGORIES, COMFORT_LABELS } from "../../lib/shots";

export default function Shots() {
  const router = useRouter();
  const [cat, setCat] = useState<typeof CATEGORIES[number]["key"]>("serves");
  const [vals, setVals] = useState<Record<string, number>>(draft.shotComfort);

  const inCat = useMemo(() => SHOTS.filter((s) => s.category === cat), [cat]);
  const ratedInCat = inCat.filter((s) => vals[s.slug]).length;
  const ratedTotal = Object.keys(vals).length;
  const allCatsCovered = CATEGORIES.every(({ key }) => SHOTS.filter((s) => s.category === key).some((s) => vals[s.slug]));

  const set = (slug: string, v: number) => setVals((s) => ({ ...s, [slug]: v }));

  const onFinish = () => {
    draft.shotComfort = vals;
    router.push("/onboarding/reveal");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <OnboardingHeader step={5} />
      <View style={{ paddingHorizontal: 16 }}>
        <Heading size={20}>RATE YOUR SHOTS</Heading>
        <Body size={11} color={C.grey} style={{ marginTop: 4 }}>
          Be honest — this helps us match you accurately. You can update this anytime.
        </Body>

        <View style={styles.tabs}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              testID={`shot-tab-${c.key}`}
              onPress={() => setCat(c.key)}
              style={[
                styles.tab,
                { backgroundColor: cat === c.key ? C.ink : C.white },
              ]}
            >
              <Text style={{
                fontFamily: F.ub700, fontSize: 9, letterSpacing: 1,
                color: cat === c.key ? C.lime : C.grey,
              }}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ fontFamily: F.mono, fontSize: 9, color: C.grey, marginTop: 8, letterSpacing: 1.4 }}>
          {ratedInCat} / {inCat.length} RATED · TOTAL {ratedTotal}/36
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 24 }}>
        {inCat.map((s) => (
          <View key={s.slug} style={styles.card} testID={`shot-card-${s.slug}`}>
            <View style={{ padding: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontFamily: F.ub700, fontSize: 13, color: C.ink, letterSpacing: -0.3 }}>{s.name.toUpperCase()}</Text>
                <Text style={{ fontFamily: F.mono, fontSize: 9, color: C.lime, letterSpacing: 1.2 }}>TIER {s.tier}</Text>
              </View>
              {s.spanish && (
                <Text style={{ fontFamily: F.mono, fontSize: 10, color: C.grey, fontStyle: "italic", marginTop: 2 }}>
                  {s.spanish}
                </Text>
              )}
              <Text style={{ fontFamily: F.sans, fontSize: 11, color: C.ink2, lineHeight: 17, marginTop: 6 }}>
                {s.description}
              </Text>
              <View style={styles.comfortRow}>
                {COMFORT_LABELS.map((label, i) => {
                  const val = i + 1;
                  const active = vals[s.slug] === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      testID={`comfort-${s.slug}-${val}`}
                      style={[styles.comfortBtn, active && { backgroundColor: C.lime }]}
                      onPress={() => set(s.slug, val)}
                    >
                      <Text style={{ fontFamily: F.ub700, fontSize: 8, color: C.ink, letterSpacing: 0.6, textAlign: "center" }}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={{ padding: 20 }}>
        <SplitCTA
          testID="onboarding-step5-finish"
          label="FINISH & SEE MY RATING"
          onPress={onFinish}
          disabled={!allCatsCovered}
        />
        {!allCatsCovered && (
          <Body size={10} color={C.grey} style={{ textAlign: "center", marginTop: 6 }}>
            Rate at least one shot in each category to continue.
          </Body>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  tabs: { flexDirection: "row", marginTop: 14, borderWidth: BORDER, borderColor: C.ink },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderRightWidth: BORDER, borderColor: C.ink },
  card: { backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, marginBottom: 10 },
  comfortRow: { flexDirection: "row", marginTop: 12 },
  comfortBtn: {
    flex: 1, paddingVertical: 10, alignItems: "center", justifyContent: "center",
    borderWidth: BORDER, borderColor: C.ink, backgroundColor: C.white, marginLeft: -2,
  },
});
