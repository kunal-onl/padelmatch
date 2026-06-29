// Court-Comfort Map (strokes self-reflection) — lives inside Grow.
// A top-down padel court the player paints fluency onto, by position. Two levels:
// the overview heatmap (the glance) and the per-cell drill-down (rate each shot
// 0–6, one tap). Renders only the cells present in shot-taxonomy.json (incomplete
// by design) and tolerates stubs. A gap is an opportunity, never an error — the
// gradient is neutral→lime, never coral.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "../lib/theme";
import { Heading, MicroLabel, Body } from "../lib/ui";
import { api } from "../lib/api";
import {
  Side, SIDES, BANDS, COLS, BAND_LABEL, COL_LABEL, COMFORT_LABELS, LEFT_NOT_STARTED,
  cellsForSide, cellAgg, comfortColor, comfortKey, shotName, videoForShot, Cell,
} from "../lib/court-comfort";

export default function ComfortMap() {
  const router = useRouter();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [first, setFirst] = useState<Record<string, number>>({});
  const [side, setSide] = useState<Side>("right");
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await api.getComfort();
      setRatings(d?.ratings || {});
      setFirst(d?.first || {});
    } catch {}
  }, []);
  useEffect(() => { load(); }, [load]);

  const cells = useMemo(() => cellsForSide(side), [side]);
  const byKey: Record<string, Cell> = useMemo(() => Object.fromEntries(cells.map((c) => [c.key, c])), [cells]);
  const selectedCell = selected ? byKey[selected] : null;
  const totalRated = Object.keys(ratings).length;

  const rate = (cell: Cell, shotId: string, v: number) => {
    setRatings((prev) => ({ ...prev, [comfortKey(cell.key, shotId)]: v }));
    api.setComfort(cell.key, shotId, v).catch(() => {});
  };

  const learn = (shotId: string) => {
    const url = videoForShot(shotId);
    if (url) router.push(url as any);
    else Alert.alert("Learning content coming", "We're curating a video for this shot. Your gap is logged — it helps us prioritise what to add next.");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="comfort-back" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={22} color={C.white} />
        </TouchableOpacity>
        <Heading size={16} color={C.white} style={{ marginLeft: 8 }}>COURT-COMFORT MAP</Heading>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Side toggle — default to the player's side; the other is secondary. */}
        <View style={styles.sideRow}>
          {SIDES.map((s) => (
            <TouchableOpacity key={s} testID={`comfort-side-${s}`} onPress={() => { setSide(s); setSelected(null); }}
              style={[styles.sidePill, side === s && styles.sidePillActive]}>
              <Text style={[styles.sidePillText, side === s && { color: C.ink }]}>{s.toUpperCase()} SIDE</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cold-start invitation (authored, not a failure). */}
        {totalRated === 0 && (
          <View style={styles.invite}>
            <Text style={styles.inviteTitle}>THIS IS YOUR GAME, UNCHARTED</Text>
            <Body size={11} color={C.grey} style={{ marginTop: 6, lineHeight: 16 }}>
              Tap a position and rate the shots you play from there. Where on the court do you go mute?
            </Body>
          </View>
        )}

        {side === "left" && LEFT_NOT_STARTED ? (
          <View style={styles.invite}>
            <Body size={12} color={C.grey}>The left-side vocabulary is still being built. Map your right side first.</Body>
          </View>
        ) : (
          <>
            <View style={styles.netHint}><Text style={styles.netHintText}>NET ▲</Text></View>
            {/* Overview heatmap — net (top) → baseline (bottom). */}
            {BANDS.map((band) => (
              <View key={band} style={styles.courtRow}>
                <Text style={styles.bandLabel}>{BAND_LABEL[band] || band.toUpperCase()}</Text>
                <View style={{ flexDirection: "row", flex: 1 }}>
                  {COLS.map((col) => {
                    const cell = byKey[`${side}/${band}-${col}`];
                    const agg = cell ? cellAgg(cell, ratings) : null;
                    const hasShots = !!cell && cell.shotIds.length > 0;
                    const isSel = selected === cell?.key;
                    return (
                      <TouchableOpacity
                        key={col}
                        testID={`comfort-cell-${band}-${col}`}
                        disabled={!hasShots}
                        activeOpacity={0.8}
                        onPress={() => setSelected(cell!.key)}
                        style={[
                          styles.cell,
                          { backgroundColor: hasShots ? comfortColor(agg!.avg) : C.cream },
                          !hasShots && styles.cellEmpty,
                          isSel && styles.cellSelected,
                        ]}
                      >
                        <Text style={styles.cellCol}>{COL_LABEL[col] || col.toUpperCase()}</Text>
                        {hasShots ? (
                          <Text style={styles.cellReading}>
                            {agg!.avg !== null ? agg!.avg.toFixed(1) : (agg!.ratedCount > 0 ? "—" : "·")}
                          </Text>
                        ) : (
                          <Text style={styles.cellSoon}>soon</Text>
                        )}
                        {!!agg && agg.undiscovered > 0 && (
                          <View style={styles.undiscBadge}><Text style={styles.undiscText}>{agg.undiscovered}?</Text></View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
            <View style={styles.netHint}><Text style={styles.netHintText}>BASELINE ▼</Text></View>

            <Body size={10} color={C.grey} style={{ marginTop: 4 }}>
              Average over shots you know · a “?” count = shots you haven’t met yet · neutral → lime = low → high comfort
            </Body>
          </>
        )}

        {/* Drill-down for the selected cell. */}
        {selectedCell && (
          <View style={{ marginTop: 22 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Heading size={12}>{(BAND_LABEL[selectedCell.band] || selectedCell.band.toUpperCase())} · {(COL_LABEL[selectedCell.col] || selectedCell.col.toUpperCase())}</Heading>
              <BeforeAfter cell={selectedCell} ratings={ratings} first={first} />
            </View>
            <View style={{ height: 10 }} />
            {selectedCell.shotIds.map((sid) => {
              const v = ratings[comfortKey(selectedCell.key, sid)];
              const showLearn = v === 0 || v === 1;
              return (
                <View key={sid} style={styles.shotCard} testID={`comfort-shot-${sid}`}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={styles.shotName}>{shotName(sid).toUpperCase()}</Text>
                    <Text style={styles.shotVal}>{v === undefined ? "TAP TO RATE" : COMFORT_LABELS[v].toUpperCase()}</Text>
                  </View>
                  <View style={styles.scaleRow}>
                    {[0, 1, 2, 3, 4, 5, 6].map((n) => {
                      const on = v === n;
                      return (
                        <TouchableOpacity key={n} testID={`comfort-rate-${sid}-${n}`} onPress={() => rate(selectedCell, sid, n)}
                          style={[styles.scaleCell, on && styles.scaleCellOn]} activeOpacity={0.8}>
                          <Text style={[styles.scaleNum, on && { color: C.ink }]}>{n}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {showLearn && (
                    <TouchableOpacity testID={`comfort-learn-${sid}`} onPress={() => learn(sid)} style={styles.learnRow} activeOpacity={0.8}>
                      <Ionicons name="play-circle-outline" size={15} color={C.ink} />
                      <Text style={styles.learnText}>LEARN THIS →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
            {selectedCell.shotIds.length === 0 && (
              <Body size={11} color={C.grey}>This position’s vocabulary isn’t mapped yet.</Body>
            )}
          </View>
        )}

        {!selectedCell && side === "right" && (
          <Body size={11} color={C.grey} style={{ marginTop: 18 }}>
            Tap a lit position above to rate the shots you play from there.
          </Body>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Basic before/after: current cell average vs the first-ever average.
function BeforeAfter({ cell, ratings, first }: { cell: Cell; ratings: Record<string, number>; first: Record<string, number> }) {
  const now = cellAgg(cell, ratings).avg;
  const then = cellAgg(cell, first).avg;
  if (now === null || then === null) return null;
  const delta = now - then;
  if (Math.abs(delta) < 0.25) return null;
  const up = delta > 0;
  return (
    <Text style={[styles.trend, { color: up ? C.win : C.grey }]}>
      {up ? "▲" : "▼"} {Math.abs(delta).toFixed(1)} since you started
    </Text>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  header: {
    backgroundColor: C.ink, paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: "row", alignItems: "center",
    borderBottomWidth: BORDER, borderBottomColor: C.lime,
  },
  sideRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  sidePill: { borderWidth: BORDER, borderColor: C.ink, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: C.white },
  sidePillActive: { backgroundColor: C.lime },
  sidePillText: { fontFamily: F.mono, fontSize: 10, color: C.grey, letterSpacing: 1 },
  invite: { backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, padding: 14, marginBottom: 14 },
  inviteTitle: { fontFamily: F.ub900, fontSize: 13, color: C.ink, letterSpacing: -0.2 },
  netHint: { alignItems: "center", paddingVertical: 3 },
  netHintText: { fontFamily: F.mono, fontSize: 9, color: C.grey, letterSpacing: 2 },
  courtRow: { flexDirection: "row", alignItems: "stretch", marginBottom: 6 },
  bandLabel: { width: 74, fontFamily: F.mono, fontSize: 9, color: C.grey, letterSpacing: 1, alignSelf: "center" },
  cell: { flex: 1, marginHorizontal: 3, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: C.ink },
  cellEmpty: { borderColor: "rgba(0,0,0,0.18)", borderStyle: "dashed" },
  cellSelected: { borderWidth: 3, borderColor: C.ink },
  cellCol: { fontFamily: F.ub700, fontSize: 9, color: C.ink, letterSpacing: 0.6 },
  cellReading: { fontFamily: F.ub900, fontSize: 16, color: C.ink, marginTop: 2 },
  cellSoon: { fontFamily: F.mono, fontSize: 9, color: C.grey, marginTop: 4 },
  undiscBadge: { position: "absolute", top: 3, right: 3, backgroundColor: C.ink, paddingHorizontal: 4, paddingVertical: 1 },
  undiscText: { fontFamily: F.mono, fontSize: 8, color: C.lime, letterSpacing: 0.4 },
  shotCard: { backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, padding: 12, marginBottom: 8 },
  shotName: { fontFamily: F.ub700, fontSize: 12, color: C.ink, letterSpacing: -0.2, flex: 1 },
  shotVal: { fontFamily: F.mono, fontSize: 9, color: C.grey, letterSpacing: 0.8 },
  scaleRow: { flexDirection: "row", marginTop: 10, gap: 4 },
  scaleCell: { flex: 1, paddingVertical: 9, alignItems: "center", borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.cream },
  scaleCellOn: { backgroundColor: C.lime },
  scaleNum: { fontFamily: F.ub900, fontSize: 13, color: C.grey },
  learnRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  learnText: { fontFamily: F.ub700, fontSize: 11, color: C.ink, letterSpacing: 0.6, marginLeft: 6 },
  trend: { fontFamily: F.mono, fontSize: 10, letterSpacing: 0.6 },
});
