// Inbox — persistent notification list for the signed-in player.
//
// Replaces the older `notifications` paradigm. Tapping a row deep-links
// into the corresponding game / respond screen. The header bell on every
// main screen drives users here.
import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "../lib/theme";
import { Heading, Body, MicroLabel } from "../lib/ui";
import { api } from "../lib/api";

const TYPE_META: Record<string, { label: string; icon: any; accent: string }> = {
  invite_received:     { label: "INVITE",        icon: "mail",            accent: C.blue },
  invite_accepted:     { label: "ACCEPTED",      icon: "checkmark-circle", accent: C.lime },
  game_booked:         { label: "GAME ON",       icon: "tennisball",      accent: C.lime },
  game_cancelled:      { label: "CANCELLED",     icon: "close-circle",    accent: C.coral },
  score_prompt:        { label: "SCORE",         icon: "trophy",          accent: C.ink },
  near_miss_received:  { label: "NEAR MISS",     icon: "trending-up",     accent: C.purple },
};

function timeAgo(iso?: string) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function Inbox() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const ns = await api.notifications();
      setItems(ns);
    } catch (e) {
      // swallow — empty inbox shows the empty-state.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const open = async (n: any) => {
    try {
      if (!n.readAt && !n.read) await api.markRead(n.id);
    } catch {/* noop */}
    const deep = n?.payload?.deepLink || (n.gameId ? `/games/${n.gameId}` : null);
    if (deep) router.push(deep as any);
  };

  const markAll = async () => {
    try { await api.markAllRead(); await load(); } catch {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Heading size={22}>INBOX</Heading>
          <Body size={11} color={C.grey}>
            {items.filter((n) => !(n.readAt || n.read)).length} UNREAD
          </Body>
        </View>
        <TouchableOpacity onPress={markAll} style={styles.markAllBtn}>
          <Text style={styles.markAllTxt}>MARK ALL READ</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={{ paddingTop: 40, alignItems: "center" }}>
          <ActivityIndicator color={C.ink} />
        </View>
      )}

      {!loading && (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          refreshControl={<RefreshControl refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.ink} />}
          ListEmptyComponent={
            <View style={{ paddingHorizontal: 20, paddingTop: 40, alignItems: "center" }}>
              <MicroLabel>NO ACTIVITY YET</MicroLabel>
              <Body size={11} color={C.grey} style={{ marginTop: 6, textAlign: "center" }}>
                You&apos;ll see invites, accepts, and game updates here.
              </Body>
            </View>
          }
          renderItem={({ item }) => {
            const meta = TYPE_META[item.type] || { label: item.type, icon: "ellipse", accent: C.grey };
            const isUnread = !(item.readAt || item.read);
            return (
              <TouchableOpacity activeOpacity={0.85} onPress={() => open(item)}
                                style={[styles.row, isUnread && styles.rowUnread]}>
                <View style={[styles.band, { backgroundColor: meta.accent }]} />
                <View style={styles.rowBody}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name={meta.icon as any} size={16} color={C.ink} />
                    <Text style={styles.typeLabel}>{meta.label}</Text>
                    <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.title}>
                    {item.payload?.title || meta.label}
                  </Text>
                  {!!item.payload?.body && (
                    <Text style={styles.body} numberOfLines={2}>{item.payload.body}</Text>
                  )}
                </View>
                {isUnread && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  header: { flexDirection: "row", alignItems: "center",
            paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
            borderBottomWidth: 1, borderColor: "#00000020" },
  markAllBtn: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1.5, borderColor: C.ink },
  markAllTxt: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.4, color: C.ink },
  row: { flexDirection: "row", backgroundColor: C.white,
         borderBottomWidth: 1, borderColor: "#00000018" },
  rowUnread: { backgroundColor: C.cream },
  band: { width: 4 },
  rowBody: { flex: 1, padding: 14 },
  typeLabel: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.6, color: C.ink, marginLeft: 6, flex: 1 },
  time: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.grey },
  title: { fontFamily: F.ub900, fontSize: 13, letterSpacing: -0.2, color: C.ink, marginTop: 4 },
  body: { fontFamily: F.body, fontSize: 11, color: C.grey, marginTop: 2 },
  unreadDot: { width: 8, height: 8, backgroundColor: C.lime, alignSelf: "center", marginRight: 14 },
});
