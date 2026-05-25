// Leaderboard — top-3 podium + ranked list + unranked section.
import React, { useCallback, useState } from "react";
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { C, F, BORDER } from "../../lib/theme";
import { Avatar, MicroLabel, Pill } from "../../lib/ui";
import { api } from "../../lib/api";
import { usePlayer } from "../../lib/context";

export default function Leaderboard() {
  const router = useRouter();
  const { player } = usePlayer();
  const [data, setData] = useState<{ ranked: any[]; unranked: any[] } | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "connections">("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setData(await api.leaderboard()); } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (!data) return <SafeAreaView style={styles.safe} />;

  const connectionIds = new Set((player?.connections || []).map((c: any) => c.playerId));
  const ranked = data.ranked.filter((p) => {
    if (filter === "active") return (Date.now() - new Date(p.lastActiveAt).getTime()) < 30 * 24 * 3600 * 1000;
    if (filter === "connections") return connectionIds.has(p.id) || p.id === player?.id;
    return true;
  });

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.hTitle}>NORTH GOA PADEL</Text>
        <Text style={styles.hSub}>{data.ranked.length + data.unranked.length} MEMBERS</Text>
      </View>

      <View style={styles.filterRow}>
        {(["all", "active", "connections"] as const).map((k) => (
          <View key={k} style={{ flex: 1, marginHorizontal: 2 }}>
            <Pill testID={`lb-filter-${k}`} label={k.toUpperCase()} active={filter === k} onPress={() => setFilter(k)} />
          </View>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Podium */}
        {top3.length >= 3 && (
          <View style={styles.podium}>
            <PodiumItem rank={2} p={top3[1]} height={88} avatarSize={56} onPress={() => router.push(`/profile/${top3[1].id}`)} />
            <PodiumItem rank={1} p={top3[0]} height={116} avatarSize={76} onPress={() => router.push(`/profile/${top3[0].id}`)} elevated />
            <PodiumItem rank={3} p={top3[2]} height={72} avatarSize={56} onPress={() => router.push(`/profile/${top3[2].id}`)} />
          </View>
        )}

        {/* Ranked list */}
        <View style={{ marginTop: 18 }}>
          {rest.map((p, i) => {
            const isMe = p.id === player?.id;
            return (
              <TouchableOpacity
                key={p.id}
                testID={`lb-row-${p.id}`}
                onPress={() => router.push(`/profile/${p.id}`)}
                activeOpacity={0.85}
                style={[styles.row, { backgroundColor: isMe ? C.purple : C.white }]}
              >
                <View style={styles.rankCell}>
                  <Text style={[styles.rankText, { color: isMe ? C.white : C.ink }]}>#{i + 4}</Text>
                </View>
                <Text style={[styles.nameText, { color: isMe ? C.white : C.ink }]} numberOfLines={1}>
                  {p.name.toUpperCase()}
                </Text>
                <Text style={[styles.ratingText, { color: isMe ? C.lime : C.ink }]}>{p.gameRating.toFixed(1)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Unranked */}
        {data.unranked.length > 0 && filter !== "connections" && (
          <>
            <View style={styles.unrankedDivider}>
              <View style={{ height: 1, flex: 1, backgroundColor: C.ink }} />
              <Text style={styles.unrankedLabel}>UNRANKED (FEWER THAN 5 MATCHES)</Text>
              <View style={{ height: 1, flex: 1, backgroundColor: C.ink }} />
            </View>
            {data.unranked.map((p) => (
              <View key={p.id} style={[styles.row, { backgroundColor: C.cream }]}>
                <View style={styles.rankCell}><Text style={[styles.rankText, { color: C.grey }]}>—</Text></View>
                <Text style={[styles.nameText, { color: C.ink2 }]}>{p.name.toUpperCase()}</Text>
                <Text style={[styles.ratingText, { color: C.ink2 }]}>{p.gameRating.toFixed(1)}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PodiumItem({ rank, p, height, avatarSize, onPress, elevated }: any) {
  return (
    <TouchableOpacity onPress={onPress} testID={`podium-${rank}`} activeOpacity={0.85} style={{ flex: 1, alignItems: "center", marginTop: elevated ? -16 : 0 }}>
      <Avatar name={p.name} size={avatarSize} bg={rank === 1 ? C.lime : C.cream} />
      <Text style={{ fontFamily: F.ub700, fontSize: 11, color: C.ink, marginTop: 8, letterSpacing: -0.3 }} numberOfLines={1}>
        {p.name.toUpperCase()}
      </Text>
      <Text style={{ fontFamily: F.mono, fontSize: 11, color: C.lime, backgroundColor: C.ink, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 }}>
        {p.gameRating.toFixed(1)}
      </Text>
      <View style={{ width: "82%", height, backgroundColor: C.ink, marginTop: 10, alignItems: "center", justifyContent: "center", borderWidth: BORDER, borderColor: C.ink }}>
        <Text style={{ fontFamily: F.ub900, fontSize: 32, color: C.lime, letterSpacing: -1 }}>{rank}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  header: { backgroundColor: C.ink, paddingHorizontal: 16, paddingVertical: 14 },
  hTitle: { fontFamily: F.ub900, fontSize: 22, color: C.white, letterSpacing: -1 },
  hSub: { fontFamily: F.mono, fontSize: 10, color: C.lime, marginTop: 4, letterSpacing: 1.6 },
  filterRow: { flexDirection: "row", padding: 10 },
  podium: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 16, marginTop: 18 },
  row: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 16, marginBottom: 4,
    borderWidth: BORDER, borderColor: C.ink, minHeight: 48,
  },
  rankCell: { width: 52, borderRightWidth: BORDER, borderRightColor: C.ink, alignItems: "center", justifyContent: "center", paddingVertical: 10 },
  rankText: { fontFamily: F.mono, fontSize: 13, letterSpacing: 0.4 },
  nameText: { fontFamily: F.ub700, fontSize: 12, flex: 1, paddingHorizontal: 12, letterSpacing: -0.3 },
  ratingText: { fontFamily: F.ub900, fontSize: 18, paddingHorizontal: 14, letterSpacing: -0.6 },
  unrankedDivider: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginVertical: 14 },
  unrankedLabel: { fontFamily: F.mono, fontSize: 9, color: C.lime, marginHorizontal: 8, letterSpacing: 1.4 },
});
