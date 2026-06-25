// Onboarding — self-rate the four self-improvement domains.
// Strokes uses the gating can-do rubric (derives a tier); tactics/inner/outer
// are single honest self-picks. Writes tiers to the draft; reveal seeds them.
import React, { useEffect, useState } from "react";
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "../../lib/theme";
import { SplitCTA, Heading, MicroLabel, Body } from "../../lib/ui";
import { OnboardingHeader } from "../../lib/onboarding-header";
import { draft, loadDraft, saveDraft } from "../../lib/onboarding-draft";
import { STROKES_RUBRIC, DOMAIN_PICKS, TIER_BANDS, deriveStrokesTier } from "../../lib/domains";

export default function Domains() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [tactics, setTactics] = useState(0);
  const [inner, setInner] = useState(0);
  const [outer, setOuter] = useState(0);

  useEffect(() => { loadDraft(); }, []);

  const strokes = deriveStrokesTier(checked);
  const valid = strokes > 0 && tactics > 0 && inner > 0 && outer > 0;

  const toggle = (k: string) => setChecked((c) => ({ ...c, [k]: !c[k] }));

  const onNext = async () => {
    await saveDraft({ domainStrokes: strokes, domainTactics: tactics, domainInner: inner, domainOuter: outer });
    router.replace("/onboarding/reveal");
  };

  const PickList = ({ value, onPick, options }: { value: number; onPick: (n: number) => void; options: string[] }) => (
    <View style={{ marginTop: 6 }}>
      {options.map((desc, i) => {
        const tier = i + 1;
        const active = value === tier;
        return (
          <TouchableOpacity key={tier} testID={`pick-${tier}`} activeOpacity={0.85}
            onPress={() => onPick(tier)} style={[styles.pickRow, active && styles.pickRowActive]}>
            <Text style={[styles.pickTier, active && { color: C.ink }]}>{tier}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.pickBand}>{TIER_BANDS[tier]}</Text>
              <Text style={styles.pickDesc}>{desc}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <OnboardingHeader step={9} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}>
        <Heading size={22}>YOUR FOUR DOMAINS</Heading>
        <Body size={12} color={C.grey} style={{ marginTop: 6 }}>
          An honest read — you're four different levels at once. Private to you.
        </Body>

        {/* Strokes — gating rubric */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <MicroLabel>STROKES & TECHNIQUE</MicroLabel>
            <Text style={styles.derived}>{strokes ? `${TIER_BANDS[strokes]} · ${strokes}/6` : "TICK WHAT YOU CAN DO"}</Text>
          </View>
          <Body size={11} color={C.grey} style={{ marginTop: 2 }}>
            Tick only what you can do consistently. Your tier is the highest rung you reach.
          </Body>
          {STROKES_RUBRIC.map((block) => (
            <View key={block.tier} style={{ marginTop: 12 }}>
              <Text style={styles.rungLabel}>{block.tier} · {block.band}</Text>
              {block.statements.map((s, i) => {
                const k = `${block.tier}-${i}`;
                const on = !!checked[k];
                return (
                  <TouchableOpacity key={k} testID={`stmt-${k}`} activeOpacity={0.8}
                    onPress={() => toggle(k)} style={styles.stmtRow}>
                    <View style={[styles.box, on && styles.boxOn]}>
                      {on && <Ionicons name="checkmark" size={14} color={C.ink} />}
                    </View>
                    <Text style={styles.stmtText}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Tactics / Inner / Outer — single picks */}
        <View style={styles.section}>
          <MicroLabel>STRATEGY & TACTICS</MicroLabel>
          <PickList value={tactics} onPick={setTactics} options={DOMAIN_PICKS.tactics} />
        </View>
        <View style={styles.section}>
          <MicroLabel>INNER STRENGTH</MicroLabel>
          <PickList value={inner} onPick={setInner} options={DOMAIN_PICKS.inner} />
        </View>
        <View style={styles.section}>
          <MicroLabel>OUTER STRENGTH</MicroLabel>
          <PickList value={outer} onPick={setOuter} options={DOMAIN_PICKS.outer} />
        </View>

        <View style={{ height: 22 }} />
        <SplitCTA testID="domains-continue" label="CONTINUE" intent="forward" onPress={onNext} disabled={!valid} />
        {!valid && (
          <Body size={10} color={C.grey} style={{ marginTop: 8, textAlign: "center" }}>
            Tick at least your beginner strokes and pick a level for each of the other three.
          </Body>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  section: { marginTop: 22 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  derived: { fontFamily: F.mono, fontSize: 10, color: C.ink, letterSpacing: 1 },
  rungLabel: { fontFamily: F.ub700, fontSize: 11, color: C.ink, letterSpacing: 0.5, marginBottom: 4 },
  stmtRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 6, gap: 10 },
  box: { width: 22, height: 22, borderWidth: BORDER, borderColor: C.ink, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  boxOn: { backgroundColor: C.lime },
  stmtText: { flex: 1, fontFamily: F.sans, fontSize: 12, color: C.ink, lineHeight: 17 },
  pickRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 10, borderWidth: BORDER, borderColor: C.ink, backgroundColor: C.white, marginBottom: 6 },
  pickRowActive: { backgroundColor: C.lime },
  pickTier: { fontFamily: F.ub900, fontSize: 18, color: C.grey, width: 22, textAlign: "center" },
  pickBand: { fontFamily: F.mono, fontSize: 9, color: C.grey, letterSpacing: 1.2 },
  pickDesc: { fontFamily: F.sans, fontSize: 12, color: C.ink, lineHeight: 17, marginTop: 2 },
});
