// Grow — the home of "potential" (product spine §5). The between-games
// destination: your Growth Record (four-domain radar, rating, match-derived
// stats, trajectory), the court-comfort map (strokes self-reflection, reads
// shot-taxonomy.json), and the learning library.
//
// IA refactor: the Growth Record migrated here OUT of Profile (Profile is now
// administrative only). The radar is moved AS-IS (the self-improvement-score
// spec owns its internals). The court-comfort map here is the tolerant SHELL —
// it renders whatever cells the taxonomy contains; the full drill-down + 0–6
// rating + library interlock land in the dedicated court-comfort-map pass.
import React, { useCallback, useMemo, useState } from "react";
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import Svg, { Polyline, Polygon, Line, Text as SvgText } from "react-native-svg";
import { C, F, BORDER } from "../../lib/theme";
import { MicroLabel, StatChip, Heading, Body } from "../../lib/ui";
import { api } from "../../lib/api";
import { usePlayer } from "../../lib/context";
import taxonomy from "../../lib/shot-taxonomy.json";

// Self-Improvement Score — four independent domains (the re-scoped radar).
const DOMAIN_AXES: { key: "strokes" | "tactics" | "inner" | "outer"; label: string }[] = [
  { key: "strokes", label: "STROKES" },
  { key: "tactics", label: "TACTICS" },
  { key: "inner", label: "INNER" },
  { key: "outer", label: "OUTER" },
];
const TIER_BANDS = ["", "BEGINNER", "LATE BEGINNER", "LOWER INT.", "INTERMEDIATE", "HIGH INT.", "ADVANCED"];

// Court-comfort map (shell). Short tactical-role labels for the vertical bands.
const TAX: any = taxonomy;
const BAND_LABEL: Record<string, string> = {
  "net": "NET", "attack-control": "ATTACK",
  "recovery-transition": "TRANSITION", "defense": "DEFENSE",
};

