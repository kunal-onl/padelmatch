// Brand-kit preview route — open /brand-kit in the app to inspect
// the Logo, Lockup, Mark, all 6 containers, and the 4 textures.
import React from "react";
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { T, F } from "../lib/brand-tokens";
import { Logo, Lockup, Mark } from "../components/brand/Logo";
import {
  ContainerA, ContainerB, ContainerC, ContainerD,
  ContainerE, ContainerF, GlassInset, NetDivider,
} from "../components/brand/Containers";
import { Perforations, CourtLines, GlassPanels, WireFence } from "../components/brand/Textures";

function H({ children }: { children: string }) {
  return (
    <Text style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 1.8, color: T.grey, marginTop: 24, marginBottom: 10 }}>
      {children.toUpperCase()}
    </Text>
  );
}

export default function BrandKit() {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.cream }} edges={["top"]}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()} testID="brand-back">
          <Ionicons name="chevron-back" size={24} color={T.ink} />
        </TouchableOpacity>
        <Text style={{ fontFamily: F.display, color: T.ink, fontSize: 16, marginLeft: 8 }}>
          BRAND KIT
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {/* LOGO */}
        <H>1 · Mark</H>
        <View style={styles.row}><Logo size={64} /></View>

        <H>2 · Mark on ink</H>
        <View style={[styles.row, { backgroundColor: T.ink, padding: 16 }]}>
          <Logo size={64} onInk />
        </View>

        <H>3 · Lockup</H>
        <View style={styles.row}><Lockup size={220} /></View>

        <H>4 · Lockup w/ tagline</H>
        <View style={styles.row}><Lockup size={260} showTagline /></View>

        <H>5 · Letter variants</H>
        <View style={[styles.row, { gap: 16, flexDirection: "row" }]}>
          <Mark size={48} letter="P" />
          <Mark size={48} letter="M" />
        </View>

        {/* CONTAINERS */}
        <H>Containers</H>
        <ContainerA label="A — 3px ink, inset" style={{ marginBottom: 12 }}>
          <Text style={txt}>Content.</Text>
        </ContainerA>
        <ContainerB label="B — Corner brackets" style={{ marginBottom: 12 }}>
          <Text style={txt}>Content with hairline corner marks.</Text>
        </ContainerB>
        <ContainerC label="C — Left accent" accentColor={T.lime} style={{ marginBottom: 12 }}>
          <Text style={txt}>Content with 4px lime left rail.</Text>
        </ContainerC>
        <ContainerD label="D — Top accent" accentColor={T.error} style={{ marginBottom: 12 }}>
          <Text style={txt}>Content with 5px coral cap.</Text>
        </ContainerD>
        <ContainerE label="E — Open right" style={{ marginBottom: 12 }}>
          <Text style={txt}>Right edge intentionally open.</Text>
        </ContainerE>
        <ContainerF label="F — Dashed" style={{ marginBottom: 12 }}>
          <Text style={txt}>Placeholder / dashed edge.</Text>
        </ContainerF>
        <GlassInset label="Glass inset" style={{ marginBottom: 12 }}>
          <Text style={txt}>1px border, translucent white.</Text>
        </GlassInset>

        <H>Net divider</H>
        <View style={[styles.row, { flexDirection: "row", alignItems: "center", padding: 12 }]}>
          <Text style={txt}>LEFT</Text>
          <NetDivider height={32} style={{ marginHorizontal: 12 }} />
          <Text style={txt}>RIGHT</Text>
        </View>

        {/* TEXTURES */}
        <H>Textures</H>
        <Perforations background={T.cream} style={tx} opacity={T.txStandard}>
          <Text style={txt}>Perforations</Text>
        </Perforations>
        <CourtLines background={T.cream} style={tx} opacity={T.txStandard}>
          <Text style={txt}>Court lines</Text>
        </CourtLines>
        <GlassPanels background={T.cream} style={tx} opacity={T.txStandard}>
          <Text style={txt}>Glass panels</Text>
        </GlassPanels>
        <WireFence background={T.cream} style={tx} opacity={T.txBold}>
          <Text style={txt}>Wire fence</Text>
        </WireFence>

        <H>Textures on ink</H>
        <Perforations background={T.ink} color={T.lime} opacity={0.18} style={tx}>
          <Text style={[txt, { color: T.lime }]}>Perforations · lime on ink</Text>
        </Perforations>
        <CourtLines background={T.ink} color={T.lime} opacity={0.14} style={tx}>
          <Text style={[txt, { color: T.lime }]}>Court lines · lime on ink</Text>
        </CourtLines>
      </ScrollView>
    </SafeAreaView>
  );
}

const txt = { fontFamily: F.body, color: T.ink, fontSize: 12 } as const;
const tx = { height: 110, padding: 16, marginBottom: 12, borderWidth: T.s2, borderColor: T.ink } as const;

const styles = StyleSheet.create({
  topbar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: T.s2, borderColor: T.ink, backgroundColor: T.cream },
  row: { padding: 16, borderWidth: T.s2, borderColor: T.ink, backgroundColor: T.white, alignItems: "center", justifyContent: "center", marginBottom: 4 },
});
