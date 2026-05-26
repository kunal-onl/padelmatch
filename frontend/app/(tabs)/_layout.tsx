// Custom bottom tab layout — 5 tabs with raised lime "+" centre.
import React from "react";
import { View, TouchableOpacity, StyleSheet, Text, Platform } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, F, BORDER } from "../../lib/theme";

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_META: Record<string, { icon: IconName; label: string; testID: string }> = {
  home: { icon: "home", label: "HOME", testID: "tab-home" },
  games: { icon: "tennisball-outline", label: "GAMES", testID: "tab-games" },
  create: { icon: "add", label: "CREATE", testID: "tab-create" },
  courts: { icon: "grid-outline", label: "COURTS", testID: "tab-courts" },
  profile: { icon: "person-circle-outline", label: "PROFILE", testID: "tab-profile" },
};

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom - 4, 8) }]}>
      {state.routes.map((route: any, index: number) => {
        const meta = TAB_META[route.name];
        if (!meta) return null;
        const focused = state.index === index;
        const isCenter = route.name === "create";

        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        if (isCenter) {
          return (
            <TouchableOpacity
              key={route.key}
              testID={meta.testID}
              onPress={onPress}
              activeOpacity={0.85}
              style={styles.centerWrap}
            >
              <View style={styles.centerBtn}>
                <Ionicons name="add" size={32} color={C.ink} />
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            testID={meta.testID}
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.tab}
          >
            <Ionicons
              name={meta.icon}
              size={22}
              color={focused ? C.lime : "rgba(255,255,255,0.35)"}
            />
            <Text style={[styles.label, { color: focused ? C.lime : "rgba(255,255,255,0.35)" }]}>
              {meta.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="games" />
      <Tabs.Screen name="create" />
      <Tabs.Screen name="courts" />
      <Tabs.Screen name="profile" />
      {/* Leaderboard route is preserved but hidden from the tab bar. */}
      <Tabs.Screen name="leaderboard" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: C.ink,
    borderTopWidth: BORDER,
    borderTopColor: C.ink,
    minHeight: 70,
    paddingTop: 8,
    alignItems: "flex-start",
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 6 },
  label: { fontFamily: F.ub700, fontSize: 9, letterSpacing: 1, marginTop: 4 },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: -22 },
  centerBtn: {
    width: 60, height: 60, backgroundColor: C.lime,
    borderWidth: BORDER, borderColor: C.ink,
    alignItems: "center", justifyContent: "center",
  },
});
