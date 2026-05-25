// ═══════════════════════════════════════════════════════════════════
//  PADELMATCH BRAND KIT — Background textures (React Native)
//  Web CSS uses repeating-linear-gradient + radial-gradient. In RN
//  we render an absolutely-positioned react-native-svg <Pattern> as
//  the background layer of a wrapper view.
// ═══════════════════════════════════════════════════════════════════
import React from "react";
import { View, StyleProp, ViewStyle, StyleSheet } from "react-native";
import Svg, { Defs, Pattern, Rect, Circle, Line } from "react-native-svg";
import { T } from "../../lib/brand-tokens";

type Variant = "perforations" | "courtLines" | "glassPanels" | "wireFence";

type Props = {
  variant: Variant;
  opacity?: number;       // 0..1, defaults to T.txStandard
  color?: string;         // pattern stroke colour
  size?: number;          // for perforations / wireFence — tile size
  /** Optional wrapper bg — set to T.cream / T.ink / T.lime etc. */
  background?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/**
 * Wrap any content in a textured background:
 *   <Texture variant="courtLines"><MyCard/></Texture>
 */
export function Texture({
  variant,
  opacity = T.txStandard,
  color = T.ink,
  size,
  background,
  style,
  children,
}: Props) {
  return (
    <View style={[{ backgroundColor: background, overflow: "hidden" }, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <PatternSvg variant={variant} opacity={opacity} color={color} size={size} />
      </View>
      {children}
    </View>
  );
}

function PatternSvg({
  variant,
  opacity,
  color,
  size,
}: {
  variant: Variant;
  opacity: number;
  color: string;
  size?: number;
}) {
  const id = `pm-tex-${variant}`;
  switch (variant) {
    case "perforations": {
      const tile = size ?? 14;
      return (
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <Pattern id={id} x="0" y="0" width={tile} height={tile} patternUnits="userSpaceOnUse">
              <Circle cx={tile / 2} cy={tile / 2} r={1.5} fill={color} fillOpacity={opacity} />
            </Pattern>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
        </Svg>
      );
    }
    case "courtLines": {
      return (
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <Pattern id={id} x="0" y="0" width={60} height={30} patternUnits="userSpaceOnUse">
              {/* Horizontal court line every 30 */}
              <Line x1="0" y1={30 - 1} x2="60" y2={30 - 1} stroke={color} strokeOpacity={opacity} strokeWidth={1} />
              {/* Vertical line every 60 */}
              <Line x1={60 - 1} y1="0" x2={60 - 1} y2="30" stroke={color} strokeOpacity={opacity} strokeWidth={1} />
            </Pattern>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
        </Svg>
      );
    }
    case "glassPanels": {
      return (
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <Pattern id={id} x="0" y="0" width={88} height={44} patternUnits="userSpaceOnUse">
              <Line x1="0" y1={44 - 1} x2="88" y2={44 - 1} stroke={color} strokeOpacity={opacity} strokeWidth={1} />
              <Line x1={88 - 1} y1="0" x2={88 - 1} y2="44" stroke={color} strokeOpacity={opacity} strokeWidth={1} />
            </Pattern>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
        </Svg>
      );
    }
    case "wireFence": {
      const tile = size ?? 10;
      return (
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <Pattern id={id} x="0" y="0" width={tile} height={tile} patternUnits="userSpaceOnUse">
              <Line x1="0" y1="0" x2={tile} y2={tile} stroke={color} strokeOpacity={opacity} strokeWidth={1} />
              <Line x1={tile} y1="0" x2="0" y2={tile} stroke={color} strokeOpacity={opacity} strokeWidth={1} />
            </Pattern>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
        </Svg>
      );
    }
  }
}

/** Convenience aliases mirroring the CSS class names. */
export const Perforations = (p: Omit<Props, "variant">) => <Texture variant="perforations" {...p} />;
export const CourtLines  = (p: Omit<Props, "variant">) => <Texture variant="courtLines" {...p} />;
export const GlassPanels = (p: Omit<Props, "variant">) => <Texture variant="glassPanels" {...p} />;
export const WireFence   = (p: Omit<Props, "variant">) => <Texture variant="wireFence" {...p} />;
