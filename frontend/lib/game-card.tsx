// Reusable GameCard for Home + Games feed.
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "./theme";
import { formatDate } from "./utils";

export function GameCard({
  game,
  venueName,
  onPress,
  badge,
  testID,
}: {
  game: any;
  venueName: string;
  onPress: () => void;
  badge?: string | null;
  testID?: string;
}) {
  const spotsLeft = 4 - (game.players?.length ?? 0);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.wrap} testID={testID}>
      <View style={styles.band}>
        <Text style={styles.bandText}>{venueName.toUpperCase()}</Text>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>⚡ {badge}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Text style={styles.date}>{formatDate(game.date)}</Text>
          <Text style={styles.dot}> · </Text>
          <Text style={styles.time}>{game.startTime}–{game.endTime}</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={styles.skillChip}>
            <Text style={styles.skillLabel}>{game.skillLabel.toUpperCase()}</Text>
            <Text style={styles.skillRange}>{game.skillLevelMin.toFixed(1)}–{game.skillLevelMax.toFixed(1)}</Text>
          </View>
          <View style={styles.spots}>
            <Text style={styles.spotsValue}>{spotsLeft}</Text>
            <Text style={styles.spotsLabel}>SPOTS</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={C.ink} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, marginBottom: 12 },
  band: {
    backgroundColor: C.coral,
    paddingHorizontal: 12, paddingVertical: 8,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderBottomWidth: BORDER, borderBottomColor: C.ink,
  },
  bandText: { fontFamily: F.ub900, color: C.white, fontSize: 13, letterSpacing: -0.3 },
  badge: { backgroundColor: C.lime, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: C.ink },
  badgeText: { fontFamily: F.ub900, fontSize: 9, color: C.ink, letterSpacing: 0.4 },
  body: { padding: 14 },
  date: { fontFamily: F.mono, color: C.ink, fontSize: 11 },
  dot: { fontFamily: F.mono, color: C.grey },
  time: { fontFamily: F.mono, color: C.ink, fontSize: 11, letterSpacing: 0.4 },
  skillChip: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: C.cream, borderWidth: BORDER, borderColor: C.ink },
  skillLabel: { fontFamily: F.ub700, fontSize: 9, color: C.ink, letterSpacing: 1 },
  skillRange: { fontFamily: F.mono, fontSize: 10, color: C.ink2, marginTop: 1 },
  spots: { alignItems: "center" },
  spotsValue: { fontFamily: F.ub900, fontSize: 28, color: C.ink, letterSpacing: -1, lineHeight: 30 },
  spotsLabel: { fontFamily: F.mono, fontSize: 8, color: C.grey, letterSpacing: 1.2 },
});
