// Step 6 of 9: Ideal time rank — drag-and-drop list of day×window slots.
// V2 spec: Combine preferred days (step 4) with the preferred window
// (step 5) and let the user drag to rank their ideal slots.
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, Heading, MicroLabel, Body } from "../../lib/ui";
import { OnboardingHeader } from "../../lib/onboarding-header";
import { loadDraft, saveDraft, fmtTime, fullDayLabel } from "../../lib/onboarding-draft";

type Slot = { id: string; day: string };

export default function TimeRanking() {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  useEffect(() => {
    loadDraft().then((d) => {
      setStart(d.preferredStartTime);
      setEnd(d.preferredEndTime);
      const base = d.rankedTimeBlocks.length === d.rankedDays.length
        ? d.rankedTimeBlocks
        : d.rankedDays;
      setSlots(base.map((day) => ({ id: day, day })));
    });
  }, []);

  const onNext = async () => {
    if (slots.length === 0) {
      return Alert.alert("No slots", "Add days and a time window first.");
    }
    await saveDraft({ rankedTimeBlocks: slots.map((s) => s.day) });
    router.push("/onboarding/game-type");
  };

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<Slot>) => {
    const idx = (getIndex() ?? 0) + 1;
    return (
      <ScaleDecorator>
        <View
          style={[styles.slot, isActive && { backgroundColor: C.lime }]}
          testID={`slot-${item.day}`}
        >
          <View style={styles.rankPill}>
            <Text style={styles.rankPillNum}>{idx}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.day}>{fullDayLabel(item.day)}</Text>
            <Text style={styles.window}>{fmtTime(start)} — {fmtTime(end)}</Text>
          </View>
          <Text
            onPressIn={drag}
            onLongPress={drag}
            style={{ padding: 8 }}
            testID={`drag-${item.day}`}
          >
            <Ionicons name="reorder-three" size={28} color={C.ink} />
          </Text>
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.cream }}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <OnboardingHeader step={6} />
        <View style={{ paddingHorizontal: 16 }}>
          <Heading size={22} style={{ marginBottom: 6 }}>RANK YOUR IDEAL SLOTS</Heading>
          <Body size={11} color={C.grey}>
            Drag the handle to reorder. Top of the list = most preferred.
          </Body>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 14 }}>
          {slots.length === 0 ? (
            <View style={styles.empty}>
              <MicroLabel style={{ marginBottom: 6 }}>NO SLOTS YET</MicroLabel>
              <Body size={12} color={C.grey} style={{ textAlign: "center" }}>
                Go back and pick at least one day and a time window first.
              </Body>
            </View>
          ) : (
            <DraggableFlatList
              data={slots}
              onDragEnd={({ data }) => setSlots(data)}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 24 }}
              activationDistance={Platform.OS === "web" ? 5 : 8}
            />
          )}
        </View>

        <View style={{ padding: 20 }}>
          <SplitCTA testID="onboarding-step6-continue" label="CONTINUE" onPress={onNext} disabled={slots.length === 0} />
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  slot: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.white,
    borderWidth: BORDER, borderColor: C.ink,
    paddingHorizontal: 12, paddingVertical: 14,
    marginBottom: 10,
  },
  rankPill: {
    width: 36, height: 36,
    backgroundColor: C.ink, alignItems: "center", justifyContent: "center",
  },
  rankPillNum: { fontFamily: F.ub900, color: C.lime, fontSize: 14 },
  day: { fontFamily: F.ub900, fontSize: 14, color: C.ink, letterSpacing: -0.3 },
  window: { fontFamily: F.mono, fontSize: 11, color: C.grey, letterSpacing: 1.2, marginTop: 2 },
  empty: {
    backgroundColor: C.white,
    borderWidth: BORDER, borderColor: C.ink,
    padding: 24, marginTop: 4,
    alignItems: "center",
  },
});
