// Entry: route to tabs if a player is signed in, otherwise onboarding.
import { useEffect } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { usePlayer } from "../lib/context";
import { C } from "../lib/theme";

export default function Index() {
  const { player, loading } = usePlayer();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.cream }}>
        <ActivityIndicator color={C.ink} />
      </View>
    );
  }
  if (!player) return <Redirect href="/onboarding/identity" />;
  return <Redirect href="/(tabs)/home" />;
}
