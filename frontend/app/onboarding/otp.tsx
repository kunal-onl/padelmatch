// Step 9 of 9: WhatsApp OTP verification.
// PLACEHOLDER — MSG91 integration will plug in later. The backend
// /api/auth/otp/send returns a dev code (123456). Any 6-digit code is
// accepted by /api/auth/otp/verify during MVP. After verification,
// player record is created and user enters the rating reveal.
import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, MicroLabel, Body, Heading } from "../../lib/ui";
import { OnboardingHeader } from "../../lib/onboarding-header";
import { draft, loadDraft, saveDraft } from "../../lib/onboarding-draft";
import { LockupImage } from "../../components/brand/Logo";

const BASE = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api`;

export default function Otp() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [devHint, setDevHint] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadDraft().then((d) => setPhone(d.phone));
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    if (!phone || phone.length < 6) return Alert.alert("Missing number", "Please enter your WhatsApp number.");
    setSending(true);
    try {
      const res = await fetch(`${BASE}/auth/otp/send`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Failed to send code");
      setSent(true);
      setDevHint(data?.devCode ? `DEV CODE: ${data.devCode}` : "");
      startCooldown(30);
    } catch (e: any) {
      Alert.alert("Couldn't send code", e.message ?? "Try again");
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async () => {
    if (code.length !== 6) return Alert.alert("Code", "Enter the 6-digit code.");
    setVerifying(true);
    try {
      const res = await fetch(`${BASE}/auth/otp/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok || !data?.verified) throw new Error(data?.detail || "Invalid code");
      await saveDraft({ phone, whatsappVerified: true });
      router.replace("/onboarding/reveal");
    } catch (e: any) {
      Alert.alert("Couldn't verify", e.message ?? "Try again");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <OnboardingHeader step={9} dark />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
          <View style={{ alignItems: "center", marginBottom: 18 }}>
            <LockupImage width={200} variant="horizontal-ink" />
          </View>
          <Heading size={22} color={C.white}>VERIFY YOUR WHATSAPP</Heading>
          <Body size={12} color="rgba(255,255,255,0.7)" style={{ marginTop: 8 }}>
            We&apos;ll send a 6-digit code to your WhatsApp. You must verify to join the community.
          </Body>

          <View style={{ marginTop: 24 }}>
            <MicroLabel color={C.lime} style={{ marginBottom: 6 }}>WHATSAPP NUMBER</MicroLabel>
            <View style={styles.phoneRow}>
              <View style={styles.phonePrefix}>
                <Text style={{ fontFamily: F.ub900, color: C.lime, fontSize: 14 }}>+91</Text>
              </View>
              <TextInput
                testID="otp-phone-input"
                value={phone}
                onChangeText={setPhone}
                placeholder="98 1234 5678"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={[styles.input, { flex: 1 }]}
                keyboardType="phone-pad"
                editable={!sent}
              />
            </View>
          </View>

          {sent && (
            <View style={{ marginTop: 18 }}>
              <MicroLabel color={C.lime} style={{ marginBottom: 6 }}>6-DIGIT CODE</MicroLabel>
              <TextInput
                testID="otp-code-input"
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={[styles.input, { fontSize: 28, letterSpacing: 8, textAlign: "center" }]}
                keyboardType="number-pad"
                maxLength={6}
              />
              {devHint ? (
                <Text style={styles.devHint}>{devHint} (mock — any 6 digits work)</Text>
              ) : null}
              <TouchableOpacity
                disabled={cooldown > 0 || sending}
                onPress={sendOtp}
                style={{ marginTop: 12, alignItems: "center" }}
                testID="otp-resend"
              >
                <Text style={{
                  fontFamily: F.mono, color: cooldown > 0 ? "rgba(255,255,255,0.4)" : C.lime,
                  fontSize: 11, letterSpacing: 1.4,
                }}>
                  {cooldown > 0 ? `RESEND IN ${cooldown}S` : "RESEND CODE →"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ padding: 20 }}>
          {!sent ? (
            <SplitCTA
              testID="otp-send"
              label={sending ? "SENDING…" : "SEND CODE"}
              onPress={sendOtp}
              disabled={sending || phone.length < 6}
            />
          ) : (
            <SplitCTA
              testID="otp-verify"
              label={verifying ? "VERIFYING…" : "VERIFY & FINISH"}
              onPress={verifyOtp}
              disabled={verifying || code.length !== 6}
            />
          )}
          {(sending || verifying) && (
            <View style={{ marginTop: 10, alignItems: "center" }}>
              <ActivityIndicator color={C.lime} />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.ink },
  phoneRow: { flexDirection: "row", alignItems: "stretch" },
  phonePrefix: {
    backgroundColor: C.ink, borderWidth: BORDER, borderColor: C.lime, borderRightWidth: 0,
    paddingHorizontal: 14, justifyContent: "center", minWidth: 64,
  },
  input: {
    backgroundColor: C.cream,
    borderWidth: BORDER, borderColor: C.lime,
    paddingHorizontal: 14, paddingVertical: 14, minHeight: 52,
    color: C.ink, fontFamily: F.ub700, fontSize: 14, letterSpacing: -0.3,
  },
  devHint: {
    marginTop: 8,
    fontFamily: F.mono, color: C.lime, fontSize: 10, letterSpacing: 1.4,
    opacity: 0.7, textAlign: "center",
  },
});
