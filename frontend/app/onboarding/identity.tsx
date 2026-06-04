// Step 1 of 9: Identity — name + WhatsApp number.
// V2: Removed the photo upload widget. Profile photo can be added later
// from the user profile screen. Progress indicator is now the shared
// "racket holes" dots.
//
// UX-AUDIT (May 2026) fixes applied:
//   1. Background switched from ink → cream. Ink is reserved for "brand
//      moment" screens (splash, OTP). The identity form is an app surface.
//   2. Logo lockup now visible on initial load (cream variant on cream).
//   3. "JOIN NORTH GOA PADEL" subtitle now uses Unbounded 700 (was DM Sans
//      Bold via ub400 — too light for the Sport Brutalism scoreboard look).
//   4. Input borders switched from lime → ink (2px). Lime is reserved for
//      CTAs / active states, not form field borders.
//   5. `+91` prefix now follows ContainerA spec (ink border, white fill,
//      ink text) — was an inverted lime/ink block.
import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, MicroLabel, Body } from "../../lib/ui";
import { OnboardingHeader } from "../../lib/onboarding-header";
import { draft, loadDraft, saveDraft } from "../../lib/onboarding-draft";
import { usePlayer } from "../../lib/context";
import { LockupImage } from "../../components/brand/Logo";

export default function Identity() {
  const router = useRouter();
  const { signIn } = usePlayer();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadDraft().then((d) => {
      setName(d.name);
      setPhone(d.phone);
      setReady(true);
    });
  }, []);

  const onNext = async () => {
    if (!name.trim()) return Alert.alert("Add your name", "Please add your name to continue.");
    if (phone.trim().length < 6) return Alert.alert("Add a phone number", "WhatsApp number is required.");
    await saveDraft({ name: name.trim(), phone: phone.trim() });
    router.push("/onboarding/experience");
  };

  const useDemo = async () => {
    await signIn("kunal");
    router.replace("/(tabs)/home");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <OnboardingHeader step={1} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand block — logo + microlabel + subtitle. Logo is visible
              from load (cream-surface variant on cream background). */}
          <View style={{ alignItems: "center", marginTop: 24, marginBottom: 28 }}>
            <LockupImage width={260} variant="horizontal-cream" />
            <View style={{ height: 14 }} />
            <MicroLabel>padelmatch.in</MicroLabel>
          </View>
          <Text style={styles.subtitle}>JOIN NORTH GOA PADEL</Text>

          <View style={{ marginTop: 24 }}>
            <MicroLabel style={{ marginBottom: 6 }}>YOUR NAME</MicroLabel>
            <TextInput
              testID="onboarding-name-input"
              value={name}
              onChangeText={setName}
              placeholder="Kunal B."
              placeholderTextColor="rgba(17,17,24,0.3)"
              style={styles.input}
              autoCapitalize="words"
              returnKeyType="next"
              editable={ready}
            />
          </View>

          <View style={{ marginTop: 16 }}>
            <MicroLabel style={{ marginBottom: 6 }}>WHATSAPP NUMBER</MicroLabel>
            <View style={styles.phoneRow}>
              <View style={styles.phonePrefix}>
                <Text style={{ fontFamily: F.ub900, color: C.ink, fontSize: 14 }}>+91</Text>
              </View>
              <TextInput
                testID="onboarding-phone-input"
                value={phone}
                onChangeText={setPhone}
                placeholder="98 1234 5678"
                placeholderTextColor="rgba(17,17,24,0.3)"
                style={[styles.input, { flex: 1, marginTop: 0 }]}
                keyboardType="phone-pad"
                returnKeyType="done"
                editable={ready}
              />
            </View>
            <Body color={C.grey} size={10} style={{ marginTop: 6 }}>
              We&apos;ll verify this with a WhatsApp OTP at the end.
            </Body>
          </View>
        </ScrollView>

        <View style={{ padding: 20 }}>
          <SplitCTA testID="onboarding-step1-continue" label="CONTINUE" onPress={onNext} />
          <TouchableOpacity testID="quick-demo-login" onPress={useDemo} style={{ marginTop: 14, alignItems: "center" }}>
            <Text style={{ fontFamily: F.mono, color: C.ink, fontSize: 11, letterSpacing: 1.4 }}>
              USE DEMO PROFILE (KUNAL B.) →
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  // Sport Brutalism subtitle — Unbounded 700, left-aligned for parity
  // with the rest of the flow's section headings.
  subtitle: {
    fontFamily: F.ub700,
    color: C.ink,
    fontSize: 18,
    letterSpacing: -0.4,
    textAlign: "left",
  },
  input: {
    backgroundColor: C.white,
    borderWidth: BORDER, borderColor: C.ink,
    paddingHorizontal: 14, paddingVertical: 14, minHeight: 52,
    color: C.ink, fontFamily: F.ub700, fontSize: 14, letterSpacing: -0.3,
  },
  phoneRow: { flexDirection: "row", alignItems: "stretch" },
  phonePrefix: {
    backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, borderRightWidth: 0,
    paddingHorizontal: 14, justifyContent: "center", minWidth: 64,
  },
});
