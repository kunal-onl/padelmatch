// ═══════════════════════════════════════════════════════════════════
//  SECTION HELPERS — labels, rules, code blocks
// ═══════════════════════════════════════════════════════════════════

const SectionLabel = ({ num, title, color = T.lime }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 0,
    border: `${T.s2} solid ${T.ink}`, marginBottom: 16, marginTop: 28,
    background: T.ink,
  }}>
    <div style={{
      background: color, width: 40, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "10px 0",
      ...ub, fontSize: 11, fontWeight: 900, color: T.ink,
    }}>{num}</div>
    <div style={{ padding: "10px 14px",
      ...ub, fontSize: 11, fontWeight: 700, color: T.white, letterSpacing: "-0.02em",
    }}>{title}</div>
  </div>
);

const CodeBlock = ({ code, label = "CSS / TOKENS" }) => {
  const ref = React.useRef(null);
  const [copied, setCopied] = React.useState(false);
  return (
    <div style={{ background: "#1a1a22", border: `${T.s2} solid ${T.ink}`, marginBottom: 16, overflow: "auto" }}>
      <div style={{ background: T.lime, padding: "5px 12px", borderBottom: `1px solid ${T.ink}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ ...mono, fontSize: 8, fontWeight: 700, color: T.ink, letterSpacing: "0.1em" }}>{label}</span>
        <button onClick={async () => {
          try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch(_){}
        }} style={{ background: "transparent", border: `1px solid ${T.ink}`, padding: "2px 8px", cursor: "pointer", ...mono, fontSize: 8, fontWeight: 700, color: T.ink, letterSpacing: "0.08em" }}>
          {copied ? "COPIED ✓" : "COPY"}
        </button>
      </div>
      <pre ref={ref} style={{ ...mono, fontSize: 10, color: "#C9E52F", padding: "14px 16px", lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {code}
      </pre>
    </div>
  );
};

Object.assign(window, { SectionLabel, CodeBlock });
