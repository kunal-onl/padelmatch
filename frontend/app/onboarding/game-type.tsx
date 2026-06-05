// Step 7 of 9: Game type — multi-select Competitive + Social.
// V2 spec: "What kinds of games do you want to play?" (multi-select).
// "Both" option removed — user just picks one or both. Icons made
// clearer: trophy for competitive, people for social.
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, Heading, Body } from "../../lib/ui";
import { OnboardingHeader } from "../../lib/onboarding-header";
import { loadDraft, saveDraft } from "../../lib/onboarding-draft";

const OPTIONS = [
  {
    // UX-AUDIT (May 2026): icon background was C.blue (rank/section header
    // token). Per the semantic-colour spec, the "primary featured option"
    // should use lime. Blue stays available for the rank pill on the
    // home screen but no longer doubles up as a feature accent here.
    key: "competitive", label: "COMPETITIVE",
    desc: "Tournaments, leagues, ranked games",
    icon: "trophy" as const, accent: C.lime, fg: C.ink,
  },
  {
    key: "social", label: "SOCIAL",
    desc: "Friendly games, hangouts, meet new people",
    icon: "people" as const, accent: C.purple, fg: C.white,
  },
];

export default function GameType() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    loadDraft().then((d) => setSelected(d.gameTypes));
  }, []);

  const toggle = (key: string) => {
    setSelected((s) => (s.includes(key) ? s.filter((x) => x !== key) : [...s, key]));
  };

  const onNext = async () => {
    if (selected.length === 0) {
      return Alert.alert("Pick at least one", "Choose competitive, social, or both.");
    }
    await saveDraft({ gameTypes: selected });
    router.push("/onboarding/connections");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <OnboardingHeader step={7} />
      <View style={{ paddingHorizontal: 16 }}>
        <Heading size={22} style={{ marginBottom: 6 }}>WHAT KINDS OF GAMES DO YOU WANT TO PLAY?</Heading>
        <Body size={11} color={C.grey}>
          Pick one or both. You can change this later in your profile.
        </Body>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 24 }}>
        {OPTIONS.map((o) => {
          const active = selected.includes(o.key);
          return (
            <TouchableOpacity
              key={o.key}
              testID={`game-type-${o.key}`}
              onPress={() => toggle(o.key)}
              activeOpacity={0.85}
              style={[
                styles.card,
                { backgroundColor: active ? o.accent : C.white },
                active && { borderWidth: 3 },
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: active ? C.ink : o.accent }]}>
                <Ionicons name={o.icon} size={28} color={active ? C.lime : o.fg} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={[styles.cardTitle, { color: active ? o.fg : C.ink }]}>{o.label}</Text>
                <Text style={[styles.cardDesc, { color: active ? o.fg : C.grey, opacity: active ? 0.9 : 1 }]}>{o.desc}</Text>
              </View>
              <View style={[styles.tick, { backgroundColor: active ? C.lime : "transparent", borderColor: active ? C.ink : (o.fg) }]}>
                {active && <Ionicons name="checkmark" size={18} color={C.ink} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={{ padding: 20 }}>
        <SplitCTA testID="onboarding-step7-continue" label="CONTINUE" intent="forward" onPress={onNext} disabled={selected.length === 0} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  card: {
    flexDirection: "row", alignItems: "center",
    borderWidth: BORDER, borderColor: C.ink,
    padding: 14, marginBottom: 12,
  },
  iconBox: {
    width: 56, height: 56,
    alignItems: "center", justifyContent: "center",
    borderWidth: BORDER, borderColor: C.ink,
  },
  cardTitle: { fontFamily: F.ub900, fontSize: 16, letterSpacing: -0.4 },
  cardDesc: { fontFamily: F.sans, fontSize: 11, lineHeight: 16, marginTop: 4 },
  tick: {
    width: 28, height: 28,
    borderWidth: BORDER,
    alignItems: "center", justifyContent: "center",
    marginLeft: 8,
  },
});
