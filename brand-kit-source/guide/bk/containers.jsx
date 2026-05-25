// ═══════════════════════════════════════════════════════════════════
//  CONTAINER COMPONENTS — Type A through F + NetDivider
//  Mirrors the canonical implementations distributed in the code package.
// ═══════════════════════════════════════════════════════════════════

// TYPE A — CLOSED PRIMARY (3px full border + optional 5px accent top)
const ContainerA = ({ children, accentColor, style = {} }) => (
  <div style={{
    border: `${T.s3} solid ${T.ink}`,
    background: T.white,
    overflow: "hidden",
    ...style,
  }}>
    {accentColor && <div style={{ height: T.accentTop, background: accentColor }} />}
    {children}
  </div>
);

// TYPE B — CORNER MARK (2px L-shapes at each corner)
const ContainerB = ({ children, color = T.ink, size = 16, weight = 2, style = {} }) => (
  <div style={{ position: "relative", ...style }}>
    {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h]) => (
      <div key={`${v}${h}`} style={{
        position: "absolute", [v]: 0, [h]: 0,
        width: size, height: size,
        [`border${v.charAt(0).toUpperCase()+v.slice(1)}`]: `${weight}px solid ${color}`,
        [`border${h.charAt(0).toUpperCase()+h.slice(1)}`]: `${weight}px solid ${color}`,
        pointerEvents: "none",
      }} />
    ))}
    {children}
  </div>
);

// TYPE C — LEFT ACCENT (2px full border + 4px left stripe)
const ContainerC = ({ children, accentColor = T.blue, style = {} }) => (
  <div style={{
    display: "flex",
    border: `${T.s2} solid ${T.ink}`,
    background: T.white,
    overflow: "hidden",
    ...style,
  }}>
    <div style={{ width: T.accentLeft, background: accentColor, flexShrink: 0 }} />
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

// TYPE D — TOP ACCENT (header band + 2px full border)
const ContainerD = ({ children, accentColor = T.blue, label, labelColor = T.white, style = {} }) => (
  <div style={{
    border: `${T.s2} solid ${T.ink}`,
    background: T.white,
    overflow: "hidden",
    ...style,
  }}>
    {label && (
      <div style={{
        background: accentColor,
        padding: `${T.sp2} ${T.sp4}`,
        borderBottom: `${T.s2} solid ${T.ink}`,
        ...ub, fontSize: 8, fontWeight: 700, letterSpacing: "0.12em",
        textTransform: "uppercase", color: labelColor,
      }}>{label}</div>
    )}
    {children}
  </div>
);

// TYPE E — OPEN-SIDED (3 sides drawn, one open)
const ContainerE = ({ children, openSide = "bottom", style = {} }) => {
  const borders = {
    borderTop:    openSide !== "top"    ? `${T.s2} solid ${T.ink}` : "none",
    borderRight:  openSide !== "right"  ? `${T.s2} solid ${T.ink}` : "none",
    borderBottom: openSide !== "bottom" ? `${T.s2} solid ${T.ink}` : "none",
    borderLeft:   openSide !== "left"   ? `${T.s2} solid ${T.ink}` : "none",
  };
  return <div style={{ background: T.white, ...borders, ...style }}>{children}</div>;
};

// TYPE F — DASHED (expected input / empty)
const ContainerF = ({ children, style = {} }) => (
  <div style={{
    border: `${T.s2} dashed ${T.border}`,
    background: T.white,
    ...style,
  }}>{children}</div>
);

// NET DIVIDER — the padel net as horizontal divider
const NetDivider = ({ color = T.ink, opacity = 0.15 }) => (
  <svg width="100%" height="8" preserveAspectRatio="none" viewBox="0 0 400 8">
    <line x1="0" y1="1" x2="400" y2="1" stroke={color} strokeWidth="1.5" strokeOpacity={opacity * 1.6}/>
    <line x1="0" y1="7" x2="400" y2="7" stroke={color} strokeWidth="1" strokeOpacity={opacity}/>
    {Array.from({length:67},(_,i)=>(
      <line key={i} x1={i*6} y1="1" x2={i*6} y2="7" stroke={color} strokeWidth="0.5" strokeOpacity={opacity * 0.55}/>
    ))}
  </svg>
);

Object.assign(window, { ContainerA, ContainerB, ContainerC, ContainerD, ContainerE, ContainerF, NetDivider });
