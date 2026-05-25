// ═══════════════════════════════════════════════════════════════════
//  PADELMATCH BRAND KIT — APP SHELL
//  Navigation + section switching + code-package download
// ═══════════════════════════════════════════════════════════════════

const sections = [
  { id: "overview",    label: "01 Overview",    short: "01" },
  { id: "colour",      label: "02 Colour",      short: "02" },
  { id: "typography",  label: "03 Typography",  short: "03" },
  { id: "strokes",     label: "04 Strokes",     short: "04" },
  { id: "containers",  label: "05 Containers",  short: "05" },
  { id: "textures",    label: "06 Textures",    short: "06" },
  { id: "components",  label: "07 Components",  short: "07" },
  { id: "tokens",      label: "08 Tokens",      short: "08" },
  { id: "logo",        label: "09 Logo",        short: "09" },
];

const sectionMap = {
  overview:   Section01,
  colour:     Section02,
  typography: Section03,
  strokes:    Section04,
  containers: Section05,
  textures:   Section06,
  components: Section07,
  tokens:     Section08,
  logo:       Section09,
};

function DownloadPackageButton() {
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const onClick = async () => {
    setBusy(true);
    try {
      if (!window.JSZip) throw new Error('JSZip not loaded');
      if (!window.__BRAND_KIT_FILES) throw new Error('Package files not loaded');
      const zip = new window.JSZip();
      const folder = zip.folder('padelmatch-brand-kit');
      for (const [name, content] of Object.entries(window.__BRAND_KIT_FILES)) {
        folder.file(name, content);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'padelmatch-brand-kit.zip'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 500);
      setDone(true);
      setTimeout(() => setDone(false), 2200);
    } catch (e) {
      console.error('Brand kit zip failed:', e);
      alert('Download failed: ' + e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button onClick={onClick} style={{
      background: done ? T.win : T.lime,
      color: done ? T.white : T.ink,
      border: `${T.s2} solid ${T.ink}`,
      padding: "8px 12px",
      cursor: busy ? "wait" : "pointer",
      ...ub, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
      whiteSpace: "nowrap",
    }}>
      {done ? "✓ DOWNLOADED" : busy ? "ZIPPING…" : "↓ DOWNLOAD .ZIP"}
    </button>
  );
}

function App() {
  const [active, setActive] = React.useState("overview");
  const SectionComponent = sectionMap[active] || Section01;

  React.useEffect(() => {
    // Scroll to top when switching sections
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [active]);

  return (
    <div style={{ background: T.cream, minHeight: "100vh", fontFamily: F.body, maxWidth: 760, margin: "0 auto", borderLeft: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}` }}>

      {/* ── Cover header ── */}
      <div style={{ background: T.ink, padding: "28px 20px 20px", borderBottom: `4px solid ${T.lime}`, ...TX.courtLines(0.05, T.lime), position: "relative" }}>
        <div style={{ ...mono, fontSize: 8, color: T.lime, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 10 }}>padelmatch.in</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
          <div style={{ flex: "1 1 auto" }}>
            <div style={{ ...ub, fontSize: 26, fontWeight: 900, color: T.white, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 4 }}>BRAND KIT</div>
            <div style={{ ...ub, fontSize: 14, fontWeight: 400, color: T.purple, letterSpacing: "-0.01em", marginBottom: 8 }}>Sport Brutalism — Version 1.0</div>
            <div style={{ ...sans, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>For Claude Code · Emergent · Human developers</div>
          </div>
          <DownloadPackageButton />
        </div>
      </div>

      {/* ── Navigation ── */}
      <div style={{ background: T.ink, display: "flex", flexWrap: "wrap", borderBottom: `${T.s2} solid ${T.ink}`, position: "sticky", top: 0, zIndex: 10 }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActive(s.id)} style={{
            background: active === s.id ? T.lime : "transparent",
            border: "none", borderRight: `1px solid rgba(255,255,255,0.06)`,
            padding: "9px 10px", cursor: "pointer",
            ...mono, fontSize: 8, fontWeight: 700, letterSpacing: "0.08em",
            color: active === s.id ? T.ink : "rgba(255,255,255,0.45)",
            textTransform: "uppercase",
          }}>{s.short}</button>
        ))}
        <div style={{ flex: 1, padding: "9px 10px", ...mono, fontSize: 8, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center" }}>
          {sections.find(s => s.id === active)?.label}
        </div>
      </div>

      <div style={{ padding: "4px 16px 80px" }}>
        <SectionComponent />
      </div>

      {/* ── Footer ── */}
      <div style={{ background: T.ink, padding: "20px 16px", borderTop: `4px solid ${T.lime}` }}>
        <div style={{ ...mono, fontSize: 8, color: T.grey, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>PADELMATCH BRAND KIT V1.0</div>
        <div style={{ ...sans, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Generated for Claude Code &amp; emergent.sh. Logo geometry source: <code style={{ ...mono, color: T.lime }}>brand-engine-v2.js</code>. Container / texture grammar derived from physical padel courts.</div>
      </div>
    </div>
  );
}

// Mount
const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<App />);
