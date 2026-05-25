// Shared UI components built to Sport Brutalism spec (0px radius, 2px ink borders).
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "./theme";

export function Mono(props: { children: any; style?: StyleProp<TextStyle>; size?: number; color?: string; }) {
  return (
    <Text style={[{ fontFamily: F.mono, fontSize: props.size ?? 11, color: props.color ?? C.ink }, props.style]}>
      {props.children}
    </Text>
  );
}

export function MicroLabel(props: { children: any; color?: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text style={[{
      fontFamily: F.mono, fontSize: 9, letterSpacing: 1.8,
      color: props.color ?? C.grey, textTransform: "uppercase",
    }, props.style]}>
      {props.children}
    </Text>
  );
}

export function Heading(props: { children: any; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text style={[{
      fontFamily: F.ub700, fontSize: props.size ?? 14, color: props.color ?? C.ink,
      letterSpacing: -0.4, textTransform: "uppercase",
    }, props.style]}>
      {props.children}
    </Text>
  );
}

export function Body(props: { children: any; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text style={[{ fontFamily: F.sans, fontSize: props.size ?? 12, color: props.color ?? C.ink, lineHeight: (props.size ?? 12) * 1.5 }, props.style]}>
      {props.children}
    </Text>
  );
}

/** Card with optional coloured top header band. */
export function Card({
  children,
  band,
  bandLabel,
  style,
}: {
  children: React.ReactNode;
  band?: string;
  bandLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.card, style]}>
      {band && (
        <View style={{ height: bandLabel ? 22 : 8, backgroundColor: band, borderBottomWidth: BORDER, borderBottomColor: C.ink, justifyContent: "center", paddingHorizontal: 10 }}>
          {bandLabel ? <MicroLabel color={band === C.ink ? C.lime : C.ink}>{bandLabel}</MicroLabel> : null}
        </View>
      )}
      <View style={{ padding: 14 }}>{children}</View>
    </View>
  );
}

/** Split CTA button: lime body + coral arrow tab. */
export function SplitCTA({
  label,
  onPress,
  disabled,
  testID,
  arrowIcon = "arrow-forward",
  filledColor = C.lime,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  arrowIcon?: keyof typeof Ionicons.glyphMap;
  filledColor?: string;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.ctaWrap,
        disabled && { opacity: 0.4 },
      ]}
    >
      <View style={[styles.ctaMain, { backgroundColor: filledColor }]}>
        <Text style={styles.ctaLabel}>{label}</Text>
      </View>
      <View style={styles.ctaArrow}>
        <Ionicons name={arrowIcon} size={22} color={C.ink} />
      </View>
    </TouchableOpacity>
  );
}

/** Secondary outline button. */
export function OutlineButton({
  label,
  onPress,
  testID,
  rightIcon,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.8} style={styles.outline}>
      <Text style={styles.outlineLabel}>{label}</Text>
      {rightIcon && <Ionicons name={rightIcon} size={16} color={C.ink} style={{ marginLeft: 8 }} />}
    </TouchableOpacity>
  );
}

/** Rating badge — lime number on ink (or ink on cream). */
export function RatingBadge({
  value,
  size = 44,
  variant = "lime-on-ink",
  testID,
}: {
  value: number;
  size?: number;
  variant?: "lime-on-ink" | "ink-on-cream";
  testID?: string;
}) {
  const bg = variant === "lime-on-ink" ? C.ink : C.cream;
  const fg = variant === "lime-on-ink" ? C.lime : C.ink;
  return (
    <View testID={testID} style={{ borderWidth: BORDER, borderColor: C.ink, backgroundColor: bg }}>
      <View style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
        <Text style={{ fontFamily: F.ub900, fontSize: size, color: fg, letterSpacing: -1, lineHeight: size * 1.05 }}>
          {value.toFixed(1)}
        </Text>
      </View>
      <View style={{ height: 4, backgroundColor: C.lime }} />
    </View>
  );
}

/** Stat chip — value + label. */
export function StatChip({
  value,
  label,
  bg = C.white,
  valueColor,
  testID,
}: {
  value: string;
  label: string;
  bg?: string;
  valueColor?: string;
  testID?: string;
}) {
  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: bg, paddingVertical: 14, paddingHorizontal: 8, alignItems: "center" }}>
      <Text style={{ fontFamily: F.ub900, fontSize: 24, color: valueColor ?? C.ink, letterSpacing: -1 }}>
        {value}
      </Text>
      <Text style={{ fontFamily: F.sans, fontSize: 9, letterSpacing: 1.2, color: valueColor ? valueColor : C.ink2, textTransform: "uppercase", marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

/** Avatar circle with initial fallback. */
export function Avatar({
  name,
  size = 40,
  bg = C.lime,
  testID,
}: {
  name?: string;
  size?: number;
  bg?: string;
  testID?: string;
}) {
  const i = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <View
      testID={testID}
      style={{
        width: size, height: size, backgroundColor: bg,
        borderWidth: BORDER, borderColor: C.ink,
        alignItems: "center", justifyContent: "center",
      }}>
      <Text style={{ fontFamily: F.ub900, color: C.ink, fontSize: size * 0.42 }}>{i}</Text>
    </View>
  );
}

/** Pill selector — used in onboarding. */
export function Pill({
  label,
  active,
  onPress,
  testID,
  style,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        {
          paddingHorizontal: 14, paddingVertical: 10,
          borderWidth: BORDER, borderColor: C.ink,
          backgroundColor: active ? C.lime : C.cream,
          minHeight: 44, justifyContent: "center", alignItems: "center",
        },
        style,
      ]}
    >
      <Text style={{ fontFamily: F.ub700, fontSize: 11, letterSpacing: -0.3, color: C.ink, textTransform: "uppercase" }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderWidth: BORDER,
    borderColor: C.ink,
  },
  ctaWrap: {
    flexDirection: "row",
    borderWidth: BORDER,
    borderColor: C.ink,
    minHeight: 56,
  },
  ctaMain: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRightWidth: BORDER,
    borderRightColor: C.ink,
  },
  ctaLabel: {
    fontFamily: F.ub900,
    fontSize: 14,
    color: C.ink,
    letterSpacing: -0.4,
    textTransform: "uppercase",
  },
  ctaArrow: {
    width: 56,
    backgroundColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  outline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 14,
    backgroundColor: C.white,
    borderWidth: BORDER,
    borderColor: C.ink,
  },
  outlineLabel: {
    fontFamily: F.ub700,
    fontSize: 12,
    color: C.ink,
    letterSpacing: -0.3,
    textTransform: "uppercase",
  },
});
