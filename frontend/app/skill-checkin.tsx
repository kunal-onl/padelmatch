// Weekly check-in — re-rate the four self-improvement domains. Each domain is
// editable once per 7 days (enforced server-side); locked domains show when
// they next unlock. Every edit appends a new dated snapshot.
import React, { useCallback, useState } from "react";
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "../lib/theme";
import { Heading, MicroLabel, Body } from "../lib/ui";
import { api } from "../lib/api";
import { DOMAIN_META, DOMAIN_PICKS, TIER_BANDS } from "../lib/domains";

function unlockLabel(iso?: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  } catch { return ""; }
}

export default function SkillCheckin() {
  const router = useRouter();
  const [domains, setDomains] = useState<any>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await api.getDomains().catch(() => null);
    setDomains(r?.domains || {});
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pick = async (key: string, tier: number) => {
    const cur = domains?.[key];
    if (cur?.editableAt) return;          // locked this week
    if (cur?.tier === tier) return;       // no change
    setSavingKey(key);
    try {
      await api.setDomain(key, tier, "weekly_self_edit");
      await load();
    } catch { /* surfaced via reload (e.g. race) */ }
    finally { setSavingKey(null); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="checkin-back" style={{ marginRight: 12 }}>
          <Ionicons name="chevron-back" size={26} color={C.ink} />
        </TouchableOpacity>
        <Heading size={20}>WEEKLY CHECK-IN</Heading>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Body size={12} color={C.grey}>A quick, honest read on where you are. One update per domain each week.</Body>

        {!domains ? (
          <ActivityIndicator color={C.ink} style={{ marginTop: 40 }} />
        ) : (
          DOMAIN_META.map(({ key, label }) => {
            const cur = domains[key];
            const curTier = cur?.tier ?? 0;
            const locked = !!cur?.editableAt;
            const picks = key !== "strokes" ? DOMAIN_PICKS[key as "tactics" | "inner" | "outer"] : null;
            return (
              <View key={key} style={styles.card} testID={`checkin-${key}`}>
                <View style={styles.cardHead}>
                  <MicroLabel>{label}</MicroLabel>
                  <Text style={styles.curBand}>{curTier ? `${TIER_BANDS[curTier]} · ${curTier}/6` : "NOT RATED YET"}</Text>
                </View>

                <View style={styles.pills}>
                  {[1, 2, 3, 4, 5, 6].map((t) => {
                    const active = curTier === t;
                    return (
                      <TouchableOpacity key={t} testID={`${key}-tier-${t}`} activeOpacity={0.85}
                        disabled={locked || savingKey === key}
                        onPress={() => pick(key, t)}
                        style={[styles.pill, active && styles.pillActive, locked && styles.pillLocked]}>
                        <Text style={[styles.pillText, active && { color: C.ink }]}>{t}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {picks && curTier > 0 && (
                  <Body size={11} color={C.grey} style={{ marginTop: 8 }}>{picks[curTier - 1]}</Body>
                )}

                {locked ? (
                  <View style={styles.lockRow}>
                    <Ionicons name="lock-closed-outline" size={12} color={C.grey} />
                    <Text style={styles.lockText}>Updates again {unlockLabel(cur.editableAt)}</Text>
                  </View>
                ) : (
                  <Text style={styles.editableText}>{savingKey === key ? "SAVING…" : "TAP A NUMBER TO UPDATE"}</Text>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: BORDER, borderBottomColor: C.ink },
  card: { backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, padding: 14, marginTop: 14 },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  curBand: { fontFamily: F.mono, fontSize: 10, color: C.ink, letterSpacing: 1 },
  pills: { flexDirection: "row", gap: 6, marginTop: 12 },
  pill: { flex: 1, height: 44, borderWidth: BORDER, borderColor: C.ink, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  pillActive: { backgroundColor: C.lime },
  pillLocked: { opacity: 0.5 },
  pillText: { fontFamily: F.ub900, fontSize: 16, color: C.grey },
  lockRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  lockText: { fontFamily: F.mono, fontSize: 10, color: C.grey, letterSpacing: 0.8 },
  editableText: { fontFamily: F.mono, fontSize: 9, color: C.grey, letterSpacing: 1.2, marginTop: 10 },
});
