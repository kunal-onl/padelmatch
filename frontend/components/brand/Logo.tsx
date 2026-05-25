// ═══════════════════════════════════════════════════════════════════
//  PADELMATCH BRAND KIT — Logo / Lockup / Mark (React Native)
// ═══════════════════════════════════════════════════════════════════
import React from "react";
import { View, Text, StyleProp, ViewStyle } from "react-native";
import Svg, { Rect, Path } from "react-native-svg";
import { T, F } from "../../lib/brand-tokens";
import { LOGO_GEOMETRY as G, LetterKey } from "../../lib/logo-geometry";

type CellKey = "TL" | "TR" | "BL" | "BR";
type CellFills = Partial<Record<CellKey, string>>;

const DEFAULT_FILLS: CellFills = { TL: T.blue, BR: T.lime };

export function Logo({
  size = 64,
  cellFills = DEFAULT_FILLS,
  onInk = false,
  letter = null,
  style,
}: {
  size?: number;
  cellFills?: CellFills;
  onInk?: boolean;
  letter?: LetterKey | null;
  style?: StyleProp<ViewStyle>;
}) {
  const stroke = onInk ? T.white : T.ink;
  const letterRects = letter ? G.letterRects[letter] : null;
  const letterColor = letter === "P" ? T.lime : T.blue;
  const width = size * G.aspectRatio;

  return (
    <View style={style}>
      <Svg width={width} height={size} viewBox={G.viewBox}>
        {!letter &&
          (Object.keys(cellFills) as CellKey[]).map((key) => {
            const c = G.cells[key];
            const color = cellFills[key];
            if (!c || !color) return null;
            return <Rect key={key} x={c.x} y={c.y} width={c.w} height={c.h} fill={color} />;
          })}
        <Path d={G.courtPath} fill={stroke} fillRule="evenodd" />
        <Rect x={G.net.x} y={G.net.y} width={G.net.w} height={G.net.h} fill={stroke} />
        {letterRects &&
          letterRects.map((r, i) => (
            <Rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={letterColor} />
          ))}
      </Svg>
    </View>
  );
}

const CAP_RATIO_WM = 0.73;
const CAP_RATIO_TAG = 0.7;
const TAG_FONT_RATIO = 0.3;
const TAG_GAP_RATIO = 0.18;
const VIS_COURT_RATIO = 32 / 36;

export function Lockup({
  size = 200,
  showTagline = false,
  tagline = "Find the perfect match.",
  onInk = false,
  cellFills = DEFAULT_FILLS,
  style,
}: {
  size?: number;
  showTagline?: boolean;
  tagline?: string;
  onInk?: boolean;
  cellFills?: CellFills;
  style?: StyleProp<ViewStyle>;
}) {
  const markBoxH = size / G.aspectRatio;
  const visMarkH = markBoxH * VIS_COURT_RATIO;
  const visMarkTopOffset = markBoxH * (2 / 36);

  const wmSize = showTagline
    ? visMarkH / (CAP_RATIO_WM + TAG_GAP_RATIO + TAG_FONT_RATIO * CAP_RATIO_TAG)
    : visMarkH / CAP_RATIO_WM;
  const tagSize = wmSize * TAG_FONT_RATIO;
  const tagGap = wmSize * TAG_GAP_RATIO;
  const gap = markBoxH * 0.2;

  const inkBase = onInk ? T.white : T.ink;
  const tagColor = onInk ? "rgba(255,255,255,0.55)" : "rgba(17,17,24,0.55)";

  return (
    <View style={[{ flexDirection: "row", alignItems: "flex-start" }, style]}>
      <View style={{ marginTop: -visMarkTopOffset, marginRight: gap }}>
        <Logo size={markBoxH} cellFills={cellFills} onInk={onInk} />
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

export function Mark(props: React.ComponentProps<typeof Logo>) {
  return <Logo {...props} />;
}
