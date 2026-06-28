// Courts tab — native "Find a Court" screen built on the Sport Brutalism
// design system. Replaces the old iframe embed of the external finder so the
// tab is visually consistent with the rest of the app.
//
// Live view: opens an SSE stream (GET /api/availability/stream) so each venue's
// result fills in as the finder resolves it. Falls back to the one-shot
// POST /api/availability/check (api.availabilityCheck) when EventSource isn't
// available (native) or the stream fails — so the tab always works.
import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { C, F, BORDER } from "../../lib/theme";
import { Heading, MicroLabel, Body, SplitCTA, Pill } from "../../lib/ui";
import { api } from "../../lib/api";

const STARTS = ["06:00", "07:00", "08:00", "16:00", "17:00", "18:00", "19:00", "20:00"];
const DURATIONS = [60, 90, 120];
// Single source of truth for the venue count in all Courts copy. Keep in sync
// with the backend VENUES_SEED list.
const VENUE_COUNT = 9;

function nextDateFor(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}
function dayLabel(offset: number): string {
  if (offset === 0) return "TODAY";
  const d = new Date(nextDateFor(offset) + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }).toUpperCase();
}
function endFor(start: string, durMin: number): string {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + durMin;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
function to12h(t24: string): string {
  const [h, m] = t24.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

const SOURCE_TAG: Record<string, { label: string; color: string }> = {
  finder: { label: "LIVE", color: C.lime },
  cache: { label: "CACHED", color: C.blue },
  stub: { label: "SAMPLE DATA", color: C.coral },
  error: { label: "ERROR", color: C.coral },
};

type Opt = {
  venueId: string; venueName: string; location?: string; time?: string;
  price?: number | string | null; hudleUrl?: string | null;
  available?: boolean; checking?: boolean;
};
type Snap = { options: Opt[]; source: string; streaming?: boolean; total?: number };

export default function Courts() {
  const [dayOffset, setDayOffset] = useState(0);
  const [startTime, setStartTime] = useState("18:00");
  const [duration, setDuration] = useState(90);
  const [loading, setLoading] = useState(false);
  const [snap, setSnap] = useState<Snap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<any>(null);

  const date = nextDateFor(dayOffset);
  const endTime = endFor(startTime, duration);

  // Always clean up any open stream on unmount.
  useEffect(() => () => { try { esRef.current?.close?.(); } catch {} }, []);

  // One-shot fallback (the original, proven path).
  const searchOnce = async (force = false) => {
    setLoading(true);
    setError(null);
    if (!force) setSnap(null);
    try {
      const s = await api.availabilityCheck(date, startTime, endTime, force);
      setSnap({ options: s.options || [], source: s.source });
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  // Live streaming search (web). Falls back to searchOnce on any problem.
  const search = (force = false) => {
    // Force-refresh and non-web both use the proven one-shot path.
    const base = process.env.EXPO_PUBLIC_BACKEND_URL;
    if (force || typeof EventSource === "undefined" || !base) {
      return searchOnce(force);
    }

    try { esRef.current?.close?.(); } catch {}
    setLoading(true);
    setError(null);
    setSnap(null);

    const url = `${base}/api/availability/stream?date=${encodeURIComponent(date)}`
      + `&start=${encodeURIComponent(startTime)}&end=${encodeURIComponent(endTime)}`;

    let opened = false;     // got at least a meta/venue event
    let done = false;       // saw the done event
    let es: any;
    try {
      es = new EventSource(url);
    } catch {
      return searchOnce(false);
    }
    esRef.current = es;

    const finish = (source?: string) => {
      done = true;
      setLoading(false);
      setSnap((prev) => prev ? {
        ...prev, streaming: false,
        options: prev.options.map((o) => ({ ...o, checking: false })),
        source: source || prev.source,
      } : prev);
      try { es.close(); } catch {}
    };

    es.addEventListener("meta", (ev: any) => {
      opened = true;
      try {
        const d = JSON.parse(ev.data);
        const opts: Opt[] = (d.venues || []).map((v: any) => ({ ...v, checking: true, available: false }));
        setSnap({ options: opts, source: d.source || "finder", streaming: true, total: d.total });
      } catch {}
    });

    es.addEventListener("venue", (ev: any) => {
      opened = true;
      try {
        const v: Opt = JSON.parse(ev.data);
        setSnap((prev) => {
          const base0: Snap = prev || { options: [], source: "finder", streaming: true };
          const idx = base0.options.findIndex((o) => o.venueId === v.venueId);
          const next = idx >= 0
            ? base0.options.map((o, i) => (i === idx ? { ...v, checking: false } : o))
            : [...base0.options, { ...v, checking: false }];
          return { ...base0, options: next };
        });
      } catch {}
    });

    es.addEventListener("done", (ev: any) => {
      let source: string | undefined;
      try { source = JSON.parse(ev.data)?.source; } catch {}
      finish(source);
    });

    es.addEventListener("error", () => {
      if (done) return;            // normal close after done — ignore
      try { es.close(); } catch {}
      if (!opened) { searchOnce(false); return; }   // never connected → fallback
      finish();                    // partial data → finalize with what we have
    });
  };

  const options = snap?.options || [];
  const checking = options.filter((o) => o.checking);
  const available = options.filter((o) => o.available && !o.checking);
  const unavailable = options.filter((o) => !o.available && !o.checking);
  const resolved = options.length - checking.length;
  const streaming = !!snap?.streaming;
  const tag = snap ? (SOURCE_TAG[snap.source] || (streaming ? SOURCE_TAG.finder : null)) : null;
  // Show the big loader only before any card exists.
  const showLoader = loading && (!snap || options.length === 0);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Heading size={24} color={C.white}>FIND A COURT</Heading>
        <View style={{ height: 6 }} />
        <MicroLabel color="rgba(255,255,255,0.55)">
          CHECKS ALL {VENUE_COUNT} NORTH GOA VENUES · LIVE
        </MicroLabel>
        <View style={styles.limeRule} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <MicroLabel>WHEN</MicroLabel>
        <View style={styles.row}>
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <Pill key={d} label={dayLabel(d)} active={dayOffset === d} onPress={() => setDayOffset(d)} />
          ))}
        </View>

        <MicroLabel style={{ marginTop: 14 }}>FROM</MicroLabel>
        <View style={styles.row}>
          {STARTS.map((t) => (
            <Pill key={t} label={to12h(t)} active={startTime === t} onPress={() => setStartTime(t)} />
          ))}
        </View>

        <MicroLabel style={{ marginTop: 14 }}>WINDOW</MicroLabel>
        <View style={styles.row}>
          {DURATIONS.map((d) => (
            <Pill key={d} label={`${d} MIN`} active={duration === d} onPress={() => setDuration(d)} />
          ))}
        </View>

        <View style={{ height: 20 }} />
        <SplitCTA
          label={loading ? "CHECKING…" : "SEARCH COURTS"}
          onPress={() => search(false)}
          disabled={loading}
          intent="forward"
        />
        <Body size={11} color={C.grey} style={{ marginTop: 8 }}>
          {to12h(startTime)} – {to12h(endTime)} · {dayLabel(dayOffset)}
        </Body>

        {showLoader && (
          <View style={styles.loaderBlock}>
            <ActivityIndicator size="large" color={C.ink} />
            <Text style={styles.loaderText}>CHECKING {VENUE_COUNT} VENUES…</Text>
            <Body size={11} color={C.grey} style={{ marginTop: 6 }}>READING LIVE FROM HUDLE</Body>
          </View>
        )}

        {!loading && error && (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={18} color={C.coral} />
            <Body size={11} color={C.ink} style={{ marginTop: 6 }}>{error}</Body>
          </View>
        )}

        {snap && !error && options.length > 0 && (
          <>
            <View style={styles.resultHead}>
              <MicroLabel>
                {streaming ? `CHECKED ${resolved}/${snap.total ?? options.length}` : `${available.length} AVAILABLE`}
              </MicroLabel>
              <View style={styles.headRight}>
                {streaming && <ActivityIndicator size="small" color={C.ink} style={{ marginRight: 8 }} />}
                {tag && (
                  <View style={[styles.tag, { borderColor: tag.color }]}>
                    <Text style={[styles.tagTxt, { color: tag.color === C.lime ? C.ink : tag.color }]}>{tag.label}</Text>
                  </View>
                )}
              </View>
            </View>

            {!streaming && available.length === 0 && (
              <Body size={12} color={C.grey} style={{ marginTop: 10 }}>
                No courts open in this window. Try another time or day.
              </Body>
            )}

            {available.map((o) => {
              const slots = String(o.time || "").split(/,\s*/).filter(Boolean).slice(0, 8);
              return (
                <View key={o.venueId} style={styles.card}>
                  <View style={styles.cardBand} />
                  <View style={{ padding: 14 }}>
                    <View style={styles.cardTop}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={styles.venue}>{o.venueName?.toUpperCase()}</Text>
                        <Text style={styles.meta}>{(o.location || "GOA").toUpperCase()}</Text>
                      </View>
                      <View style={styles.priceBox}>
                        <Text style={styles.priceTxt}>₹{o.price ?? "—"}</Text>
                      </View>
                    </View>
                    {slots.length > 0 && (
                      <View style={styles.slotWrap}>
                        {slots.map((s: string, i: number) => (
                          <View key={i} style={styles.slot}><Text style={styles.slotTxt}>{s}</Text></View>
                        ))}
                      </View>
                    )}
                    {o.hudleUrl && (
                      <TouchableOpacity style={styles.bookBtn} activeOpacity={0.85}
                        onPress={() => Linking.openURL(o.hudleUrl!)}>
                        <Text style={styles.bookTxt}>BOOK ON HUDLE</Text>
                        <Ionicons name="open-outline" size={14} color={C.lime} style={{ marginLeft: 6 }} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}

            {/* While streaming, show the venues still being checked. */}
            {streaming && checking.map((o) => (
              <View key={o.venueId} style={[styles.card, styles.cardChecking]}>
                <View style={[styles.cardBand, { backgroundColor: "rgba(0,0,0,0.12)" }]} />
                <View style={[styles.cardTop, { padding: 14 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.venue, { color: C.grey }]}>{o.venueName?.toUpperCase()}</Text>
                    <Text style={styles.meta}>{(o.location || "GOA").toUpperCase()}</Text>
                  </View>
                  <ActivityIndicator size="small" color={C.grey} />
                </View>
              </View>
            ))}

            {!streaming && unavailable.length > 0 && (
              <>
                <MicroLabel style={{ marginTop: 18 }}>FULLY BOOKED</MicroLabel>
                <View style={styles.dimWrap}>
                  {unavailable.map((o) => (
                    <View key={o.venueId} style={styles.dimChip}>
                      <Text style={styles.dimTxt}>{o.venueName?.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {!streaming && (
              <TouchableOpacity onPress={() => search(true)} style={styles.refreshBtn} activeOpacity={0.8}>
                <Ionicons name="refresh" size={16} color={C.ink} />
                <Text style={styles.refreshTxt}>FORCE REFRESH</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {!loading && !snap && !error && (
          <View style={styles.empty}>
            <Ionicons name="tennisball-outline" size={28} color={C.grey} />
            <Body size={12} color={C.grey} style={{ marginTop: 8 }}>
              Pick a day and time, then search live availability across all {VENUE_COUNT} venues.
            </Body>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  header: {
    backgroundColor: C.ink, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
    borderBottomWidth: BORDER, borderBottomColor: C.lime,
  },
  limeRule: { height: BORDER, backgroundColor: C.lime, marginTop: 10, marginHorizontal: -16 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  loaderBlock: { alignItems: "center", paddingVertical: 36 },
  loaderText: { fontFamily: F.ub900, fontSize: 14, letterSpacing: 1.4, color: C.ink, marginTop: 10 },
  errorBox: { marginTop: 20, backgroundColor: C.white, borderWidth: BORDER, borderColor: C.coral, padding: 14 },
  resultHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 22 },
  headRight: { flexDirection: "row", alignItems: "center" },
  tag: { borderWidth: 1.5, paddingHorizontal: 8, paddingVertical: 3 },
  tagTxt: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.6 },
  card: { backgroundColor: C.white, borderWidth: BORDER, borderColor: C.ink, marginTop: 10 },
  cardChecking: { borderColor: "rgba(0,0,0,0.25)" },
  cardBand: { height: 6, backgroundColor: C.lime },
  cardTop: { flexDirection: "row", alignItems: "flex-start" },
  venue: { fontFamily: F.ub900, fontSize: 16, letterSpacing: -0.4, color: C.ink },
  meta: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.4, color: C.grey, marginTop: 3 },
  priceBox: { borderWidth: BORDER, borderColor: C.ink, backgroundColor: C.cream, paddingHorizontal: 8, paddingVertical: 4 },
  priceTxt: { fontFamily: F.ub900, fontSize: 16, color: C.ink, letterSpacing: -0.5 },
  slotWrap: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 12 },
  slot: { borderWidth: 1.5, borderColor: C.ink, paddingHorizontal: 7, paddingVertical: 4, backgroundColor: C.limeTint },
  slotTxt: { fontFamily: F.mono, fontSize: 10, letterSpacing: 0.6, color: C.ink },
  bookBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: C.ink, paddingVertical: 12, marginTop: 14,
  },
  bookTxt: { fontFamily: F.ub700, fontSize: 12, letterSpacing: 0.4, color: C.lime, textTransform: "uppercase" },
  dimWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  dimChip: { borderWidth: 1, borderColor: "rgba(0,0,0,0.25)", backgroundColor: "rgba(0,0,0,0.04)", paddingHorizontal: 10, paddingVertical: 6 },
  dimTxt: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.grey },
  refreshBtn: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginTop: 18, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1.5, borderColor: C.ink },
  refreshTxt: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.4, color: C.ink, marginLeft: 4 },
  empty: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 20 },
});
