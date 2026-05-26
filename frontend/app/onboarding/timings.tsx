// Step 5 of 9: Timings — Preferred Start and Preferred End.
// V2 spec: separate page. Half-hour slots, 12-hour drop-down with AM/PM
// toggle. Output stored as 24-hour HH:MM in draft.preferredStartTime/End.
import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, Heading, MicroLabel, Body } from "../../lib/ui";
import { OnboardingHeader } from "../../lib/onboarding-header";
import { loadDraft, saveDraft, fmtTime } from "../../lib/onboarding-draft";

type Period = "AM" | "PM";

function split24(t: string): { hour12: number; minute: number; period: Period } {
  if (!t || !t.includes(":")) return { hour12: 7, minute: 0, period: "AM" };
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period: Period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { hour12: h12, minute: m === 30 ? 30 : 0, period };
}
function join24(hour12: number, minute: number, period: Period): string {
  let h = hour12 % 12;
  if (period === "PM") h += 12;
  return `${h.toString().padStart(2, "0")}:${minute === 30 ? "30" : "00"}`;
}

function TimePicker({
  label, value, onChange, testID,
}: { label: string; value: string; onChange: (v: string) => void; testID: string }) {
  const { hour12, minute, period } = split24(value || "07:00");
  return (
    <View style={styles.picker}>
      <MicroLabel style={{ marginBottom: 8 }}>{label}</MicroLabel>
      <View style={styles.pickerRow}>
        {/* Hour */}
        <View style={styles.col}>
          <Text style={styles.colLabel}>HOUR</Text>
          <ScrollView style={styles.colScroll} showsVerticalScrollIndicator={false}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
              const active = h === hour12;
              return (
                <TouchableOpacity
                  key={h}
                  testID={`${testID}-hour-${h}`}
                  onPress={() => onChange(join24(h, minute, period))}
                  style={[styles.colItem, active && styles.colItemActive]}
                >
                  <Text style={[styles.colItemText, active && styles.colItemTextActive]}>{h}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
        {/* Minute */}
        <View style={styles.col}>
          <Text style={styles.colLabel}>MIN</Text>
          {[0, 30].map((m) => {
            const active = m === minute;
            return (
              <TouchableOpacity
                key={m}
                testID={`${testID}-min-${m}`}
                onPress={() => onChange(join24(hour12, m as 0 | 30, period))}
                style={[styles.colItem, active && styles.colItemActive]}
              >
                <Text style={[styles.colItemText, active && styles.colItemTextActive]}>
                  {m === 30 ? ":30" : ":00"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {/* AM/PM */}
        <View style={styles.col}>
          <Text style={styles.colLabel}>AM/PM</Text>
          {(["AM", "PM"] as Period[]).map((p) => {
            const active = p === period;
            return (
              <TouchableOpacity
                key={p}
                testID={`${testID}-period-${p}`}
                onPress={() => onChange(join24(hour12, minute, p))}
                style={[styles.colItem, active && styles.colItemActive]}
              >
                <Text style={[styles.colItemText, active && styles.colItemTextActive]}>{p}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function Timings() {
  const router = useRouter();
  const [start, setStart] = useState("07:00");
  const [end, setEnd] = useState("09:00");

  useEffect(() => {
    loadDraft().then((d) => {
      if (d.preferredStartTime) setStart(d.preferredStartTime);
      if (d.preferredEndTime) setEnd(d.preferredEndTime);
    });
  }, []);

  const startMin = useMemo(() => parseInt(start.split(":")[0]) * 60 + parseInt(start.split(":")[1]), [start]);
  const endMin = useMemo(() => parseInt(end.split(":")[0]) * 60 + parseInt(end.split(":")[1]), [end]);
  const valid = endMin > startMin;

  const onNext = async () => {
    if (!valid) return Alert.alert("Check times", "End time must be after start time.");
    await saveDraft({ preferredStartTime: start, preferredEndTime: end });
    router.push("/onboarding/time-ranking");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <OnboardingHeader step={5} />
      <View style={{ paddingHorizontal: 16 }}>
        <Heading size={22} style={{ marginBottom: 6 }}>YOUR PREFERRED HOURS</Heading>
        <Body size={11} color={C.grey}>
          Pick a typical start and end. We&apos;ll match games within this window.
        </Body>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}>
        <TimePicker testID="start-time" label="PREFERRED START TIME" value={start} onChange={setStart} />
        <View style={{ height: 14 }} />
        <TimePicker testID="end-time" label="PREFERRED END TIME" value={end} onChange={setEnd} />

        <View style={styles.summary}>
          <MicroLabel style={{ marginBottom: 6 }}>YOUR WINDOW</MicroLabel>
          <Text style={styles.summaryText}>{fmtTime(start)} — {fmtTime(end)}</Text>
          {!valid && (
            <Text style={{ fontFamily: F.mono, color: C.coral, fontSize: 10, marginTop: 6, letterSpacing: 1 }}>
              END MUST BE AFTER START
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={{ padding: 20 }}>
        <SplitCTA testID="onboarding-step5-continue" label="CONTINUE" onPress={onNext} disabled={!valid} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  picker: {
    backgroundColor: C.white,
    borderWidth: BORDER, borderColor: C.ink,
    padding: 12,
  },
  pickerRow: { flexDirection: "row", gap: 8 },
  col: { flex: 1, borderWidth: BORDER, borderColor: C.ink, backgroundColor: C.cream },
  colLabel: {
    fontFamily: F.mono, fontSize: 9, letterSpacing: 1.4,
    color: C.grey, textAlign: "center", paddingVertical: 6,
    borderBottomWidth: BORDER, borderColor: C.ink, backgroundColor: C.white,
  },
  colScroll: { maxHeight: 220 },
  colItem: {
    paddingVertical: 10, paddingHorizontal: 8,
    borderBottomWidth: 1, borderColor: "#00000010",
    alignItems: "center",
  },
  colItemActive: { backgroundColor: C.lime },
  colItemText: { fontFamily: F.ub700, fontSize: 14, color: C.ink },
  colItemTextActive: { fontFamily: F.ub900 },
  summary: {
    marginTop: 18,
    backgroundColor: C.ink,
    padding: 16,
    alignItems: "center",
  },
  summaryText: { fontFamily: F.ub900, color: C.lime, fontSize: 28, letterSpacing: -1 },
});
