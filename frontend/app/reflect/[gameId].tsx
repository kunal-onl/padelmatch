// Post-match self-reflection screen.
// Free-text "what did you work on?" (max 280 chars) + multi-select focus
// areas. Saves to /api/games/:id/reflect which also marks this player as
// having completed the reflection prompt on the game.
import React, { useState } from "react";
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, Heading, MicroLabel, Body, Pill } from "../../lib/ui";
import { api } from "../../lib/api";

const FOCUS = [
  "Serves", "Net play", "Wall exits", "Movement",
  "Positioning", "Strategy", "Consistency",
];

export default function Reflect() {
  const router = useRouter();
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const [text, setText] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (a: string) =>
    setAreas((s) => (s.includes(a) ? s.filter((x) => x !== a) : [...s, a]));

  const onSave = async () => {
    setSaving(true);
    try {
      await api.submitReflection(gameId!, text.trim(), areas);
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
        <TouchableOpacity onPress={() => router.back()} testID="reflect-back">
          <Ionicons name="chevron-back" size={24} color={C.ink} />
        </TouchableOpacity>
        <Heading size={14}>SELF-REFLECT</Heading>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <MicroLabel style={{ marginBottom: 8 }}>WHAT DID YOU WORK ON?</MicroLabel>
          <TextInput
            testID="reflect-text"
            value={text}
            onChangeText={(t) => setText(t.slice(0, 280))}
            placeholder="A short note for yourself …"
            placeholderTextColor={C.grey}
            style={styles.text}
            multiline
            maxLength={280}
          />
          <Body size={9} color={C.grey} style={{ marginTop: 4, textAlign: "right" }}>
            {text.length}/280
          </Body>

          <View style={{ height: 16 }} />
          <MicroLabel style={{ marginBottom: 8 }}>FOCUS AREAS</MicroLabel>
          <View style={styles.areasWrap}>
            {FOCUS.map((a) => (
              <Pill
                key={a}
                testID={`focus-${a.toLowerCase().replace(/[^a-z]/g, "-")}`}
                label={a.toUpperCase()}
                active={areas.includes(a)}
                neutralInactive
                onPress={() => toggle(a)}
                style={{ marginRight: 8, marginBottom: 8 }}
              />
            ))}
          </View>
        </ScrollView>

        <View style={{ padding: 16 }}>
          <SplitCTA
            testID="reflect-save"
            label={saving ? "SAVING…" : "SAVE REFLECTION →"}
            onPress={onSave}
            disabled={saving || (!text.trim() && areas.length === 0)}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: BORDER, borderColor: C.ink, backgroundColor: C.cream,
  },
  text: {
    minHeight: 110, padding: 14,
    backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink,
    color: C.ink, fontFamily: F.sans, fontSize: 14, textAlignVertical: "top",
  },
  areasWrap: { flexDirection: "row", flexWrap: "wrap" },
});
