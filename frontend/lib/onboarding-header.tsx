// Shared progress indicator (5 dots) + back button row for onboarding screens.
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { C, BORDER } from "../lib/theme";

export function OnboardingHeader({
  step,
  onBack,
  dark = false,
  rightAction,
}: {
  step: number;
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
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { borderColor: tint, backgroundColor: i === step ? C.lime : "transparent" },
            ]}
          />
        ))}
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
  iconBtn: { width: 60, height: 40, alignItems: "flex-start", justifyContent: "center" },
  dots: { flexDirection: "row", gap: 8 },
  dot: { width: 10, height: 10, borderWidth: BORDER },
});
