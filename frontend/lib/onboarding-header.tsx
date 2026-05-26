// Onboarding progress indicator — small circular "racket hole" dots.
// The padel racket has a pattern of round holes punched through the
// face, so we represent each onboarding step as a dot. Active step is a
// filled lime dot; completed steps are filled ink; future steps are
// outlined hollow dots.
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { C, BORDER } from "../lib/theme";

export const ONBOARDING_TOTAL_STEPS = 9;

export function OnboardingHeader({
  step,
  total = ONBOARDING_TOTAL_STEPS,
  onBack,
  dark = false,
  rightAction,
}: {
  step: number;
  total?: number;
  onBack?: () => void;
  dark?: boolean;
  rightAction?: React.ReactNode;
}) {
  const router = useRouter();
  const handleBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
  };
  const tint = dark ? C.white : C.ink;

  return (
    <View style={styles.row}>
      {step > 1 ? (
        <TouchableOpacity onPress={handleBack} testID="onboarding-back" style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={tint} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconBtn} />
      )}
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, idx) => {
          const i = idx + 1;
          const isActive = i === step;
          const isDone = i < step;
          let bg = "transparent";
          if (isActive) bg = C.lime;
          else if (isDone) bg = tint;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  borderColor: tint,
                  backgroundColor: bg,
                  width: isActive ? 12 : 8,
                  height: isActive ? 12 : 8,
                  borderRadius: 999,
                  borderWidth: isActive ? BORDER : 1.5,
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.iconBtn}>{rightAction}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBtn: { minWidth: 60, height: 40, alignItems: "flex-start", justifyContent: "center" },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {},
});