export default function Grow() {
  const router = useRouter();
  const { player, refresh } = usePlayer();
  const [domains, setDomains] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const d = await api.getDomains().catch(() => null);
    setDomains(d?.domains || null);
  }, []);
  useFocusEffect(useCallback(() => { refresh().then(load); }, [load, refresh]));

  const history: any[] = player?.gameRatingHistory || [];
  const sparkPoints = useMemo(() => {
    if (history.length < 2) return "";
    const W = 320, H = 60, P = 6;
    const min = Math.min(...history.map((h) => h.rating));
    const max = Math.max(...history.map((h) => h.rating));
    const span = Math.max(0.4, max - min);
    return history.slice(-10).map((h, i, arr) => {
      const x = P + (i / (arr.length - 1)) * (W - P * 2);
      const y = H - P - ((h.rating - min) / span) * (H - P * 2);
      return `${x},${y}`;
    }).join(" ");
  }, [history]);

  const domainRadar = useMemo(() =>
    DOMAIN_AXES.map(({ key, label }) => ({
      key, label,
      value: domains?.[key]?.tier ?? 0,
      rated: !!domains?.[key],
    })), [domains]);

  // Court-comfort cells for the player's side (default right). Render whatever
  // the taxonomy contains; tolerate stubbed/missing cells without breaking.
  const side = "right";
  const courtCells = TAX?.cells?.[side] || {};
  const bands: string[] = TAX?.vertical_bands?.order_net_to_baseline || [];
  const cols: string[] = TAX?.horizontal_bands?.order_side_to_center || [];
  const chartedCount = Object.values(courtCells).filter(
    (c: any) => c && Array.isArray(c.shot_ids) && c.shot_ids.length > 0).length;

  if (!player) return <SafeAreaView style={styles.safe} />;

  const winRate = player.matchesPlayed > 0 ? Math.round((player.wins / player.matchesPlayed) * 100) : 0;
  const isEstimated = (player.gameRatingStatus || "estimated") === "estimated";
  const lastTen = history.slice(-10);
  const sparkDelta = lastTen.length >= 2 ? Math.round((lastTen[lastTen.length - 1].rating - lastTen[0].rating) * 10) / 10 : 0;
  const deltaPositive = sparkDelta >= 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Heading size={24} color={C.white}>GROW</Heading>
        <View style={{ height: 6 }} />
        <MicroLabel color="rgba(255,255,255,0.55)">YOUR GAME, OVER TIME</MicroLabel>
        <View style={styles.limeRule} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refresh(); await load(); setRefreshing(false); }} />}
      >
        {/* Rating — estimated (<5 matches) gets a muted, smaller treatment. */}
        <View style={styles.ratingBlock}>
          <MicroLabel color={isEstimated ? C.grey : C.lime}>GAME RATING</MicroLabel>
          <Text style={[styles.ratingNum, isEstimated && styles.ratingNumEstimated]} testID="own-rating">
            {player.gameRating.toFixed(1)}
          </Text>
          <View style={{ height: 4, width: isEstimated ? 60 : 100, backgroundColor: isEstimated ? C.border : C.lime, marginTop: 4 }} />
          <Text style={styles.statusLabel}>{(player.gameRatingStatus || "estimated").toUpperCase()}</Text>
          {isEstimated ? (
            <Body size={10} color={C.grey} style={{ marginTop: 8, maxWidth: 290, textAlign: "center", lineHeight: 15 }}>
              Estimated from your skill survey — not yet adjusted by match results.
            </Body>
          ) : (
            sparkDelta !== 0 && (
              <Text style={[styles.trend, { color: deltaPositive ? C.win : C.loss }]}>
                {deltaPositive ? "▲" : "▼"} {Math.abs(sparkDelta).toFixed(1)} RECENT
              </Text>
            )
          )}
        </View>

        {player.communityRank && (
          <View style={styles.rankBand}>
            <Text style={styles.rankBandText}>#{player.communityRank} IN NORTH GOA PADEL</Text>
          </View>
        )}

        <View style={styles.statStrip}>
          <StatChip bg={C.white} value={String(player.matchesPlayed)} label="MATCHES" />
          <View style={styles.div} />
          <StatChip bg={C.lime} value={String(player.wins)} label="WINS" />
          <View style={styles.div} />
          <StatChip bg={C.coral} valueColor={C.white} value={String(player.losses)} label="LOSSES" />
          <View style={styles.div} />
          <StatChip bg={C.white} value={`${winRate}%`} label="WIN RATE" />
        </View>

        {/* Rating trend */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Heading size={11}>RATING TREND</Heading>
          <View style={styles.chartCard}>
            {history.length >= 2 ? (
              <Svg width="100%" height={70} viewBox="0 0 320 60" preserveAspectRatio="none">
                <Polyline points={sparkPoints} fill="none" stroke={C.lime} strokeWidth={3} />
              </Svg>
            ) : (
              <Body size={11} color={C.grey}>Not enough match data yet.</Body>
            )}
          </View>
        </View>

        {/* Skill domains — four independent tiers, never collapsed. */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Heading size={11}>SKILL DOMAINS</Heading>
            <View style={styles.authorshipTag} testID="domain-authorship">
              <Text style={styles.authorshipText}>SELF-ASSESSED</Text>
            </View>
          </View>
          <View style={styles.chartCard}>
            {domains ? (
              <>
                <RadarChart data={domainRadar} />
                <View style={styles.domainLegend}>
                  {domainRadar.map((d) => (
                    <View key={d.key} style={styles.domainLegendRow} testID={`domain-${d.key}`}>
                      <Text style={styles.domainLegendLabel}>{d.label}</Text>
                      <Text style={styles.domainLegendBand}>
                        {d.rated ? `${TIER_BANDS[d.value]} · ${d.value}/6` : "NOT RATED YET"}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Body size={11} color={C.grey}>Not rated yet — complete your skill check-in.</Body>
            )}
          </View>
        </View>

        {/* Court-comfort map (shell — renders the taxonomy's cells; rating next pass) */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Heading size={11}>COURT-COMFORT MAP</Heading>
          <Body size={11} color={C.grey} style={{ marginTop: 6, lineHeight: 16 }}>
            Where on the court do you go mute? This is your game, uncharted — start mapping your fluency by position.
          </Body>
          <View style={styles.courtCard}>
            {bands.length > 0 && cols.length > 0 ? (
              <>
                {bands.map((band) => (
                  <View key={band} style={styles.courtRow}>
                    <Text style={styles.bandLabel}>{BAND_LABEL[band] || band.toUpperCase()}</Text>
                    <View style={{ flexDirection: "row", flex: 1 }}>
                      {cols.map((col) => {
                        const cell = courtCells[`${band}-${col}`];
                        const shots = cell && Array.isArray(cell.shot_ids) ? cell.shot_ids.length : 0;
                        const charted = shots > 0;
                        return (
                          <View key={col} style={[styles.courtCell, charted ? styles.cellCharted : styles.cellUncharted]}>
                            <Text style={[styles.cellCol, charted && { color: C.ink }]}>{col.toUpperCase()}</Text>
                            <Text style={styles.cellMeta}>{charted ? `${shots} SHOTS` : "—"}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))}
                <Text style={styles.courtFoot}>
                  {chartedCount > 0
                    ? `${chartedCount} position${chartedCount > 1 ? "s" : ""} charted so far · right side · rating arrives in the next update`
                    : "Taxonomy loading · right side"}
                </Text>
              </>
            ) : (
              <Body size={11} color={C.grey}>Court map coming soon.</Body>
            )}
          </View>
        </View>

        {/* Shot library — optional exploration surface (decoupled from tiers) */}
        <TouchableOpacity testID="shot-library-entry" activeOpacity={0.85}
          onPress={() => router.push("/profile/shots")} style={styles.libraryRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.libraryTitle}>SHOT LIBRARY</Text>
            <Text style={styles.librarySub}>Explore all 36 padel shots · optional · doesn't affect ratings</Text>
          </View>
          <Text style={styles.libraryArrow}>→</Text>
        </TouchableOpacity>

        {/* Learning library — shell; curation + content are a separate scope. */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Heading size={11}>LEARNING LIBRARY</Heading>
          <View style={styles.libraryShell}>
            <Text style={styles.libraryShellTitle}>HAND-PICKED VIDEOS, MAPPED TO YOUR GAME</Text>
            <Body size={11} color={C.grey} style={{ marginTop: 6, lineHeight: 16 }}>
              A curated library is coming — each clip tagged to a shot, so a gap on your court is one tap from the video that fills it.
            </Body>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RadarChart({ data }: { data: { key: string; label: string; value: number }[] }) {
  const SIZE = 220, CX = SIZE / 2, CY = SIZE / 2, R = 80;
  const MAX = 6;
  const n = data.length;
  const points = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const radius = (Math.max(0, Math.min(MAX, d.value)) / MAX) * R;
    return `${CX + Math.cos(angle) * radius},${CY + Math.sin(angle) * radius}`;
  }).join(" ");
  const grid = [1, 2, 3, 4, 5, 6].map((step) =>
    data.map((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const radius = (step / MAX) * R;
      return `${CX + Math.cos(angle) * radius},${CY + Math.sin(angle) * radius}`;
    }).join(" "));
  return (
    <Svg width="100%" height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      {grid.map((pts, i) => (
        <Polygon key={i} points={pts} fill="none" stroke={C.border} strokeWidth={1} />
      ))}
      {data.map((d, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const x = CX + Math.cos(angle) * R;
        const y = CY + Math.sin(angle) * R;
        return <Line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke={C.border} strokeWidth={1} />;
      })}
      <Polygon points={points} fill={C.lime} fillOpacity={0.45} stroke={C.ink} strokeWidth={2} />
      {data.map((d, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const lx = CX + Math.cos(angle) * (R + 18);
        const ly = CY + Math.sin(angle) * (R + 18);
        return (
          <SvgText key={d.key} x={lx} y={ly} fontFamily={F.mono} fontSize={9} fill={C.ink} textAnchor="middle">
            {d.label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  header: {
    backgroundColor: C.ink, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
    borderBottomWidth: BORDER, borderBottomColor: C.lime,
  },
  limeRule: { height: BORDER, backgroundColor: C.lime, marginTop: 10, marginHorizontal: -16 },
  ratingBlock: { alignItems: "center", paddingVertical: 28, backgroundColor: C.cream, borderBottomWidth: BORDER, borderBottomColor: C.ink },
  ratingNum: { fontFamily: F.ub900, fontSize: 88, color: C.ink, letterSpacing: -3, lineHeight: 92, marginTop: 6 },
  ratingNumEstimated: { fontSize: 52, lineHeight: 56, letterSpacing: -1.5, color: C.grey },
  statusLabel: { fontFamily: F.mono, fontSize: 9, color: C.grey, marginTop: 10, letterSpacing: 1.6 },
  trend: { fontFamily: F.mono, fontSize: 11, marginTop: 4, letterSpacing: 1 },
  rankBand: { backgroundColor: C.purple, paddingVertical: 12, alignItems: "center", borderBottomWidth: BORDER, borderColor: C.ink },
  rankBandText: { fontFamily: F.ub900, fontSize: 16, color: C.white, letterSpacing: -0.4 },
  statStrip: { flexDirection: "row", backgroundColor: C.ink },
  div: { width: BORDER, backgroundColor: C.ink },
  chartCard: { backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, padding: 12, marginTop: 8 },
  authorshipTag: { borderWidth: 1.5, borderColor: C.ink, paddingHorizontal: 8, paddingVertical: 3 },
  authorshipText: { fontFamily: F.mono, fontSize: 8, color: C.ink, letterSpacing: 1.4 },
  domainLegend: { marginTop: 10, borderTopWidth: 1, borderColor: "#00000012", paddingTop: 8 },
  domainLegendRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  domainLegendLabel: { fontFamily: F.ub700, fontSize: 11, color: C.ink, letterSpacing: 0.4 },
  domainLegendBand: { fontFamily: F.mono, fontSize: 10, color: C.grey, letterSpacing: 0.8 },
  courtCard: { backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, padding: 12, marginTop: 8 },
  courtRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  bandLabel: { width: 78, fontFamily: F.mono, fontSize: 9, color: C.grey, letterSpacing: 1 },
  courtCell: { flex: 1, marginHorizontal: 3, paddingVertical: 10, alignItems: "center", borderWidth: 1.5 },
  cellCharted: { backgroundColor: C.limeTint, borderColor: C.ink },
  cellUncharted: { backgroundColor: C.cream, borderColor: "rgba(0,0,0,0.18)" },
  cellCol: { fontFamily: F.ub700, fontSize: 9, color: C.grey, letterSpacing: 0.6 },
  cellMeta: { fontFamily: F.mono, fontSize: 8, color: C.grey, marginTop: 2, letterSpacing: 0.6 },
  courtFoot: { fontFamily: F.mono, fontSize: 9, color: C.grey, letterSpacing: 0.8, marginTop: 8 },
  libraryRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 20, padding: 14, borderWidth: BORDER, borderColor: C.ink, backgroundColor: C.white },
  libraryTitle: { fontFamily: F.ub900, fontSize: 13, color: C.ink, letterSpacing: -0.2 },
  librarySub: { fontFamily: F.mono, fontSize: 10, color: C.grey, letterSpacing: 0.8, marginTop: 3 },
  libraryArrow: { fontFamily: F.ub900, fontSize: 18, color: C.ink },
  libraryShell: { backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, padding: 14, marginTop: 8 },
  libraryShellTitle: { fontFamily: F.ub700, fontSize: 11, color: C.ink, letterSpacing: 0.4 },
});
