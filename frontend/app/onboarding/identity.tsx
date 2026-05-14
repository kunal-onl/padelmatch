// Step 1: Identity — name, phone, optional photo (omitted upload widget for MVP).
import React, { useState } from "react";
import {
  View, Text, TextInput, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, MicroLabel, Body } from "../../lib/ui";
import { OnboardingHeader } from "../../lib/onboarding-header";
import { draft } from "../../lib/onboarding-draft";
import { usePlayer } from "../../lib/context";

export default function Identity() {
  const router = useRouter();
  const { signIn } = usePlayer();
  const [name, setName] = useState(draft.name);
  const [phone, setPhone] = useState(draft.phone);

  const onNext = () => {
    if (!name.trim()) return Alert.alert("Add your name", "Please add your name to continue.");
    if (phone.trim().length < 6) return Alert.alert("Add a phone number", "WhatsApp number is required.");
    draft.name = name.trim();
    draft.phone = phone.trim();
    router.push("/onboarding/experience");
  };

  const useDemo = async () => {
    await signIn("kunal");
    router.replace("/(tabs)/home");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <OnboardingHeader step={1} dark />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: "center", marginTop: 24, marginBottom: 28 }}>
            <Text style={styles.wordmark}>PADEL MATCH</Text>
            <View style={{ height: 6 }} />
            <MicroLabel color={C.lime}>padelmatch.in</MicroLabel>
            <View style={{ height: 22 }} />
            <Text style={styles.subtitle}>JOIN NORTH GOA PADEL</Text>
          </View>

          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Ionicons name="add" size={32} color={C.lime} />
            </View>
            <Body color="rgba(255,255,255,0.6)" size={10} style={{ marginTop: 8, textAlign: "center" }}>
              Photo upload coming soon
            </Body>
          </View>

          <View style={{ marginTop: 28 }}>
            <MicroLabel color={C.lime} style={{ marginBottom: 6 }}>YOUR NAME</MicroLabel>
            <TextInput
              testID="onboarding-name-input"
              value={name}
              onChangeText={setName}
              placeholder="Kunal B."
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={styles.input}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={{ marginTop: 16 }}>
            <MicroLabel color={C.lime} style={{ marginBottom: 6 }}>WHATSAPP NUMBER</MicroLabel>
            <View style={styles.phoneRow}>
              <View style={styles.phonePrefix}>
                <Text style={{ fontFamily: F.ub900, color: C.lime, fontSize: 14 }}>+91</Text>
              </View>
              <TextInput
                testID="onboarding-phone-input"
                value={phone}
                onChangeText={setPhone}
                placeholder="98 1234 5678"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={[styles.input, { flex: 1, marginTop: 0 }]}
                keyboardType="phone-pad"
                returnKeyType="done"
              />
            </View>
            <Body color="rgba(255,255,255,0.55)" size={10} style={{ marginTop: 6 }}>
              Used for game notifications only. Never shared publicly.
            </Body>
          </View>
        </ScrollView>

        <View style={{ padding: 20 }}>
          <SplitCTA testID="onboarding-step1-continue" label="CONTINUE" onPress={onNext} />
          <TouchableOpacity testID="quick-demo-login" onPress={useDemo} style={{ marginTop: 14, alignItems: "center" }}>
            <Text style={{ fontFamily: F.mono, color: C.lime, fontSize: 11, letterSpacing: 1.4 }}>
              USE DEMO PROFILE (KUNAL B.) →
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.ink },
  wordmark: { fontFamily: F.ub900, color: C.white, fontSize: 32, letterSpacing: -1 },
  subtitle: { fontFamily: F.ub400, color: C.white, fontSize: 11, letterSpacing: 2 },
  avatarWrap: { alignItems: "center" },
  avatar: {
    width: 84, height: 84,
    borderWidth: BORDER, borderColor: C.lime, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(201,229,47,0.08)",
  },
  input: {
    backgroundColor: C.cream,
    borderWidth: BORDER, borderColor: C.lime,
    paddingHorizontal: 14, paddingVertical: 14, minHeight: 52,
    color: C.ink, fontFamily: F.ub700, fontSize: 14, letterSpacing: -0.3,
  },
  phoneRow: { flexDirection: "row", alignItems: "stretch" },
  phonePrefix: {
    backgroundColor: C.ink, borderWidth: BORDER, borderColor: C.lime, borderRightWidth: 0,
    paddingHorizontal: 14, justifyContent: "center", minWidth: 64,
  },
});
