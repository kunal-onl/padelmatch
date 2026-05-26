// Courts tab — embeds an external court-finder web app.
//
// On web preview the iframe is rendered natively. On iOS/Android it uses
// react-native-webview. Source URL comes from the env var
// EXPO_PUBLIC_COURTS_URL (or REACT_APP_COURTS_URL for parity with the
// spec), falling back to http://localhost:5052 for local dev.
import React from "react";
import { View, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, F, BORDER } from "../../lib/theme";
import { Heading, MicroLabel } from "../../lib/ui";

const COURTS_URL =
  process.env.EXPO_PUBLIC_COURTS_URL ||
  // @ts-expect-error — REACT_APP_* exists at build time when running web
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_COURTS_URL) ||
  "http://localhost:5052";

function CourtsEmbed() {
  if (Platform.OS === "web") {
    // Render a raw HTML iframe — only available in the web bundle.
    return React.createElement("iframe", {
      src: COURTS_URL,
      style: {
        width: "100%",
        height: "100%",
        border: "none",
        display: "block",
      },
      title: "PadelMatch court finder",
    });
  }
  // Native — defer-require so the web bundle never tries to load WebView.
  const { WebView } = require("react-native-webview");
  return (
    <WebView
      source={{ uri: COURTS_URL }}
      style={{ flex: 1 }}
      originWhitelist={["*"]}
      javaScriptEnabled
    />
  );
}

export default function Courts() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Heading size={24} color={C.white}>FIND A COURT</Heading>
        <View style={{ height: 6 }} />
        <MicroLabel color="rgba(255,255,255,0.55)">
          CHECKS ALL 8 NORTH GOA VENUES · ~30 SECONDS
        </MicroLabel>
        <View style={styles.limeRule} />
      </View>
      <View style={styles.embedWrap}>
        <CourtsEmbed />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  header: {
    backgroundColor: C.ink,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: BORDER,
    borderBottomColor: C.lime,
  },
  limeRule: {
    height: BORDER,
    backgroundColor: C.lime,
    marginTop: 10,
    marginHorizontal: -16,
  },
  embedWrap: { flex: 1, backgroundColor: C.cream },
});
