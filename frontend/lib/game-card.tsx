// Reusable Game Card with 6-state visual variants per the Game Journey
// Rework (Feb→Jun 2026 spec):
//
// PLANNING:    blue top accent, "PLANNING" chip — host assembling roster
// NEEDS_COURT: lime top accent, "NEEDS COURT" chip — full, awaiting book
// CONFIRMED:   lime top accent, "CONFIRMED ✓" chip — court booked (the
//              real commitment; previously called BOOKED)
// PLAYED:      grey top accent, "HOW DID IT GO?" chip — end-time past
// SCORED:      grey top accent, "SCORED" chip — score entered
// CANCELLED:   coral top accent, "CANCELLED" chip, greyed out
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { C, F, BORDER } from "./theme";
import { Avatar } from "./ui";

type StateVisual = { accent: string; chipBg: string; chipFg: string; chipText: string };

const STATE_VISUALS: Record<string, StateVisual> = {
  PLANNING:    { accent: C.blue,   chipBg: C.blue,   chipFg: C.white, chipText: "PLANNING" },
  NEEDS_COURT: { accent: C.lime,   chipBg: C.lime,   chipFg: C.ink,   chipText: "NEEDS COURT" },
  CONFIRMED:   { accent: C.lime,   chipBg: C.ink,    chipFg: C.lime,  chipText: "CONFIRMED ✓" },
  PLAYED:      { accent: C.grey,   chipBg: C.cream,  chipFg: C.ink,   chipText: "HOW DID IT GO?" },
  SCORED:      { accent: C.grey,   chipBg: C.ink,    chipFg: C.white, chipText: "SCORED" },
  CANCELLED:   { accent: C.coral,  chipBg: C.coral,  chipFg: C.white, chipText: "CANCELLED" },
};

function getVisual(status?: string): StateVisual {
  return STATE_VISUALS[String(status || "PLANNING").toUpperCase()] || STATE_VISUALS.PLANNING;
}

export function GameCard({
  game,
  venue,
  players,
  onPress,
  testID,
}: {
  game: any;
  venue: any;
  players: Record<string, any>;
  onPress: () => void;
  testID?: string;
}) {
  const visual = getVisual(game.status);
  const isCancelled = game.status === "CANCELLED";
  const isGameType = (game.gameType || "competitive") as "competitive" | "social";

  const dateLabel = (() => {
    const d = new Date(game.date);
    return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }).toUpperCase();
  })();

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, isCancelled && { opacity: 0.55 }]}
    >
      <View style={[styles.accent, { backgroundColor: visual.accent }]} />
      <View style={{ padding: 14 }}>
        <View style={styles.headerRow}>
          <Text style={styles.venue} numberOfLines={1}>
            {venue?.name?.toUpperCase() || "VENUE"} · {venue?.area?.toUpperCase() || ""}
          </Text>
          <View style={[styles.chip, { backgroundColor: visual.chipBg, borderColor: C.ink }]}>
            <Text style={[styles.chipText, { color: visual.chipFg }]}>{visual.chipText}</Text>
          </View>
        </View>

        <Text style={styles.when}>
          {dateLabel} · {game.startTime}–{game.endTime}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.skill}>{game.skillLabel.toUpperCase()} · {game.skillLevelMin}–{game.skillLevelMax}</Text>
          <View
            style={[
              styles.typeChip,
              isGameType === "social"
                ? { backgroundColor: C.cream, borderColor: C.ink }
                : { backgroundColor: C.ink, borderColor: C.ink },
            ]}
          >
            <Text
              style={[
                styles.typeChipText,
                { color: isGameType === "social" ? C.grey : C.lime },
              ]}
            >
              {isGameType.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.playersRow}>
          {(game.players || []).slice(0, 4).map((pid: string) => (
            <Avatar key={pid} name={players[pid]?.name || pid} size={26} style={{ marginRight: -6 }} />
          ))}
          {Array.from({ length: Math.max(0, 4 - (game.players?.length || 0)) }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.emptySlot} />
          ))}
          <Text style={styles.openSpots}>
            {game.status === "PLANNING"
              ? `${4 - (game.players?.length || 0)} OPEN`
              : `${game.players?.length || 0}/4`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderWidth: BORDER, borderColor: C.ink,
    marginBottom: 12,
  },
  accent: { height: 4 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  venue: { fontFamily: F.ub900, fontSize: 13, color: C.ink, letterSpacing: -0.3, flex: 1, marginRight: 8 },
  chip: { paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  chipText: { fontFamily: F.ub900, fontSize: 9, letterSpacing: 1 },
  when: { fontFamily: F.mono, fontSize: 11, color: C.grey, letterSpacing: 1.2, marginTop: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  skill: { fontFamily: F.mono, fontSize: 10, color: C.ink, letterSpacing: 1 },
  typeChip: { paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  typeChipText: { fontFamily: F.ub900, fontSize: 8, letterSpacing: 1 },
  playersRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  emptySlot: {
    width: 26, height: 26,
    borderWidth: 1.5, borderStyle: "dashed", borderColor: C.grey,
    marginRight: -6, backgroundColor: "transparent",
  },
  openSpots: {
    fontFamily: F.mono, fontSize: 10, color: C.grey, letterSpacing: 1.2,
    marginLeft: 12,
  },
});
