// Community — the social roster (belonging; the connective tissue of the spine).
// (Was the "Players" tab; renamed in the IA refactor. Functionality unchanged —
// the Recommended/Social/Rankings sub-tabs are a separate spec.)
//
// Visibility rules (locked Feb 2026):
//   1a  Everyone in the community sees all `active` + `invited` members.
//   2b  `ghost` profiles are visible ONLY to the player who introduced
//       them (i.e. ghost.invitedBy === currentPlayer.id).
//   3b  Connection tags (social/competitive) are PRIVATE to the author —
//       this screen never reads or surfaces another player's tags.
//   4a  One-way connections are fine; show a small MUTUAL pill when
//       both players have added each other.
//   5d  Plain list with a "X MUTUALS" badge per row; no graph view.
//   6d  Search bar only — no filters.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "../../lib/theme";
import { Heading, MicroLabel, Avatar, Body } from "../../lib/ui";
import { api } from "../../lib/api";
import { usePlayer } from "../../lib/context";

const STATUS_COLOR: Record<string, string> = {
  active: C.lime,
  invited: C.blue,
  ghost: C.purple,
};

export default function Community() {
  const router = useRouter();
  const { player: me } = usePlayer();
  const [players, setPlayers] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await api.listPlayers();
    setPlayers(list);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  // ── Apply visibility rules 1a + 2b ──────────────────────────────
  const visible = useMemo(() => {
    if (!me) return [] as any[];
    return players.filter((p) => {
      if (p.id === me.id) return false;          // hide self
      if (p.status === "ghost") {
        return p.invitedBy === me.id;            // rule 2b
      }
      return p.status === "active" || p.status === "invited"; // rule 1a
    });
  }, [players, me]);

  // ── Search (rule 6d) ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visible;
    return visible.filter((p) => p.name.toLowerCase().includes(q));
  }, [visible, query]);

  // ── Reciprocal lookup for rule 4a ────────────────────────────────
  // Who has *me* in their connections? Build a Set of their ids.
  const peopleWhoAddedMe = useMemo(() => {
    if (!me) return new Set<string>();
    const ids = new Set<string>();
    players.forEach((p) => {
      if (!Array.isArray(p.connections)) return;
      if (p.connections.some((c: any) => c.playerId === me.id)) ids.add(p.id);
    });
    return ids;
  }, [players, me]);

  // Players that I have added.
  const myConnectionIds = useMemo(() => {
    const ids = new Set<string>();
    (me?.connections || []).forEach((c: any) => ids.add(c.playerId));
    return ids;
  }, [me]);

  const isMutual = (pid: string) =>
    myConnectionIds.has(pid) && peopleWhoAddedMe.has(pid);
  const isFollowing = (pid: string) =>
    myConnectionIds.has(pid) && !peopleWhoAddedMe.has(pid);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Heading size={20}>COMMUNITY</Heading>
        <Text style={styles.headerCount}>{filtered.length}</Text>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={C.grey} />
        <TextInput
          testID="players-search"
          placeholder="Search the community"
          placeholderTextColor={C.grey}
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")} testID="players-search-clear">
            <Ionicons name="close-circle" size={18} color={C.grey} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28, paddingTop: 6 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filtered.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <MicroLabel color={C.grey}>NO PLAYERS FOUND</MicroLabel>
            <Body size={12} color={C.grey} style={{ marginTop: 6, textAlign: "center" }}>
              {query.trim() ? `Nothing matches "${query.trim()}"` : "Your community will appear here once members sign up."}
            </Body>
          </View>
        ) : (
          filtered.map((p) => {
            const mutual = isMutual(p.id);
            const following = isFollowing(p.id);
            const area = (p.preferredVenues?.[0] || "").split("-")[0].toUpperCase();
            return (
              <TouchableOpacity
                key={p.id}
                testID={`player-card-${p.id}`}
                onPress={() => router.push(`/profile/${p.id}`)}
                activeOpacity={0.85}
                style={styles.card}
              >
                <Avatar name={p.name} size={44} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                    <Text style={styles.name} numberOfLines={1}>{p.name.toUpperCase()}</Text>
                    <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[p.status] || C.grey }]} />
                  </View>
                  <View style={{ flexDirection: "row", marginTop: 4, gap: 8, flexWrap: "wrap" }}>
                    <Text style={styles.metaSecondary}>{p.matchesPlayed} MATCHES</Text>
                    {area ? <Text style={styles.metaSecondary}>· {area}</Text> : null}
                  </View>
                </View>
                <View style={styles.rightCol}>
                  <Text style={styles.ratingColNum} testID={`player-rating-${p.id}`}>
                    {p.gameRatingStatus === "estimated" ? "—" : p.gameRating.toFixed(1)}
                  </Text>
                  {mutual && (
                    <View style={[styles.badge, { backgroundColor: C.lime, marginTop: 4 }]} testID={`mutual-${p.id}`}>
                      <Ionicons name="swap-horizontal" size={12} color={C.ink} />
                      <Text style={styles.badgeText}>MUTUAL</Text>
                    </View>
                  )}
                  {!mutual && following && (
                    <View style={[styles.badge, { backgroundColor: C.cream, borderColor: C.ink, marginTop: 4 }]} testID={`following-${p.id}`}>
                      <Text style={[styles.badgeText, { color: C.ink }]}>ADDED</Text>
                    </View>
                  )}
                  <Text style={styles.statusLabel}>{p.status.toUpperCase()}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  header: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: BORDER, borderBottomColor: C.ink,
    backgroundColor: C.cream,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  headerCount: {
    fontFamily: F.mono, fontSize: 11, letterSpacing: 1.4,
    color: C.grey, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: BORDER, borderColor: C.ink, backgroundColor: C.white,
  },
  searchRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, minHeight: 44,
  },
  searchInput: { flex: 1, marginLeft: 8, color: C.ink, fontFamily: F.sans, fontSize: 13 },
  card: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink,
    marginTop: 8,
  },
  name: { fontFamily: F.ub900, fontSize: 13, color: C.ink, letterSpacing: -0.3, marginRight: 8 },
  statusDot: { width: 7, height: 7 },
  metaPrimary: { fontFamily: F.mono, fontSize: 11, color: C.ink, letterSpacing: 0.8 },
  metaSecondary: { fontFamily: F.mono, fontSize: 10, color: C.grey, letterSpacing: 1 },
  // Fixed-width right-aligned rating column so numbers line up down the list
  // regardless of the variable matches/venue metadata.
  rightCol: { alignItems: "flex-end", minWidth: 50, marginLeft: 8 },
  ratingColNum: { fontFamily: F.ub900, fontSize: 18, color: C.ink, letterSpacing: -0.5 },
  badge: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: BORDER, borderColor: C.ink,
  },
  badgeText: {
    fontFamily: F.ub900, fontSize: 9, letterSpacing: 1, color: C.ink, marginLeft: 3,
  },
  statusLabel: {
    fontFamily: F.mono, fontSize: 8, color: C.grey, letterSpacing: 1.2, marginTop: 4,
  },
});
