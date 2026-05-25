// ═══════════════════════════════════════════════════════════════════
//  PADELMATCH BRAND KIT — Logo / Lockup / Mark (React Native)
//
//  Renders the official asset files shipped in the brand-kit zip,
//  never re-derives the artwork. PNG variants at @512 / @1024 are
//  bundled under /assets/brand/.
//
//    <Logo size={48}/>                     // default — mark on cream
//    <Logo size={48} variant="ink"/>       // dark surface variant
//    <Logo size={48} variant="white"/>
//    <Logo size={48} letter="P"/>          // P monogram (cream)
//    <Lockup size={220}/>                  // mark + PADEL MATCH wordmark
//    <Lockup size={220} showTagline/>      // + "Find the perfect match."
// ═══════════════════════════════════════════════════════════════════
import React from "react";
import { Image, View, Text, StyleProp, ViewStyle, ImageStyle } from "react-native";
import { T, F } from "../../lib/brand-tokens";
import { LOGO_GEOMETRY as G, LetterKey } from "../../lib/logo-geometry";

const ASSETS = {
  cream: require("../../assets/brand/mark-cream.png"),
  ink:   require("../../assets/brand/mark-ink.png"),
  white: require("../../assets/brand/mark-white.png"),
  P_cream: require("../../assets/brand/mark-p-cream.png"),
  M_cream: require("../../assets/brand/mark-m-cream.png"),
  appicon_cream: require("../../assets/brand/appicon-cream.png"),
  appicon_ink:   require("../../assets/brand/appicon-ink.png"),
  appicon_lime:  require("../../assets/brand/appicon-lime.png"),
  avatar_cream:  require("../../assets/brand/avatar-cream.png"),
  avatar_ink:    require("../../assets/brand/avatar-ink.png"),
};

export type MarkVariant = "cream" | "ink" | "white";

type LogoProps = {
  /** Height in px. Width = size × aspectRatio (2.5). */
  size?: number;
  /** Surface variant — picks the corresponding asset file. */
  variant?: MarkVariant;
  /** Optional monogram overlay (only the cream variant is shipped). */
  letter?: LetterKey | null;
  style?: StyleProp<ImageStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
};

function _resolveSource(variant: MarkVariant, letter: LetterKey | null) {
  if (letter === "P") return ASSETS.P_cream;
  if (letter === "M") return ASSETS.M_cream;
  return ASSETS[variant];
}

/**
 * The mark (no wordmark). Aspect ratio 2.5:1.
 */
export function Logo({
  size = 64,
  variant = "cream",
  letter = null,
  style,
  wrapperStyle,
}: LogoProps) {
  return (
    <View style={wrapperStyle}>
      <Image
        source={_resolveSource(variant, letter)}
        accessibilityLabel="PadelMatch logo"
        style={[
          { width: size * G.aspectRatio, height: size, resizeMode: "contain" },
          style,
        ]}
      />
    </View>
  );
}

/** Convenience alias matching the canonical kit's `<Mark/>` export. */
export const Mark = Logo;

// ─────────────────────────────────────────────────────────────────────
//  Lockup — mark + PADEL MATCH wordmark (+ optional tagline)
//  Cap-height ratios are calibrated for Unbounded 900 + DM Mono per the
//  canonical Logo.jsx. We render the wordmark with the loaded Unbounded
//  Black font (see app/_layout.tsx).
// ─────────────────────────────────────────────────────────────────────

const CAP_RATIO_WM = 0.73;
const CAP_RATIO_TAG = 0.7;
const TAG_FONT_RATIO = 0.3;
const TAG_GAP_RATIO = 0.18;
const VIS_COURT_RATIO = 32 / 36;

type LockupProps = {
  /** Mark width in px (height derives from aspectRatio). */
  size?: number;
  showTagline?: boolean;
  tagline?: string;
  /** Defaults to the cream/light surface variant. */
  variant?: MarkVariant;
  style?: StyleProp<ViewStyle>;
};

export function Lockup({
  size = 200,
  showTagline = false,
  tagline = "Find the perfect match.",
  variant = "cream",
  style,
}: LockupProps) {
  const markBoxH = size / G.aspectRatio;
  const visMarkH = markBoxH * VIS_COURT_RATIO;
  const visMarkTopOffset = markBoxH * (2 / 36);
  const wmSize = showTagline
    ? visMarkH / (CAP_RATIO_WM + TAG_GAP_RATIO + TAG_FONT_RATIO * CAP_RATIO_TAG)
    : visMarkH / CAP_RATIO_WM;
  const tagSize = wmSize * TAG_FONT_RATIO;
  const tagGap = wmSize * TAG_GAP_RATIO;
  const gap = markBoxH * 0.2;

  const onInk = variant === "ink";
  const inkBase = onInk ? T.white : T.ink;
  const tagColor = onInk ? "rgba(255,255,255,0.55)" : "rgba(17,17,24,0.55)";

  return (
    <View style={[{ flexDirection: "row", alignItems: "flex-start" }, style]}>
      <View style={{ marginTop: -visMarkTopOffset, marginRight: gap }}>
        <Logo size={markBoxH} variant={variant} />
      </View>
      <View style={{ flexDirection: "column" }}>
        <Text
          style={{
            fontFamily: F.display,
            fontSize: wmSize,
            letterSpacing: -wmSize * 0.04,
            lineHeight: wmSize,
            color: inkBase,
          }}
        >
          PADEL <Text style={{ color: T.lime }}>MATCH</Text>
        </Text>
        {showTagline && (
          <Text
            style={{
              fontFamily: F.mono,
              fontSize: tagSize,
              letterSpacing: tagSize * 0.12,
              lineHeight: tagSize * 1.1,
              color: tagColor,
              textTransform: "uppercase",
              marginTop: tagGap,
            }}
          >
            {tagline.toUpperCase()}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Additional canonical-asset accessors. These are non-mark assets
//  (app icon, avatar) that the brand kit ships as ready-made PNGs.
// ─────────────────────────────────────────────────────────────────────

type AppIconVariant = "cream" | "ink" | "lime";
export function AppIcon({
  size = 96,
  variant = "lime",
  style,
}: {
  size?: number;
  variant?: AppIconVariant;
  style?: StyleProp<ImageStyle>;
}) {
  const source =
    variant === "ink" ? ASSETS.appicon_ink :
    variant === "lime" ? ASSETS.appicon_lime :
    ASSETS.appicon_cream;
  return (
    <Image
      source={source}
      accessibilityLabel="PadelMatch app icon"
      style={[{ width: size, height: size, resizeMode: "contain" }, style]}
    />
  );
}

export function BrandAvatar({
  size = 80,
  variant = "cream",
  style,
}: {
  size?: number;
  variant?: "cream" | "ink";
  style?: StyleProp<ImageStyle>;
}) {
  const source = variant === "ink" ? ASSETS.avatar_ink : ASSETS.avatar_cream;
  return (
    <Image
      source={source}
      accessibilityLabel="PadelMatch avatar"
      style={[{ width: size, height: size, resizeMode: "contain" }, style]}
    />
  );
}
