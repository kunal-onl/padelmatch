// ═══════════════════════════════════════════════════════════════════
//  PADELMATCH BRAND KIT — Container variants A–F + NetDivider (RN)
//  All radii 0px, ink borders, brand-token spacing.
// ═══════════════════════════════════════════════════════════════════
import React from "react";
import { View, Text, StyleProp, ViewStyle, StyleSheet } from "react-native";
import { T, F } from "../../lib/brand-tokens";

type Props = {
  children?: React.ReactNode;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

function Label({ text }: { text: string }) {
  return (
    <Text
      style={{
        fontFamily: F.mono,
        fontSize: 9,
        color: T.grey,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        marginBottom: T.sp2,
      }}
    >
      {text}
    </Text>
  );
}

/** A — Heavy 3px ink border + inner inset gap. */
export function ContainerA({ children, label, style }: Props) {
  return (
    <View style={[styles.a, style]}>
      {label && <Label text={label} />}
      {children}
    </View>
  );
}

/** B — Corner brackets, no full border. */
export function ContainerB({ children, label, style }: Props) {
  return (
    <View style={[styles.bWrap, style]}>
      {/* TL bracket */}
      <View style={[styles.corner, styles.tl]} />
      {/* BR bracket */}
      <View style={[styles.corner, styles.br]} />
      <View style={styles.bInner}>
        {label && <Label text={label} />}
        {children}
      </View>
    </View>
  );
}

/** C — Left accent stroke. */
export function ContainerC({
  children,
  label,
  accentColor = T.ink,
  style,
}: Props & { accentColor?: string }) {
  return (
    <View
      style={[
        { borderLeftWidth: T.accentLeft, borderLeftColor: accentColor, paddingLeft: T.sp4 },
        style,
      ]}
    >
      {label && <Label text={label} />}
      {children}
    </View>
  );
}

/** D — Top accent stroke. */
export function ContainerD({
  children,
  label,
  accentColor = T.ink,
  style,
}: Props & { accentColor?: string }) {
  return (
    <View
      style={[
        { borderTopWidth: T.accentTop, borderTopColor: accentColor, paddingTop: T.sp3 },
        style,
      ]}
    >
      {label && <Label text={label} />}
      {children}
    </View>
  );
}

/** E — 2px border with the right side intentionally open. */
export function ContainerE({ children, label, style }: Props) {
  return (
    <View
      style={[
        {
          borderTopWidth: T.s2,
          borderBottomWidth: T.s2,
          borderLeftWidth: T.s2,
          borderColor: T.ink,
          padding: T.sp4,
        },
        style,
      ]}
    >
      {label && <Label text={label} />}
      {children}
    </View>
  );
}

/** F — Dashed 2px ink border. */
export function ContainerF({ children, label, style }: Props) {
  return (
    <View
      style={[
        {
          borderWidth: T.s2,
          borderColor: T.ink,
          borderStyle: "dashed",
          padding: T.sp4,
        },
        style,
      ]}
    >
      {label && <Label text={label} />}
      {children}
    </View>
  );
}

/** Glass-style inset card on white background. */
export function GlassInset({ children, label, style }: Props) {
  return (
    <View
      style={[
        {
          borderWidth: T.s1,
          borderColor: T.border,
          padding: T.sp4,
          backgroundColor: "rgba(255,255,255,0.5)",
        },
        style,
      ]}
    >
      {label && <Label text={label} />}
      {children}
    </View>
  );
}

/** Vertical "net" divider — pairs with horizontal layouts. */
export function NetDivider({
  height = 24,
  style,
}: {
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ width: T.s2, backgroundColor: T.ink, height }, style]} />;
}

const styles = StyleSheet.create({
  a: {
    borderWidth: T.s3,
    borderColor: T.ink,
    padding: T.innerInset,
  },
  bWrap: {
    position: "relative",
    padding: T.sp5,
  },
  bInner: { /* content lives inside the brackets */ },
  corner: {
    position: "absolute",
    width: T.cornerMark,
    height: T.cornerMark,
    borderColor: T.ink,
  },
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: T.s2,
    borderLeftWidth: T.s2,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: T.s2,
    borderRightWidth: T.s2,
  },
});
