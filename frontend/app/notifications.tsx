// Notifications list.
import React, { useCallback, useEffect, useState } from "react";
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "../lib/theme";
import { Heading, Body, MicroLabel } from "../lib/ui";
import { api } from "../lib/api";
import { formatTimeAgo } from "../lib/utils";

const TYPE_META: Record<string, { bg: string; icon: any; fg: string }> = {
  // Live game-journey types
  invite_received:    { bg: C.lime,  icon: "mail-outline",       fg: C.ink },
  invite_accepted:    { bg: C.lime,  icon: "checkmark",          fg: C.ink },
  near_miss_received: { bg: C.blue,  icon: "time-outline",       fg: C.white },
  game_booked:        { bg: C.ink,   icon: "calendar-outline",   fg: C.lime },
  game_cancelled:     { bg: C.coral, icon: "close",              fg: C.white },
  score_prompt:       { bg: C.cream, icon: "tennisball-outline", fg: C.ink },
  // Legacy / seed types
  game_opened:        { bg: C.lime,  icon: "flash",              fg: C.ink },
  rank_up:            { bg: C.blue,  icon: "trophy",             fg: C.white },
  score_request:      { bg: C.cream, icon: "tennisball-outline", fg: C.ink },
  rating_update:      { bg: C.blue,  icon: "arrow-up",           fg: C.white },
  new_player:         { bg: C.ink,   icon: "person-add-outline", fg: C.lime },
};

export default function Notifications() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setItems(await api.notifications()); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const onTap = async (n: any) => {
    await api.markRead(n.id).catch(() => {});
    // Every notification relates to a game — open it (the game detail exposes
    // the right action, incl. score entry). Fall back to any deep link.
    const gid = n.gameId || n.relatedId || n.payload?.gameId;
    if (gid) {
      router.push(`/games/${gid}` as any);
    } else if (typeof n.payload?.deepLink === "string") {
      router.push(n.payload.deepLink as any);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="nt-back" style={{ marginRight: 12 }}>
          <Ionicons name="chevron-back" size={26} color={C.ink} />
        </TouchableOpacity>
        <Heading size={20}>NOTIFICATIONS</Heading>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {items.length === 0 && (
          <Body size={12} color={C.grey} style={{ textAlign: "center", marginTop: 30 }}>
            No notifications yet.
          </Body>
        )}
        {items.map((n) => {
          const meta = TYPE_META[n.type] || TYPE_META["new_player"];
          return (
            <TouchableOpacity
              key={n.id}
              testID={`notif-${n.id}`}
              onPress={() => onTap(n)}
              activeOpacity={0.85}
              style={[styles.row, !n.read && { borderLeftWidth: 4, borderLeftColor: C.lime }]}
            >
              <View style={[styles.iconBox, { backgroundColor: meta.bg }]}>
                <Ionicons name={meta.icon} size={20} color={meta.fg} />
              </View>
              <View style={{ flex: 1, padding: 12 }}>
                <Body size={12}>{n.message || "New activity on one of your games"}</Body>
                <Text style={{ fontFamily: F.mono, fontSize: 9, color: C.grey, marginTop: 4, letterSpacing: 1 }}>
                  {formatTimeAgo(n.createdAt)} AGO
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: BORDER, borderBottomColor: C.ink,
  },
  row: {
    flexDirection: "row", alignItems: "stretch",
    backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, marginBottom: 8,
  },
  iconBox: { width: 56, alignItems: "center", justifyContent: "center", borderRightWidth: BORDER, borderColor: C.ink },
});
