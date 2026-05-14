// Step 4: Connections — search players, tap to mark "played with" / "want to play" / "prefer not".
import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView, TextInput, TouchableOpacity, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, Heading, MicroLabel, Avatar, Body } from "../../lib/ui";
import { OnboardingHeader } from "../../lib/onboarding-header";
import { draft } from "../../lib/onboarding-draft";
import { api } from "../../lib/api";

type Rel = "played_with" | "want_to_play" | "prefer_not";
type Conn = { playerId: string; relationship: Rel; reason: string | null; addedAt: string };

const REASONS = ["skill", "social", "both"];

export default function Connections() {
  const router = useRouter();
  const [players, setPlayers] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [conns, setConns] = useState<Conn[]>(draft.connections as Conn[]);

  useEffect(() => {
    api.listPlayers().then((all) => setPlayers(all.filter((p: any) => p.id !== "kunal"))).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => p.name.toLowerCase().includes(q));
  }, [players, query]);

  const findConn = (pid: string) => conns.find((c) => c.playerId === pid);
  const setConn = (pid: string, rel: Rel | null, reason: string | null = null) => {
    setConns((cs) => {
      const others = cs.filter((c) => c.playerId !== pid);
      if (!rel) return others;
      return [...others, { playerId: pid, relationship: rel, reason, addedAt: new Date().toISOString() }];
    });
  };

  const onNext = () => {
    draft.connections = conns as any;
    router.push("/onboarding/shots");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <OnboardingHeader
        step={4}
        rightAction={
          <TouchableOpacity onPress={() => router.push("/onboarding/shots")} testID="skip-connections">
            <Text style={{ fontFamily: F.ub700, color: C.ink, fontSize: 10, letterSpacing: 1 }}>SKIP →</Text>
          </TouchableOpacity>
        }
      />
      <View style={{ paddingHorizontal: 16 }}>
        <Heading size={20}>WHO HAVE YOU PLAYED WITH?</Heading>
        <Body size={11} color={C.grey} style={{ marginTop: 6 }}>
          Your preferences are private and never shown to other players.
        </Body>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={C.grey} />
          <TextInput
            testID="connection-search"
            placeholder="Search players"
            placeholderTextColor={C.grey}
            style={styles.search}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}>
        {filtered.map((p) => {
          const c = findConn(p.id);
          const leftColor =
            c?.relationship === "played_with" ? C.lime :
            c?.relationship === "want_to_play" ? C.blue :
            c?.relationship === "prefer_not" ? C.coral : "transparent";
          return (
            <View key={p.id} style={[styles.row, { borderLeftWidth: 4, borderLeftColor: leftColor }]} testID={`conn-row-${p.id}`}>
              <View style={{ flexDirection: "row", alignItems: "center", padding: 12 }}>
                <Avatar name={p.name} size={40} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ fontFamily: F.ub700, fontSize: 12, color: C.ink, letterSpacing: -0.3 }}>{p.name.toUpperCase()}</Text>
                  <View style={{ flexDirection: "row", marginTop: 2, gap: 8 }}>
                    <Text style={{ fontFamily: F.mono, fontSize: 10, color: C.grey }}>{p.gameRating.toFixed(1)}</Text>
                    <Text style={{ fontFamily: F.sans, fontSize: 10, color: C.grey }}>· {p.preferredVenues?.[0] ? p.preferredVenues[0].split("-")[0].toUpperCase() : ""}</Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setConn(p.id, c?.relationship === "played_with" ? null : "played_with", c?.relationship === "played_with" ? c?.reason ?? null : "both")}
                  style={[styles.iconCell, { backgroundColor: c?.relationship === "played_with" ? C.lime : C.cream }]}
                  testID={`played-${p.id}`}
                >
                  <Ionicons name="tennisball" size={16} color={C.ink} />
                </Pressable>
                <Pressable
                  onPress={() => setConn(p.id, c?.relationship === "want_to_play" ? null : "want_to_play")}
                  style={[styles.iconCell, { backgroundColor: c?.relationship === "want_to_play" ? C.blue : C.cream, marginLeft: 6 }]}
                  testID={`want-${p.id}`}
                >
                  <Ionicons name="add" size={16} color={c?.relationship === "want_to_play" ? C.white : C.ink} />
                </Pressable>
                <Pressable
                  onPress={() => setConn(p.id, c?.relationship === "prefer_not" ? null : "prefer_not")}
                  style={[styles.iconCell, { backgroundColor: c?.relationship === "prefer_not" ? C.coral : C.cream, marginLeft: 6 }]}
                  testID={`block-${p.id}`}
                >
                  <Ionicons name="close" size={16} color={c?.relationship === "prefer_not" ? C.white : C.ink} />
                </Pressable>
              </View>

              {c?.relationship === "played_with" && (
                <View style={{ flexDirection: "row", paddingHorizontal: 12, paddingBottom: 10 }}>
                  {REASONS.map((r) => {
                    const active = c.reason === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        onPress={() => setConn(p.id, "played_with", r)}
                        style={[styles.reason, active && { backgroundColor: C.lime }]}
                        testID={`reason-${p.id}-${r}`}
                      >
                        <Text style={{ fontFamily: F.ub700, fontSize: 9, letterSpacing: 1, color: C.ink }}>{r.toUpperCase()}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={{ padding: 20 }}>
        <SplitCTA testID="onboarding-step4-continue" label={`CONTINUE (${conns.length})`} onPress={onNext} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  searchRow: {
    marginTop: 12, flexDirection: "row", alignItems: "center", paddingHorizontal: 12,
    backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, minHeight: 44,
  },
  search: { marginLeft: 8, flex: 1, color: C.ink, fontFamily: F.sans, fontSize: 13 },
  row: { backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, marginBottom: 8 },
  iconCell: {
    width: 36, height: 36, alignItems: "center", justifyContent: "center",
    borderWidth: BORDER, borderColor: C.ink,
  },
  reason: {
    paddingHorizontal: 10, paddingVertical: 6, borderWidth: BORDER, borderColor: C.ink,
    marginRight: 6, backgroundColor: C.cream,
  },
});
