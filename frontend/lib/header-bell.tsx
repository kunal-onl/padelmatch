// Header bell — persistent inbox affordance shared across main screens.
//
// Renders a tiny bell icon + lime unread-count badge. Tapping pushes
// `/inbox`. Re-polls every 30s while mounted so the badge stays fresh
// without push (push will eventually drive immediate updates).
import React, { useCallback, useEffect, useState } from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F } from "./theme";
import { api } from "./api";

export function HeaderBell({ color = C.ink }: { color?: string }) {
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const ns = await api.notifications(50);
      setUnread((ns as any[]).filter((n) => !(n.readAt || n.read)).length);
    } catch {/* noop */}
  }, []);

  // Refresh on focus + every 30s while mounted.
  useFocusEffect(useCallback(() => {
    refresh();
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, [refresh]));

  return (
    <TouchableOpacity testID="header-bell" activeOpacity={0.7}
                      onPress={() => router.push("/inbox" as any)}
                      style={styles.wrap}>
      <Ionicons name="notifications-outline" size={22} color={color} />
      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>{unread > 9 ? "9+" : String(unread)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 36, height: 36, alignItems: "center", justifyContent: "center", position: "relative" },
  badge: { position: "absolute", top: 2, right: 2,
           minWidth: 16, height: 16, paddingHorizontal: 3,
           backgroundColor: C.lime, borderWidth: 1.5, borderColor: C.ink,
           alignItems: "center", justifyContent: "center" },
  badgeTxt: { fontFamily: F.ub900, fontSize: 9, color: C.ink, letterSpacing: 0 },
});
