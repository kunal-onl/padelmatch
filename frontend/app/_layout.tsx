// Root layout — loads custom fonts + wraps app in player context provider.
import React from "react";
import { Stack } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import {
  useFonts as useUnbounded,
  Unbounded_400Regular,
  Unbounded_700Bold,
  Unbounded_900Black,
} from "@expo-google-fonts/unbounded";
import { DMMono_400Regular, DMMono_500Medium } from "@expo-google-fonts/dm-mono";
import { DMSans_400Regular, DMSans_500Medium } from "@expo-google-fonts/dm-sans";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { PlayerProvider } from "../lib/context";
import { C } from "../lib/theme";

export default function RootLayout() {
  const [loaded] = useUnbounded({
    Unbounded_400Regular,
    Unbounded_700Bold,
    Unbounded_900Black,
    DMMono_400Regular,
    DMMono_500Medium,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  if (!loaded) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={C.lime} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PlayerProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.cream } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="games/[id]" />
            <Stack.Screen name="profile/[id]" />
            <Stack.Screen name="score/[matchId]" />
            <Stack.Screen name="notifications" />
          </Stack>
        </PlayerProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.cream },
});
