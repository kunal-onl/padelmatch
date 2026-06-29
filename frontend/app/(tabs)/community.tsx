// Community — belonging (the connective tissue of the spine). Three sub-tabs:
//   RECOMMENDED — people to play with, matched on level / venues / availability
//   SOCIAL      — your social graph (connections, mutuals, ghost invites)
//   RANKINGS    — the local competitive ladder (blue = Competitive Level)
// Built in Claude Code (the canonical version) from the product spine + the
// existing backend (/players, /leaderboard, Player.connections).
//
// Visibility rules (locked Feb 2026), applied to the people lists:
//   1a everyone sees active + invited · 2b ghosts only to their inviter ·
//   3b connection tags stay private to the author · 4a one-way is fine, show a
//   MUTUAL pill when reciprocal · 6d search only, no filters.
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

const STATUS_COLOR: Record<string, string> = { active: C.lime, invited: C.blue, ghost: C.purple };
type Tab = "recommended" | "social" | "rankings";
const TABS: { key: Tab; label: string }[] = [
  { key: "recommended", label: "RECOMMENDED" },
  { key: "social", label: "SOCIAL" },
  { key: "rankings", label: "RANKINGS" },
];

export default function Community() {
  const router = useRouter();
  const { player: me } = usePlayer();
  const [tab, setTab] = useState<Tab>("recommended");
  const [players, setPlayers] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [lb, setLb] = useState<{ ranked: any[]; unranked: any[] }>({ ranked: [], unranked: [] });
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [list, vs, board] = await Promise.all([
      api.listPlayers(), api.listVenues().catch(() => []), api.leaderboard().catch(() => null),
    ]);
    setPlayers(list);
    setVenues(vs || []);
    if (board) setLb({ ranked: board.ranked || [], unranked: board.unranked || [] });
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const venuesById: Record<string, any> = useMemo(
    () => Object.fromEntries(venues.map((v) => [v.id, v])), [venues]);

  // ── Visibility (1a + 2b) ──
  const visible = useMemo(() => {
    if (!me) return [] as any[];
    return players.filter((p) => {
      if (p.id === me.id) return false;
      if (p.status === "ghost") return p.invitedBy === me.id;
      return p.status === "active" || p.status === "invited";
    });
  }, [players, me]);

  // ── Connection lookups (4a) ──
  const peopleWhoAddedMe = useMemo(() => {
    const ids = new Set<string>();
    if (!me) return ids;
    players.forEach((p) => {
      if (Array.isArray(p.connections) && p.connections.some((c: any) => c.playerId === me.id)) ids.add(p.id);
    });
    return ids;
  }, [players, me]);
  const myConnectionIds = useMemo(() => {
    const ids = new Set<string>();
    (me?.connections || []).forEach((c: any) => ids.add(c.playerId));
    return ids;
  }, [me]);
  const preferNotIds = useMemo(() => {
    const ids = new Set<string>();
    (me?.connections || []).forEach((c: any) => { if (c.relationship === "prefer_not") ids.add(c.playerId); });
    return ids;
  }, [me]);
  const isMutual = (pid: string) => myConnectionIds.has(pid) && peopleWhoAddedMe.has(pid);
  const isFollowing = (pid: string) => myConnectionIds.has(pid) && !peopleWhoAddedMe.has(pid);
  // Connection strength (1–3): mutual = 3, one-way = 2, none = 1.
  const strength = (pid: string) => (isMutual(pid) ? 3 : (myConnectionIds.has(pid) || peopleWhoAddedMe.has(pid)) ? 2 : 1);

  const matchesQuery = (p: any) => {
    const q = query.trim().toLowerCase();
    return !q || p.name.toLowerCase().includes(q);
  };

  // ── RECOMMENDED — people to play with (client-side match on level/venue/time) ──
  const recommended = useMemo(() => {
    if (!me) return [] as any[];
    const myRating = me.gameRating || 5;
    const myDays = new Set((me.availabilitySlots || []).map((s: any) => s.dayOfWeek));
    const myVenues = new Set<string>(me.preferredVenues || []);
    const cands = visible.filter((p) =>
      p.status !== "ghost" && !myConnectionIds.has(p.id) && !preferNotIds.has(p.id));
    return cands.map((p) => {
      const levelGap = Math.abs((p.gameRating || 5) - myRating);
      const sharedDays = (p.availabilitySlots || []).filter((s: any) => myDays.has(s.dayOfWeek)).length;
      const sharedVenue = (p.preferredVenues || []).find((v: string) => myVenues.has(v));
      const score = (3 - Math.min(3, levelGap)) * 3 + (sharedVenue ? 4 : 0) + Math.min(2, sharedDays);
      const reasons: string[] = [];
      if (levelGap <= 1) reasons.push("Similar level");
      if (sharedVenue) reasons.push(`Plays ${(venuesById[sharedVenue]?.area || venuesById[sharedVenue]?.name || "your courts")}`);
      else if (sharedDays > 0) reasons.push("Free when you are");
      return { p, score, reason: reasons.slice(0, 2).join(" · ") || "New to your community" };
    }).sort((a, b) => b.score - a.score).filter((r) => matchesQuery(r.p)).slice(0, 15);
  }, [visible, me, myConnectionIds, preferNotIds, venuesById, query]);

  // ── SOCIAL — the roster, connections first ──
  const social = useMemo(() => {
    const list = visible.filter(matchesQuery);
    return [...list].sort((a, b) => strength(b.id) - strength(a.id));
  }, [visible, query, myConnectionIds, peopleWhoAddedMe]);

  const myMatches = me?.matchesPlayed || 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Heading size={20}>COMMUNITY</Heading>
        <Text style={styles.headerCount}>NORTH GOA</Text>
      </View>

      {/* Sub-tab switcher */}
      <View style={styles.tabRow}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity key={t.key} testID={`community-tab-${t.key}`} activeOpacity={0.85}
              onPress={() => setTab(t.key)} style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabText, active && { color: C.ink }]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Shared search */}
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
        {/* ── RECOMMENDED ── */}
        {tab === "recommended" && (
          recommended.length === 0 ? (
            <Empty title="NO RECOMMENDATIONS YET"
              sub={query.trim() ? `Nothing matches "${query.trim()}"` : "As more players join — or you set your venues and availability — we'll suggest people at your level."} />
          ) : (
            recommended.map(({ p, reason }) => (
              <TouchableOpacity key={p.id} testID={`rec-player-${p.id}`} activeOpacity={0.85}
                onPress={() => router.push(`/profile/${p.id}`)} style={styles.card}>
                <Avatar name={p.name} size={44} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.name} numberOfLines={1}>{p.name.toUpperCase()}</Text>
                  <Text style={styles.reason} numberOfLines={1}>{reason}</Text>
                </View>
                <View style={styles.rightCol}>
                  <Text style={styles.ratingColNum}>{p.gameRatingStatus === "estimated" ? "—" : (p.gameRating ?? 0).toFixed(1)}</Text>
                  <Text style={styles.statusLabel}>{p.matchesPlayed} PLAYED</Text>
                </View>
              </TouchableOpacity>
            ))
          )
        )}

        {/* ── SOCIAL ── */}
        {tab === "social" && (
          social.length === 0 ? (
            <Empty title="NO ONE HERE YET"
              sub={query.trim() ? `Nothing matches "${query.trim()}"` : "Add connections to build your graph — they'll show here with a MUTUAL badge when reciprocal."} />
          ) : (
            social.map((p) => {
              const mutual = isMutual(p.id);
              const following = isFollowing(p.id);
              const area = (p.preferredVenues?.[0] && (venuesById[p.preferredVenues[0]]?.area)) || "";
              return (
                <TouchableOpacity key={p.id} testID={`player-card-${p.id}`} activeOpacity={0.85}
                  onPress={() => router.push(`/profile/${p.id}`)} style={styles.card}>
                  <Avatar name={p.name} size={44} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={styles.name} numberOfLines={1}>{p.name.toUpperCase()}</Text>
                      <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[p.status] || C.grey }]} />
                    </View>
                    <View style={{ flexDirection: "row", marginTop: 4, alignItems: "center", gap: 8 }}>
                      <StrengthBars n={strength(p.id)} />
                      <Text style={styles.metaSecondary}>{p.matchesPlayed} MATCHES{area ? ` · ${area.toUpperCase()}` : ""}</Text>
                    </View>
                  </View>
                  <View style={styles.rightCol}>
                    <Text style={styles.ratingColNum} testID={`player-rating-${p.id}`}>
                      {p.gameRatingStatus === "estimated" ? "—" : (p.gameRating ?? 0).toFixed(1)}
                    </Text>
                    {mutual ? (
                      <View style={[styles.badge, { backgroundColor: C.lime, marginTop: 4 }]} testID={`mutual-${p.id}`}>
                        <Ionicons name="swap-horizontal" size={12} color={C.ink} />
                        <Text style={styles.badgeText}>MUTUAL</Text>
                      </View>
                    ) : following ? (
                      <View style={[styles.badge, { backgroundColor: C.cream, marginTop: 4 }]} testID={`following-${p.id}`}>
                        <Text style={[styles.badgeText, { color: C.ink, marginLeft: 0 }]}>ADDED</Text>
                      </View>
                    ) : p.status === "ghost" ? (
                      <View style={[styles.badge, { backgroundColor: C.cream, borderStyle: "dashed", marginTop: 4 }]}>
                        <Ionicons name="logo-whatsapp" size={11} color={C.ink} />
                        <Text style={[styles.badgeText, { color: C.ink }]}>INVITE</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })
          )
        )}

        {/* ── RANKINGS (Competitive Level — blue) ── */}
        {tab === "rankings" && (
          <>
            {myMatches < 5 && (
              <View style={styles.ladderBanner} testID="rankings-optin">
                <Text style={styles.ladderTitle}>JOIN THE LADDER</Text>
                <Text style={styles.ladderSub}>Play {Math.max(0, 5 - myMatches)} more match{5 - myMatches === 1 ? "" : "es"} to enter the North Goa ranked ladder.</Text>
              </View>
            )}
            {lb.ranked.filter(matchesQuery).length === 0 ? (
              <Empty title="RANKINGS OPENING SOON"
                sub="The ladder ranks players with 5+ scored matches. Be one of the first." />
            ) : (
              lb.ranked.filter(matchesQuery).map((p, i) => {
                const rank = p.communityRank ?? i + 1;
                const isMe = me && p.id === me.id;
                return (
                  <View key={p.id} testID={`rank-row-${p.id}`} style={[styles.rankRow, isMe && styles.rankRowMe]}>
                    <View style={styles.rankNum}>
                      {rank === 1 ? <Text style={styles.crown}>👑</Text> : <Text style={styles.rankNumText}>{rank}</Text>}
                    </View>
                    <Avatar name={p.name} size={38} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.name} numberOfLines={1}>{p.name.toUpperCase()}</Text>
                      <Text style={styles.metaSecondary}>{p.wins}W · {p.losses}L · {p.matchesPlayed} PLAYED</Text>
                    </View>
                    <Text style={styles.rankRating}>{(p.gameRating ?? 0).toFixed(1)}</Text>
                  </View>
                );
              })
            )}
            {lb.unranked.length > 0 && (
              <Text style={styles.unrankedNote}>+ {lb.unranked.length} player{lb.unranked.length === 1 ? "" : "s"} not yet ranked (under 5 matches)</Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Empty({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 56 }}>
      <MicroLabel color={C.grey}>{title}</MicroLabel>
      <Body size={12} color={C.grey} style={{ marginTop: 8, textAlign: "center", lineHeight: 17, maxWidth: 280 }}>{sub}</Body>
    </View>
  );
}

function StrengthBars({ n }: { n: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={{ width: 9, height: 5, backgroundColor: i <= n ? C.purple : "rgba(0,0,0,0.12)" }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  header: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: BORDER, borderBottomColor: C.ink, backgroundColor: C.cream,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  headerCount: {
    fontFamily: F.mono, fontSize: 10, letterSpacing: 1.4, color: C.grey,
    paddingHorizontal: 10, paddingVertical: 4, borderWidth: BORDER, borderColor: C.ink, backgroundColor: C.white,
  },
  tabRow: { flexDirection: "row", backgroundColor: C.ink },
  tab: { flex: 1, paddingVertical: 11, alignItems: "center", backgroundColor: C.white, borderRightWidth: 1, borderColor: C.ink },
  tabActive: { backgroundColor: C.lime },
  tabText: { fontFamily: F.ub700, fontSize: 10, letterSpacing: 0.6, color: C.grey },
  searchRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, minHeight: 44,
  },
  searchInput: { flex: 1, marginLeft: 8, color: C.ink, fontFamily: F.sans, fontSize: 13 },
  card: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, marginTop: 8,
  },
  name: { fontFamily: F.ub900, fontSize: 13, color: C.ink, letterSpacing: -0.3, marginRight: 8 },
  reason: { fontFamily: F.mono, fontSize: 10, color: C.grey, letterSpacing: 0.6, marginTop: 4 },
  statusDot: { width: 7, height: 7 },
  metaSecondary: { fontFamily: F.mono, fontSize: 10, color: C.grey, letterSpacing: 1 },
  rightCol: { alignItems: "flex-end", minWidth: 50, marginLeft: 8 },
  ratingColNum: { fontFamily: F.ub900, fontSize: 18, color: C.ink, letterSpacing: -0.5 },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderWidth: BORDER, borderColor: C.ink, marginTop: 4 },
  badgeText: { fontFamily: F.ub900, fontSize: 9, letterSpacing: 1, color: C.ink, marginLeft: 3 },
  statusLabel: { fontFamily: F.mono, fontSize: 8, color: C.grey, letterSpacing: 1.2, marginTop: 4 },
  // Rankings (blue = Competitive Level)
  ladderBanner: { backgroundColor: C.blue, borderWidth: BORDER, borderColor: C.ink, padding: 14, marginTop: 10 },
  ladderTitle: { fontFamily: F.ub900, fontSize: 14, color: C.white, letterSpacing: 0.3 },
  ladderSub: { fontFamily: F.mono, fontSize: 10, color: "rgba(255,255,255,0.85)", letterSpacing: 0.6, marginTop: 5 },
  rankRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, padding: 10, marginTop: 8,
  },
  rankRowMe: { borderColor: C.blue, borderWidth: 3 },
  rankNum: { width: 30, alignItems: "center" },
  rankNumText: { fontFamily: F.ub900, fontSize: 16, color: C.ink },
  crown: { fontSize: 18 },
  rankRating: { fontFamily: F.ub900, fontSize: 18, color: C.blue, letterSpacing: -0.5, marginLeft: 8 },
  unrankedNote: { fontFamily: F.mono, fontSize: 10, color: C.grey, letterSpacing: 0.6, marginTop: 14, textAlign: "center" },
});
