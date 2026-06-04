// Step 3 of 9: Venues — tap to add (with rank badge).
// V3 (post UX audit, May 2026): Reworked to follow ContainerD spec —
// white card body with a coloured top-accent band keyed to the village.
// Previously the cards used the village colour as a full background fill,
// which broke the Sport Brutalism token semantics (lime = CTAs only,
// blue = section headers only — neither should be a card surface). The
// village colour is now expressed as a 6px top band + a small chip,
// keeping the colour cue without misusing the token.
import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, Heading, Body } from "../../lib/ui";
import { OnboardingHeader } from "../../lib/onboarding-header";
import { loadDraft, saveDraft } from "../../lib/onboarding-draft";
import { api } from "../../lib/api";

// Village → accent band colour. Each is one of the brand tokens.
const VILLAGE_COLOR: Record<string, string> = {
  Anjuna:  C.lime,
  Assagao: C.blue,
  Panjim:  C.blue,
  Siolim:  C.purple,
  Socorro: C.ink,
  Vagator: C.lime,
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
          const accent = VILLAGE_COLOR[v.area] || C.grey;
          return (
            <TouchableOpacity
              key={v.id}
              testID={`venue-card-${v.id}`}
              onPress={() => toggle(v.id)}
              activeOpacity={0.85}
              style={[styles.venueCard, selected && styles.venueCardSelected]}
            >
              {/* ContainerD: coloured top accent band keyed to the village */}
              <View style={[styles.accentBand, { backgroundColor: accent }]} />
              <View style={styles.cardBody}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.venueName} numberOfLines={1}>
                    {v.name.toUpperCase()}
                  </Text>
                  <View style={styles.areaRow}>
                    <View style={[styles.areaChip, { backgroundColor: accent }]} />
                    <Text style={styles.venueArea}>{v.area.toUpperCase()}</Text>
                  </View>
                </View>
                {selected ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeNum}>{idx + 1}</Text>
                  </View>
                ) : (
                  <View style={styles.badgeEmpty}>
                    <Text style={styles.badgeEmptyPlus}>+</Text>
                  </View>
                )}
              </View>
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
  // ContainerA-derived: white surface, ink border, 0px radius.
  venueCard: {
    backgroundColor: C.white,
    borderWidth: BORDER, borderColor: C.ink,
    marginBottom: 10,
  },
  // Selected state retains white fill but thickens the border.
  venueCardSelected: { borderWidth: 3 },
  // ContainerD: 6px coloured top accent band keyed to the village.
  accentBand: { height: 6 },
  cardBody: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 16,
  },
  venueName: { fontFamily: F.ub900, fontSize: 16, letterSpacing: -0.4, color: C.ink },
  areaRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  areaChip: { width: 10, height: 10, borderWidth: 1.5, borderColor: C.ink, marginRight: 6 },
  venueArea: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.6, color: C.ink2 },
  // Selected: ink-on-ink badge with lime numeral — scoreboard ranking display.
  badge: {
    width: 36, height: 36,
    backgroundColor: C.ink,
    alignItems: "center", justifyContent: "center",
    marginLeft: 12,
  },
  badgeNum: { fontFamily: F.ub900, color: C.lime, fontSize: 14 },
  // Unselected: ContainerF (dashed) placeholder with a grey "+".
  badgeEmpty: {
    width: 36, height: 36,
    borderWidth: 1.5, borderColor: C.grey, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center",
    marginLeft: 12,
  },
  badgeEmptyPlus: { fontFamily: F.ub900, color: C.grey, fontSize: 18, opacity: 0.7 },
});
