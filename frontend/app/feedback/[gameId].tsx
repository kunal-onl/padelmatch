// Post-match peer feedback — rate the other 3 players on 5 dimensions.
// Privacy rule: store as running sum+count averages. Individual peer
// scores are NEVER surfaced anywhere in Phase 1.
import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, Heading, MicroLabel, Avatar, Body } from "../../lib/ui";
import { api } from "../../lib/api";
import { usePlayer } from "../../lib/context";

const DIMENSIONS = [
  { key: "technique",   label: "TECHNIQUE" },
  { key: "attack",      label: "ATTACK" },
  { key: "defence",     label: "DEFENCE" },
  { key: "tactics",     label: "TACTICS" },
  { key: "partnership", label: "PARTNERSHIP" },
];
const DESC = ["NEEDS WORK", "DEVELOPING", "SOLID", "STRONG", "EXCELLENT"];

export default function Feedback() {
  const router = useRouter();
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const { player: me } = usePlayer();
  const [game, setGame] = useState<any>(null);
  const [playersById, setPlayersById] = useState<Record<string, any>>({});
  const [ratings, setRatings] = useState<Record<string, Record<string, number>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const g = await api.getGame(gameId!);
        setGame(g);
        const all = await api.listPlayers();
        setPlayersById(Object.fromEntries(all.map((p: any) => [p.id, p])));
      } catch {}
    })();
  }, [gameId]);

  if (!game || !me) return <SafeAreaView style={styles.safe} edges={["top"]} />;

  const others: string[] = (game.players || []).filter((pid: string) => pid !== me.id);

  const setRating = (pid: string, dim: string, val: number) =>
    setRatings((s) => ({ ...s, [pid]: { ...(s[pid] || {}), [dim]: val } }));

  const completeFor = (pid: string) =>
    DIMENSIONS.every((d) => (ratings[pid]?.[d.key] || 0) > 0);

  const allComplete = others.every(completeFor);

  const onSubmit = async () => {
    setSaving(true);
    try {
      await api.submitPeerRatings(gameId!, ratings);
      router.back();
    } catch (e: any) {
      Alert.alert("Couldn't submit", e.message ?? "Try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="feedback-back">
          <Ionicons name="chevron-back" size={24} color={C.ink} />
        </TouchableOpacity>
        <Heading size={14}>RATE YOUR PARTNERS</Heading>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {others.map((pid) => {
          const p = playersById[pid];
          return (
            <View key={pid} style={styles.card} testID={`feedback-card-${pid}`}>
              <View style={styles.cardHeader}>
                <Avatar name={p?.name || pid} size={36} />
                <Text style={styles.cardName}>{(p?.name || pid).toUpperCase()}</Text>
              </View>
              {DIMENSIONS.map((d) => {
                const v = ratings[pid]?.[d.key] || 0;
                return (
                  <View key={d.key} style={styles.dim}>
                    <MicroLabel>{d.label}</MicroLabel>
                    <View style={styles.scaleRow}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <TouchableOpacity
                          key={n}
                          testID={`rate-${pid}-${d.key}-${n}`}
                          onPress={() => setRating(pid, d.key, n)}
                          style={[
                            styles.scaleBtn,
                            v === n && { backgroundColor: C.lime },
                          ]}
                        >
                          <Text style={[styles.scaleNum, v === n && { color: C.ink }]}>{n}</Text>
                          {v === n && (
                            <Text style={styles.scaleDesc}>{DESC[n - 1]}</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}

        <View style={styles.privacy}>
          <Ionicons name="lock-closed" size={12} color={C.grey} />
          <Body size={10} color={C.grey} style={{ marginLeft: 6, flex: 1 }}>
            Ratings are private and used only to improve match accuracy.
          </Body>
        </View>
      </ScrollView>

      <View style={{ padding: 16 }}>
        <SplitCTA
          testID="feedback-submit"
          label={saving ? "SUBMITTING…" : "SUBMIT RATINGS →"}
          onPress={onSubmit}
          disabled={saving || !allComplete}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: BORDER, borderColor: C.ink, backgroundColor: C.cream,
  },
  card: {
    backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink,
    padding: 14, marginBottom: 14,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  cardName: { fontFamily: F.ub900, fontSize: 14, color: C.ink, letterSpacing: -0.3, marginLeft: 10 },
  dim: { marginTop: 8 },
  scaleRow: { flexDirection: "row", marginTop: 8, gap: 6 },
  scaleBtn: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 10, paddingHorizontal: 4,
    borderWidth: BORDER, borderColor: C.ink, backgroundColor: C.white,
  },
  scaleNum: { fontFamily: F.ub900, fontSize: 14, color: C.ink },
  scaleDesc: { fontFamily: F.mono, fontSize: 7, color: C.ink, letterSpacing: 1, marginTop: 2, textAlign: "center" },
  privacy: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: C.cream, borderWidth: 1, borderColor: C.grey,
    marginTop: 4,
  },
});
