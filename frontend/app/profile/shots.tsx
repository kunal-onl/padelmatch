// Rate Your Shots \u2014 standalone screen reachable from Profile.
// Moved out of the onboarding flow per V2 spec. Lets the user revisit and
// update their shot comfort ratings at any time; saves via PATCH /players/:id.
import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, Heading, Body } from "../../lib/ui";
import { SHOTS, CATEGORIES, COMFORT_LABELS } from "../../lib/shots";
import { api } from "../../lib/api";
import { usePlayer } from "../../lib/context";

export default function ProfileShots() {
  const router = useRouter();
  const { player, refresh } = usePlayer();
  const [cat, setCat] = useState<typeof CATEGORIES[number]["key"]>("serves");
  const [vals, setVals] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (player?.shotComfort) setVals(player.shotComfort);
  }, [player]);

  const inCat = useMemo(() => SHOTS.filter((s) => s.category === cat), [cat]);
  const ratedTotal = Object.keys(vals).length;
  const set = (slug: string, v: number) => setVals((s) => ({ ...s, [slug]: v }));

  const onSave = async () => {
    if (!player) return;
    setSaving(true);
    try {
      await api.patchPlayer(player.id, { shotComfort: vals });
      await refresh();
      Alert.alert("Saved", "Your shot ratings have been updated.");
      router.back();
    } catch (e: any) {
      Alert.alert("Couldn't save", e.message ?? "Try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="shots-back" style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>SHOT LIBRARY</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <Body size={11} color={C.grey} style={{ marginTop: 4 }}>
          A map of the padel territory — explore it when you're curious. Marking shots here is just for you; it never changes your ratings.
        </Body>

        <View style={styles.tabs}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              testID={`shot-tab-${c.key}`}
              onPress={() => setCat(c.key)}
              style={[styles.tab, { backgroundColor: cat === c.key ? C.ink : C.white }]}
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
          TOTAL RATED {ratedTotal}/36
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
                {COMFORT_LABELS.map((_label, i) => {
                  const val = i + 1;
                  const active = vals[s.slug] === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      testID={`comfort-${s.slug}-${val}`}
                      style={[styles.comfortBtn, active && { backgroundColor: C.lime }]}
                      onPress={() => set(s.slug, val)}
                    >
                      <Text style={styles.comfortNum}>{val}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.comfortLabel}>
                {vals[s.slug]
                  ? `${vals[s.slug]} · ${COMFORT_LABELS[vals[s.slug] - 1]}`
                  : "TAP TO MARK · 1 NEVER USE → 6 EXCELLENT"}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={{ padding: 20 }}>
        <SplitCTA
          testID="profile-shots-save"
          label={saving ? "SAVING\u2026" : "SAVE"}
          onPress={onSave}
          disabled={saving}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 8, paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center", paddingLeft: 8 },
  title: { fontFamily: F.ub900, fontSize: 16, color: C.ink, letterSpacing: -0.4 },
  tabs: { flexDirection: "row", marginTop: 14, borderWidth: BORDER, borderColor: C.ink },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderRightWidth: BORDER, borderColor: C.ink },
  card: { backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, marginBottom: 10 },
  comfortRow: { flexDirection: "row", marginTop: 12 },
  comfortBtn: {
    flex: 1, paddingVertical: 10, alignItems: "center", justifyContent: "center",
    borderWidth: BORDER, borderColor: C.ink, backgroundColor: C.white, marginLeft: -2,
  },
  comfortNum: { fontFamily: F.ub900, fontSize: 14, color: C.ink },
  comfortLabel: { fontFamily: F.mono, fontSize: 9, color: C.grey, letterSpacing: 1, marginTop: 6 },
});
