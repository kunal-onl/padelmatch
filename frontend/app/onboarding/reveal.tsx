// Rating reveal \u2014 final onboarding step. Submits the V2 draft to the
// backend (which computes initial rating from experience + shots if any),
// then animates the rating count-up.
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Animated, Easing, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { C, F } from "../../lib/theme";
import { SplitCTA, MicroLabel } from "../../lib/ui";
import { api } from "../../lib/api";
import {
  draft,
  loadDraft,
  resetDraft,
  deriveAvailabilitySlots,
  deriveGameOrientation,
} from "../../lib/onboarding-draft";
import { usePlayer } from "../../lib/context";
import { LockupImage } from "../../components/brand/Logo";

export default function Reveal() {
  const router = useRouter();
  const { signIn } = usePlayer();
  const [rating, setRating] = useState<number | null>(null);
  const [displayed, setDisplayed] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        await loadDraft();
        if (!draft.whatsappVerified) {
          Alert.alert(
            "Verify WhatsApp first",
            "You must verify your WhatsApp number before entering the app.",
          );
          router.replace("/onboarding/otp");
          return;
        }
        const player = await api.createPlayer({
          name: draft.name,
          phone: draft.phone,
          bio: draft.bio,
          yearsPlayed: draft.yearsPlayed || "1to3",
          frequency: draft.frequency || "weekly",
          competitiveExperience: draft.competitiveExperience || "none",
          wallControl: draft.wallControl || "somewhat",
          preferredVenues: draft.preferredVenues,
          availabilitySlots: deriveAvailabilitySlots(),
          gamesPerWeek: Math.max(1, draft.rankedDays.length),
          gameOrientation: deriveGameOrientation(),
          connections: draft.connections.map((c) => ({
            playerId: c.playerId,
            relationship: c.relationship,
            reason: c.tags.join(",") || null,
            tags: c.tags,
            addedAt: c.addedAt,
          })),
          shotComfort: draft.shotComfort,
          // V2 fields
          rankedDays: draft.rankedDays,
          preferredStartTime: draft.preferredStartTime || null,
          preferredEndTime: draft.preferredEndTime || null,
          rankedTimeBlocks: draft.rankedTimeBlocks,
          gameTypes: draft.gameTypes,
          whatsappVerified: true,
        });
        setRating(player.gameRating);
        await signIn(player.id);
        // Seed the four self-improvement domains (source=onboarding).
        try {
          await api.seedDomainsOnboarding({
            strokes: draft.domainStrokes || 1,
            tactics: draft.domainTactics || 1,
            inner: draft.domainInner || 1,
            outer: draft.domainOuter || 1,
          });
        } catch { /* non-fatal — radar shows "not rated yet" until edited */ }
        await resetDraft();
      } catch (e: any) {
        Alert.alert("Sign-up failed", e.message ?? "Try again");
      }
    })();
  }, [signIn, router]);

  useEffect(() => {
    if (rating == null) return;
    anim.setValue(0);
    const sub = anim.addListener((v) => setDisplayed(v.value * rating));
    Animated.timing(anim, {
      toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
    return () => anim.removeListener(sub);
  }, [rating, anim]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={{ alignItems: "center", paddingTop: 32 }}>
        <LockupImage width={180} variant="horizontal-ink" />
      </View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 }}>
        <MicroLabel color={C.lime}>YOUR GAME RATING</MicroLabel>
        <View style={{ height: 14 }} />
        {rating == null ? (
          <ActivityIndicator color={C.lime} size="large" />
        ) : (
          <>
            <Text style={styles.rating} testID="rating-reveal-number">{displayed.toFixed(1)}</Text>
            <View style={{ height: 4, width: 120, backgroundColor: C.lime, marginTop: 8 }} />
            <View style={{ height: 24 }} />
            <Text style={styles.sub}>ESTIMATED · WILL UPDATE WITH MATCH RESULTS</Text>
            <View style={{ height: 14 }} />
            <Text style={styles.subSmall}>RATE YOUR SHOTS LATER IN YOUR PROFILE FOR A SHARPER ESTIMATE.</Text>
          </>
        )}
      </View>

      <View style={{ padding: 20 }}>
        <SplitCTA
          testID="reveal-continue"
          label="ENTER NORTH GOA PADEL"
          onPress={() => router.replace("/(tabs)/home")}
          disabled={rating == null}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.ink },
  rating: { fontFamily: F.ub900, color: C.lime, fontSize: 110, letterSpacing: -4 },
  sub: { fontFamily: F.mono, color: C.white, fontSize: 10, letterSpacing: 1.6, textAlign: "center" },
  subSmall: {
    fontFamily: F.mono, color: "rgba(255,255,255,0.55)",
    fontSize: 9, letterSpacing: 1.2, textAlign: "center", paddingHorizontal: 20,
  },
});
