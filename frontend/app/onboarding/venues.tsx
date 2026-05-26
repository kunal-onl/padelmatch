// Step 3 of 9: Venues — tap to add (with rank badge), color-coded by village.
// V2 spec: own screen. Standard color per village (alphabetical):
//   Anjuna→green, Assagao→blue, Panjim→blue (per Coplay Panjim coloured
//   by village), Siolim→purple, Socorro→cream, Vagator→green.
// Venues are listed alphabetically by venue name.
import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, Heading, MicroLabel, Body } from "../../lib/ui";
import { OnboardingHeader } from "../../lib/onboarding-header";
import { draft, loadDraft, saveDraft } from "../../lib/onboarding-draft";
import { api } from "../../lib/api";

// Village colour mapping per brand kit semantics.
// Note: cream needs a dark border for legibility — handled in style.
const VILLAGE_COLOR: Record<string, { bg: string; fg: string }> = {
  Anjuna:   { bg: C.lime,   fg: C.ink },
  Assagao:  { bg: C.blue,   fg: C.white },
  Panjim:   { bg: C.blue,   fg: C.white },
  Siolim:   { bg: C.purple, fg: C.white },
  Socorro:  { bg: C.cream,  fg: C.ink },
  Vagator:  { bg: C.lime,   fg: C.ink },
};

export default function Venues() {
  const router = useRouter();
  const [venues, setVenues] = useState<any[]>([]);
  const [preferred, setPreferred] = useState<string[]>([]);

  useEffect(() => {
    loadDraft().then((d) => setPreferred(d.preferredVenues));
    api.listVenues().then((list) => {
      // Sort alphabetically by venue name then by area to disambiguate.
      const sorted = [...list].sort((a, b) => {
        const n = a.name.localeCompare(b.name);
        if (n !== 0) return n;
        return a.area.localeCompare(b.area);
      });
      setVenues(sorted);
    }).catch(() => {});
  }, []);

  const toggle = (id: string) => {
    setPreferred((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const onNext = async () => {
    if (preferred.length === 0) {
      return Alert.alert("Pick at least one", "Tap the venues you like — in order of preference.");
    }
    await saveDraft({ preferredVenues: preferred });
    router.push("/onboarding/days");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <OnboardingHeader step={3} />
      <View style={{ paddingHorizontal: 16 }}>
        <Heading size={22} style={{ marginBottom: 6 }}>YOUR PREFERRED VENUES</Heading>
        <Body size={11} color={C.grey}>
          Tap in order of preference. The number badge shows your rank.
        </Body>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}>
        {venues.map((v) => {
          const idx = preferred.indexOf(v.id);
          const selected = idx >= 0;
          const color = VILLAGE_COLOR[v.area] || { bg: C.cream, fg: C.ink };
          return (
            <TouchableOpacity
              key={v.id}
              testID={`venue-card-${v.id}`}
              onPress={() => toggle(v.id)}
              activeOpacity={0.85}
              style={[
                styles.venueCard,
                { backgroundColor: color.bg },
                selected && { borderColor: C.ink, borderWidth: 3 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.venueName, { color: color.fg }]} numberOfLines={1}>
                  {v.name.toUpperCase()}
                </Text>
                <Text style={[styles.venueArea, { color: color.fg, opacity: 0.85 }]}>
                  {v.area.toUpperCase()}
                </Text>
              </View>
              {selected ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeNum}>{idx + 1}</Text>
                </View>
              ) : (
                <View style={[styles.badge, { backgroundColor: "transparent", borderStyle: "dashed" }]}>
                  <Text style={[styles.badgeNum, { color: color.fg, opacity: 0.4 }]}>+</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={{ padding: 20 }}>
        <SplitCTA testID="onboarding-step3-continue" label="CONTINUE" onPress={onNext} disabled={preferred.length === 0} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  venueCard: {
    borderWidth: BORDER, borderColor: C.ink,
    paddingHorizontal: 16, paddingVertical: 18,
    marginBottom: 10,
    flexDirection: "row", alignItems: "center",
  },
  venueName: { fontFamily: F.ub900, fontSize: 16, letterSpacing: -0.4 },
  venueArea: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.6, marginTop: 4 },
  badge: {
    width: 36, height: 36,
    backgroundColor: C.ink,
    borderWidth: BORDER, borderColor: C.ink,
    alignItems: "center", justifyContent: "center",
    marginLeft: 12,
  },
  badgeNum: { fontFamily: F.ub900, color: C.lime, fontSize: 14 },
});
