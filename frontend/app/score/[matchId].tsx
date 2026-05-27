// Score entry — two team panels with set inputs.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, ScrollView, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, MicroLabel, Body } from "../../lib/ui";
import { api } from "../../lib/api";
import { usePlayer } from "../../lib/context";
import { formatDate } from "../../lib/utils";

type Sets = { a: string; b: string }[];

export default function ScoreEntry() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const { player } = usePlayer();
  const [match, setMatch] = useState<any>(null);
  const [venue, setVenue] = useState<any>(null);
  const [playersById, setPlayersById] = useState<Record<string, any>>({});
  const [sets, setSets] = useState<Sets>([{ a: "", b: "" }, { a: "", b: "" }]);
  const [gameType, setGameType] = useState<"social" | "competitive">("competitive");
  const [game, setGame] = useState<any>(null);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    const m = await api.getMatch(String(matchId));
    setMatch(m);
    const [vs, ps] = await Promise.all([api.listVenues(), api.listPlayers()]);
    setVenue(vs.find((v: any) => v.id === m.venueId));
    setPlayersById(Object.fromEntries(ps.map((x: any) => [x.id, x])));
    if (m.sets?.length) {
      setSets(m.sets.map((s: any) => ({ a: String(s.pairA), b: String(s.pairB) })));
    }
    // Pull linked game so we can show + override its gameType.
    if (m.gameId) {
      try {
        const g = await api.getGame(m.gameId);
        setGame(g);
        setGameType((g.gameType || "competitive") as "social" | "competitive");
        const att: Record<string, boolean> = {};
        (g.players || []).forEach((pid: string) => { att[pid] = true; });
        setAttendance(att);
      } catch {}
    }
  }, [matchId]);

  useEffect(() => { load(); }, [load]);

  const result = useMemo(() => {
    let aSets = 0, bSets = 0, complete = 0;
    sets.forEach((s) => {
      const a = parseInt(s.a, 10);
      const b = parseInt(s.b, 10);
      if (Number.isFinite(a) && Number.isFinite(b)) {
        complete++;
        if (a > b) aSets++;
        else if (b > a) bSets++;
      }
    });
    return { aSets, bSets, complete, winner: aSets === bSets ? null : aSets > bSets ? "pairA" : "pairB" };
  }, [sets]);

  const onSubmit = async () => {
    if (!match || !player) return;
    if (result.complete < 2) return Alert.alert("Enter both sets", "Enter scores for at least two sets.");
    if (!result.winner) return Alert.alert("Add a third set", "Sets are tied — add a tiebreak set.");
    try {
      const data = sets.filter((s) => s.a !== "" && s.b !== "").map((s) => ({ pairA: parseInt(s.a, 10), pairB: parseInt(s.b, 10) }));
      const res = await api.enterScore(match.id, { sets: data, scoreEnteredBy: player.id, gameType });
      // Persist attendance for the linked game (if any).
      if (game?.id) {
        try { await api.submitAttendance(game.id, attendance); } catch {}
      }
      const myDelta = res.deltas?.[player.id];
      if (gameType === "competitive" && myDelta) {
        Alert.alert("Score saved", `Your rating ${myDelta.delta >= 0 ? "rose" : "fell"} by ${Math.abs(myDelta.delta || 0).toFixed(2)}.`);
      } else {
        Alert.alert("Score saved", gameType === "social" ? "Recorded as a social game — ratings unchanged." : "Score recorded.");
      }
      router.back();
    } catch (e: any) {
      Alert.alert("Could not save", e.message ?? "Try again");
    }
  };

  if (!match || !venue) return <SafeAreaView style={styles.safe} />;

  const aNames = match.pairA.map((id: string) => playersById[id]?.name || "?").join(" & ");
  const bNames = match.pairB.map((id: string) => playersById[id]?.name || "?").join(" & ");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        <TouchableOpacity onPress={() => router.back()} testID="score-back">
          <Ionicons name="chevron-back" size={26} color={C.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>HOW DID YOUR GAME GO?</Text>
        <Text style={styles.sub}>{venue.name.toUpperCase()} · {formatDate(match.date)}</Text>

        {/* Game-type override — defaults to the linked Game's flag. */}
        <MicroLabel style={{ marginTop: 16, marginBottom: 8 }}>THIS WAS A</MicroLabel>
        <View style={styles.gtRow}>
          <TouchableOpacity
            testID="score-gameType-social"
            onPress={() => setGameType("social")}
            style={[styles.gtBtn, { backgroundColor: gameType === "social" ? C.purple : C.white }]}
          >
            <Text style={[styles.gtText, { color: gameType === "social" ? C.white : C.ink }]}>
              SOCIAL {gameType === "social" ? "✓" : ""}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="score-gameType-competitive"
            onPress={() => setGameType("competitive")}
            style={[styles.gtBtn, { backgroundColor: gameType === "competitive" ? C.blue : C.white }]}
          >
            <Text style={[styles.gtText, { color: gameType === "competitive" ? C.white : C.ink }]}>
              COMPETITIVE {gameType === "competitive" ? "✓" : ""}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Attendance — only when we have a linked Game */}
        {game?.players && (
          <View style={{ marginTop: 16 }}>
            <MicroLabel style={{ marginBottom: 8 }}>DID ALL 4 PLAYERS SHOW UP?</MicroLabel>
            <View style={styles.attRow}>
              {game.players.map((pid: string) => {
                const present = attendance[pid] !== false;
                return (
                  <TouchableOpacity
                    key={pid}
                    testID={`attendance-${pid}`}
                    onPress={() => setAttendance((s) => ({ ...s, [pid]: !present }))}
                    style={[
                      styles.attBtn,
                      present
                        ? { backgroundColor: C.lime }
                        : { backgroundColor: C.coral, borderColor: C.coral },
                    ]}
                  >
                    <Ionicons
                      name={present ? "checkmark-circle" : "close-circle"}
                      size={14}
                      color={present ? C.ink : C.white}
                    />
                    <Text style={[styles.attText, { color: present ? C.ink : C.white }]}>
                      {(playersById[pid]?.name || pid).split(" ")[0].toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Body size={10} color={C.grey} style={{ marginTop: 6 }}>
              Tap to mark a player as a no-show.
            </Body>
          </View>
        )}

        <View style={styles.panels}>
          <Panel
            title="TEAM A"
            names={aNames}
            sets={sets}
            side="a"
            onChange={(i, val) => setSets((s) => s.map((x, idx) => (idx === i ? { ...x, a: val } : x)))}
            winner={result.winner === "pairA"}
          />
          <Panel
            title="TEAM B"
            names={bNames}
            sets={sets}
            side="b"
            onChange={(i, val) => setSets((s) => s.map((x, idx) => (idx === i ? { ...x, b: val } : x)))}
            winner={result.winner === "pairB"}
          />
        </View>

        {sets.length < 3 && result.aSets === 1 && result.bSets === 1 && (
          <TouchableOpacity
            testID="add-third-set"
            onPress={() => setSets([...sets, { a: "", b: "" }])}
            style={styles.addThird}
          >
            <Text style={{ fontFamily: F.ub700, color: C.ink, letterSpacing: 1 }}>+ ADD THIRD SET</Text>
          </TouchableOpacity>
        )}

        <View style={{ marginTop: 24 }}>
          <SplitCTA testID="confirm-score" label="CONFIRM SCORE" onPress={onSubmit} disabled={!result.winner || result.complete < 2} />
        </View>

        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16, alignSelf: "center" }}>
          <Body size={11} color={C.grey}>Skip — no score this time</Body>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Panel({
  title, names, sets, side, onChange, winner,
}: {
  title: string;
  names: string;
  sets: Sets;
  side: "a" | "b";
  onChange: (i: number, val: string) => void;
  winner: boolean;
}) {
  return (
    <View style={[styles.panel, winner && { backgroundColor: C.limeTint }]}>
      <Text style={styles.panelTitle}>{title}</Text>
      <Text style={styles.panelNames} numberOfLines={2}>{names}</Text>
      <View style={{ flexDirection: "row", marginTop: 12 }}>
        {sets.map((s, i) => (
          <TextInput
            key={i}
            testID={`set-${side}-${i}`}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={C.grey}
            maxLength={2}
            value={side === "a" ? s.a : s.b}
            onChangeText={(val) => onChange(i, val.replace(/[^0-9]/g, ""))}
            style={styles.setInput}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  heading: { fontFamily: F.ub900, fontSize: 22, color: C.ink, letterSpacing: -0.8 },
  sub: { fontFamily: F.mono, fontSize: 10, color: C.grey, marginTop: 4, letterSpacing: 1.4 },
  panels: { flexDirection: "row", marginTop: 24 },
  panel: { flex: 1, padding: 12, borderWidth: BORDER, borderColor: C.ink, backgroundColor: C.white, marginRight: -2 },
  panelTitle: { fontFamily: F.ub700, fontSize: 10, color: C.ink, letterSpacing: 1.4 },
  panelNames: { fontFamily: F.sans, fontSize: 11, color: C.ink, marginTop: 4, lineHeight: 15 },
  setInput: {
    width: 44, minHeight: 56, marginRight: 6,
    borderWidth: BORDER, borderColor: C.ink, backgroundColor: C.cream,
    fontFamily: F.mono, fontSize: 26, color: C.ink, textAlign: "center",
  },
  addThird: { marginTop: 18, paddingVertical: 14, alignItems: "center", borderWidth: BORDER, borderColor: C.ink, backgroundColor: C.white },
  gtRow: { flexDirection: "row", gap: 8 },
  gtBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderWidth: BORDER, borderColor: C.ink },
  gtText: { fontFamily: F.ub900, fontSize: 11, letterSpacing: 0.6 },
  attRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  attBtn: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: BORDER, borderColor: C.ink, backgroundColor: C.cream,
  },
  attText: { fontFamily: F.ub700, fontSize: 10, letterSpacing: 0.8, marginLeft: 4 },
});
