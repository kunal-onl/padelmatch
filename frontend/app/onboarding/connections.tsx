// Step 8 of 9: Connections — "Played with" only, with multi-tag context.
// V2 spec: Removed "want to play" and "prefer not". Each tagged player
// is logged as `played_with` and the user can tag the relationship with
// "SOCIAL" and/or "COMPETITIVE" (multi-select). Icon set updated for
// clearer affordances (tennisball = tap to add, x = remove).
import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, Heading, Avatar, Body } from "../../lib/ui";
import { OnboardingHeader } from "../../lib/onboarding-header";
import { loadDraft, saveDraft, ConnectionDraft } from "../../lib/onboarding-draft";
import { api } from "../../lib/api";

const TAGS = [
  { key: "social", label: "SOCIAL", accent: C.purple },
  { key: "competitive", label: "COMPETITIVE", accent: C.blue },
];

export default function Connections() {
  const router = useRouter();
  const [players, setPlayers] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [conns, setConns] = useState<ConnectionDraft[]>([]);

  useEffect(() => {
    loadDraft().then((d) => setConns(d.connections));
    api.listPlayers().then((all) => setPlayers(all.filter((p: any) => p.id !== "kunal"))).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => p.name.toLowerCase().includes(q));
  }, [players, query]);

  const findConn = (pid: string) => conns.find((c) => c.playerId === pid);

  const toggleAdd = (pid: string) => {
    setConns((cs) => {
      const exists = cs.find((c) => c.playerId === pid);
      if (exists) return cs.filter((c) => c.playerId !== pid);
      return [
        ...cs,
        { playerId: pid, relationship: "played_with", tags: [], reason: null, addedAt: new Date().toISOString() },
      ];
    });
  };

  const toggleTag = (pid: string, tag: string) => {
    setConns((cs) =>
      cs.map((c) => {
        if (c.playerId !== pid) return c;
        const has = c.tags.includes(tag);
        const next = has ? c.tags.filter((t) => t !== tag) : [...c.tags, tag];
        return { ...c, tags: next, reason: next[0] || null };
      }),
    );
  };

  const onNext = async () => {
    await saveDraft({ connections: conns });
    router.push("/onboarding/otp");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <OnboardingHeader
        step={8}
        rightAction={
          <TouchableOpacity onPress={() => router.push("/onboarding/otp")} testID="skip-connections">
            <Text style={{ fontFamily: F.ub700, color: C.ink, fontSize: 10, letterSpacing: 1 }}>SKIP →</Text>
          </TouchableOpacity>
        }
      />
      <View style={{ paddingHorizontal: 16 }}>
        <Heading size={20}>WHO HAVE YOU PLAYED WITH?</Heading>
        <Body size={11} color={C.grey} style={{ marginTop: 6 }}>
          Tap the ball to add a player. Then tag the context — social, competitive, or both.
          Private to you.
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
          const added = !!c;
          return (
            <View key={p.id} style={[styles.row, added && { borderLeftWidth: 6, borderLeftColor: C.lime }]} testID={`conn-row-${p.id}`}>
              <View style={{ flexDirection: "row", alignItems: "center", padding: 12 }}>
                <Avatar name={p.name} size={40} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ fontFamily: F.ub700, fontSize: 12, color: C.ink, letterSpacing: -0.3 }}>{p.name.toUpperCase()}</Text>
                  <View style={{ flexDirection: "row", marginTop: 2, gap: 8 }}>
                    <Text style={{ fontFamily: F.mono, fontSize: 10, color: C.grey }}>{p.gameRating.toFixed(1)}</Text>
                    <Text style={{ fontFamily: F.sans, fontSize: 10, color: C.grey }}>
                      · {p.preferredVenues?.[0] ? p.preferredVenues[0].split("-")[0].toUpperCase() : ""}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => toggleAdd(p.id)}
                  style={[styles.actionBtn, added ? styles.actionBtnAdded : styles.actionBtnEmpty]}
                  testID={`add-${p.id}`}
                  activeOpacity={0.8}
                >
                  {/* UX-AUDIT (May 2026): replaced "tennisball" with the
                      brand's ContainerF (dashed border + plus) "awaiting
                      input" pattern. Tennis ball isn't part of the brand's
                      icon vocabulary — plus is. */}
                  <Ionicons
                    name={added ? "checkmark" : "add"}
                    size={22}
                    color={C.ink}
                  />
                </TouchableOpacity>
              </View>

              {added && (
                <View style={styles.tagRow}>
                  {TAGS.map((t) => {
                    const active = c!.tags.includes(t.key);
                    return (
                      <TouchableOpacity
                        key={t.key}
                        onPress={() => toggleTag(p.id, t.key)}
                        style={[styles.tag, { backgroundColor: active ? t.accent : C.white, borderColor: C.ink }]}
                        testID={`tag-${p.id}-${t.key}`}
                      >
                        <Text style={{ fontFamily: F.ub700, fontSize: 10, letterSpacing: 1, color: active ? C.white : C.ink }}>
                          {t.label}
                        </Text>
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
        <SplitCTA testID="onboarding-step8-continue" label={`CONTINUE (${conns.length})`} onPress={onNext} />
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
  actionBtn: {
    width: 44, height: 44,
    alignItems: "center", justifyContent: "center",
  },
  // ContainerF (dashed + plus): awaiting-input placeholder.
  actionBtnEmpty: {
    backgroundColor: "transparent",
    borderWidth: 1.5, borderColor: C.grey, borderStyle: "dashed",
  },
  // Filled / added: solid lime + ink border + ink check.
  actionBtnAdded: {
    backgroundColor: C.lime,
    borderWidth: BORDER, borderColor: C.ink,
  },
  tagRow: { flexDirection: "row", paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  tag: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: BORDER,
  },
});
