// ═══════════════════════════════════════════════════════════════════
//  PADELMATCH BRAND KIT — CONTAINER COMPONENTS
//
//  Six types (A-F) + NetDivider. Each maps to a semantic context.
//  See README.md / Brand Kit HTML reference for decision rules.
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import { T } from './tokens';

// ── TYPE A — Closed Primary ───────────────────────────────────────
//  Use for: Game Card, Player Card, Shot Card, Venue Card
export function ContainerA({ children, accentColor, style = {}, ...rest }) {
  return (
    <div style={{
      border: `${T.s3} solid ${T.ink}`,
      background: T.white,
      overflow: 'hidden',
      ...style,
    }} {...rest}>
      {accentColor && <div style={{ height: T.accentTop, background: accentColor }} />}
      {children}
    </div>
  );
}

// ── TYPE B — Corner Mark ──────────────────────────────────────────
//  Use for: Stat Block, Rating Display, Radar Chart, Sparkline
export function ContainerB({ children, color = T.ink, size = 16, weight = 2, style = {}, ...rest }) {
  const corners = [['top','left'],['top','right'],['bottom','left'],['bottom','right']];
  return (
    <div style={{ position: 'relative', ...style }} {...rest}>
      {corners.map(([v, h]) => (
        <div key={`${v}${h}`} style={{
          position: 'absolute',
          [v]: 0, [h]: 0,
          width: size, height: size,
          [`border${v[0].toUpperCase()}${v.slice(1)}`]: `${weight}px solid ${color}`,
          [`border${h[0].toUpperCase()}${h.slice(1)}`]: `${weight}px solid ${color}`,
          pointerEvents: 'none',
        }} />
      ))}
      {children}
    </div>
  );
}

// ── TYPE C — Left Accent ──────────────────────────────────────────
//  Use for: Notification, Match Banner, Connection State
//  accentColor = semantic state: lime/blue/purple/error
export function ContainerC({ children, accentColor = T.blue, style = {}, ...rest }) {
  return (
    <div style={{
      display: 'flex',
      border: `${T.s2} solid ${T.ink}`,
      background: T.white,
      overflow: 'hidden',
      ...style,
    }} {...rest}>
      <div style={{ width: T.accentLeft, background: accentColor, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

// ── TYPE D — Top Accent / Header Band ────────────────────────────
//  Use for: Section Header, Profile Header, Modal Header
export function ContainerD({
  children, accentColor = T.blue, label, labelColor = T.white,
  style = {}, ...rest
}) {
  return (
    <div style={{
      border: `${T.s2} solid ${T.ink}`,
      background: T.white,
      overflow: 'hidden',
      ...style,
    }} {...rest}>
      {label && (
        <div style={{
          background: accentColor,
          padding: `${T.sp2} ${T.sp4}`,
          borderBottom: `${T.s2} solid ${T.ink}`,
          fontFamily: "'Unbounded', sans-serif",
          fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: labelColor,
        }}>{label}</div>
      )}
      {children}
    </div>
  );
}

// ── TYPE E — Open-Sided ──────────────────────────────────────────
//  Use for: Pending Match, Score Pending, Awaiting Confirmation
export function ContainerE({ children, openSide = 'bottom', style = {}, ...rest }) {
  const borders = {
    borderTop:    openSide !== 'top'    ? `${T.s2} solid ${T.ink}` : 'none',
    borderRight:  openSide !== 'right'  ? `${T.s2} solid ${T.ink}` : 'none',
    borderBottom: openSide !== 'bottom' ? `${T.s2} solid ${T.ink}` : 'none',
    borderLeft:   openSide !== 'left'   ? `${T.s2} solid ${T.ink}` : 'none',
  };
  return <div style={{ background: T.white, ...borders, ...style }} {...rest}>{children}</div>;
}

// ── TYPE F — Dashed Input ─────────────────────────────────────────
//  Use for: Empty Player Slot, Add Connection, File Upload Zone
export function ContainerF({ children, style = {}, ...rest }) {
  return (
    <div style={{
      border: `${T.s2} dashed ${T.border}`,
      background: T.white,
      transition: 'border-color 150ms ease',
      ...style,
    }} {...rest}>{children}</div>
  );
}

// ── NetDivider — the padel net as horizontal divider ─────────────
//  Use for: section dividers, replaces <hr>
export function NetDivider({ color = T.ink, opacity = 0.15, style = {} }) {
  return (
    <svg width="100%" height="8" preserveAspectRatio="none" viewBox="0 0 400 8" style={{ display: 'block', ...style }}>
      <line x1="0" y1="1" x2="400" y2="1" stroke={color} strokeWidth="1.5" strokeOpacity={opacity * 1.6} />
      <line x1="0" y1="7" x2="400" y2="7" stroke={color} strokeWidth="1"   strokeOpacity={opacity} />
      {Array.from({ length: 67 }, (_, i) => (
        <line key={i} x1={i * 6} y1="1" x2={i * 6} y2="7"
              stroke={color} strokeWidth="0.5" strokeOpacity={opacity * 0.55} />
      ))}
    </svg>
  );
}
