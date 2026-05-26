// Entry: route to tabs if a player is signed in, otherwise onboarding.
// Shows the official PadelMatch lockup on the splash/loading state.
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { usePlayer } from "../lib/context";
import { C } from "../lib/theme";
import { LockupImage } from "../components/brand/Logo";

export default function Index() {
  const { player, loading } = usePlayer();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.ink }}>
        <LockupImage width={240} variant="horizontal-ink" />
        <View style={{ height: 28 }} />
        <ActivityIndicator color={C.lime} />
      </View>
    );
  }
  if (!player) return <Redirect href="/onboarding/identity" />;
  return <Redirect href="/(tabs)/home" />;
}
