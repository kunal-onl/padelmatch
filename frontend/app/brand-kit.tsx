// Brand-kit preview route — open /brand-kit in the app to inspect
// the official Logo, Lockup, Mark, all 6 containers, and the 4 textures.
import React from "react";
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { T, F } from "../lib/brand-tokens";
import { Logo, Lockup, Mark, AppIcon, BrandAvatar } from "../components/brand/Logo";
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
        {/* MARK */}
        <H>Mark · cream</H>
        <View style={styles.row}><Logo size={72} /></View>

        <H>Mark · ink</H>
        <View style={[styles.row, { backgroundColor: T.ink }]}>
          <Logo size={72} variant="ink" />
        </View>

        <H>Mark · white</H>
        <View style={[styles.row, { backgroundColor: T.white }]}>
          <Logo size={72} variant="white" />
        </View>

        <H>Letter variants</H>
        <View style={[styles.row, { flexDirection: "row", justifyContent: "space-around" }]}>
          <Mark size={56} letter="P" />
          <Mark size={56} letter="M" />
        </View>

        <H>Lockup</H>
        <View style={styles.row}><Lockup size={260} /></View>

        <H>Lockup with tagline</H>
        <View style={styles.row}><Lockup size={300} showTagline /></View>

        <H>Lockup on ink</H>
        <View style={[styles.row, { backgroundColor: T.ink }]}>
          <Lockup size={260} variant="ink" />
        </View>

        <H>App icon · lime / cream / ink</H>
        <View style={[styles.row, { flexDirection: "row", gap: 16, justifyContent: "center" }]}>
          <AppIcon size={72} variant="lime" />
          <AppIcon size={72} variant="cream" />
          <AppIcon size={72} variant="ink" />
        </View>

        <H>Brand avatars</H>
        <View style={[styles.row, { flexDirection: "row", gap: 16, justifyContent: "center" }]}>
          <BrandAvatar size={72} variant="cream" />
          <BrandAvatar size={72} variant="ink" />
        </View>

        {/* CONTAINERS */}
        <H>Containers</H>
        <ContainerA label="A · 3px ink, inner inset" style={{ marginBottom: 12 }}>
          <Text style={txt}>Interactive primary card.</Text>
        </ContainerA>
        <ContainerB label="B · Corner brackets" style={{ marginBottom: 12 }}>
          <Text style={txt}>Read-only information.</Text>
        </ContainerB>
        <ContainerC label="C · Left accent (lime)" accentColor={T.lime} style={{ marginBottom: 12 }}>
          <Text style={txt}>Status / state indicator.</Text>
        </ContainerC>
        <ContainerD label="D · Top accent (blue)" accentColor={T.blue} style={{ marginBottom: 12 }}>
          <Text style={txt}>Category cap.</Text>
        </ContainerD>
        <ContainerE label="E · Open right" style={{ marginBottom: 12 }}>
          <Text style={txt}>In-progress / incomplete.</Text>
        </ContainerE>
        <ContainerF label="F · Dashed" style={{ marginBottom: 12 }}>
          <Text style={txt}>Awaiting input.</Text>
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

        <H>Textures · lime on ink</H>
        <Perforations background={T.ink} color={T.lime} opacity={0.18} style={tx}>
          <Text style={[txt, { color: T.lime }]}>Perforations</Text>
        </Perforations>
        <CourtLines background={T.ink} color={T.lime} opacity={0.14} style={tx}>
          <Text style={[txt, { color: T.lime }]}>Court lines</Text>
        </CourtLines>

        <H>Asset URLs (server-hosted)</H>
        <View style={[styles.row, { alignItems: "flex-start" }]}>
          <Text style={[txt, { fontFamily: F.mono, fontSize: 10, lineHeight: 16 }]}>
            GET /api/brand{"\n"}
            GET /api/brand/files/padelmatch-mark-cream.svg{"\n"}
            GET /api/brand/files/padelmatch-mark-ink.svg{"\n"}
            GET /api/brand/files/padelmatch-mark-white.svg{"\n"}
            GET /api/brand/files/padelmatch-P-cream.svg{"\n"}
            GET /api/brand/files/padelmatch-M-cream.svg{"\n"}
            GET /api/brand/files/padelmatch-pulse-cream.svg{"\n"}
            GET /api/brand/files/padelmatch-appicon-lime.svg{"\n"}
            GET /api/brand/files/padelmatch-tokens.json
          </Text>
        </View>
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
