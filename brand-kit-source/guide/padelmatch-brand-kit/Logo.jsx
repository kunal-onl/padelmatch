// ═══════════════════════════════════════════════════════════════════
//  PADELMATCH BRAND KIT — LOGO COMPONENTS
//
//  <Logo size={48} cellFills={{ TL: '#1A56FF', BR: '#C9E52F' }} />
//  <Lockup size={200} showTagline />
//  <Lockup size={200} onInk />
//
//  For pixel-perfect mark/wordmark alignment with calibrated font
//  metrics, see /lib/renderLockup.js — this file is the simple, fast,
//  declarative version that covers 95% of use cases.
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import { LOGO_GEOMETRY as G } from './logo-geometry';
import { T, F } from './tokens';

const DEFAULT_FILLS = { TL: T.blue, BR: T.lime };

export function Logo({
  size = 64,                     // height in px (mark is 2.5:1 so width = size * 2.5)
  cellFills = DEFAULT_FILLS,
  onInk = false,
  letter = null,                 // 'P' or 'M' for monogram overlay
  className,
  style = {},
}) {
  const stroke = onInk ? T.white : T.ink;
  const letterRects = letter ? G.letterRects[letter] : null;
  const letterColor = letter === 'P' ? T.lime : T.blue;

  return (
    <svg
      width={size * G.aspectRatio}
      height={size}
      viewBox={G.viewBox}
      className={className}
      style={{ display: 'inline-block', ...style }}
    >
      {/* Cell fills */}
      {!letter && Object.entries(cellFills).map(([cell, color]) => {
        const c = G.cells[cell];
        if (!c || !color) return null;
        return <rect key={cell} x={c.x} y={c.y} width={c.w} height={c.h} fill={color} />;
      })}

      {/* Court frame (cages + outer walls) */}
      <path d={G.courtPath} fill={stroke} fillRule="evenodd" />

      {/* Net — always solid stroke colour */}
      <rect x={G.net.x} y={G.net.y} width={G.net.w} height={G.net.h} fill={stroke} />

      {/* Optional letter monogram overlay */}
      {letterRects && letterRects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={letterColor} />
      ))}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  Lockup — mark + wordmark (+ optional tagline) horizontally
//
//  Mark height : wordmark cap-height : tagline cap-height alignment is
//  calibrated by font metrics. For Unbounded 900 + DM Mono these
//  approximations give visually-flush horizontal lockups. For exact
//  metric calibration, see /lib/lockup-metrics.js
// ═══════════════════════════════════════════════════════════════════

const CAP_RATIO_WM  = 0.73;  // Unbounded 900 cap-height / em
const CAP_RATIO_TAG = 0.70;  // DM Mono cap-height / em
const TAG_FONT_RATIO = 0.30; // tagline size / wordmark size
const TAG_GAP_RATIO  = 0.18; // gap between wm baseline and tag cap-top, fraction of wm size
const VIS_COURT_RATIO = 32 / 36; // visible court height / svg box height

export function Lockup({
  size = 200,                   // mark width in px
  showTagline = false,
  tagline = 'Find the perfect match.',
  onInk = false,
  cellFills = DEFAULT_FILLS,
  className,
  style = {},
}) {
  const markBoxH = size / G.aspectRatio;
  const visMarkH = markBoxH * VIS_COURT_RATIO;
  const visMarkTopOffset = markBoxH * (2 / 36);

  let wmSize;
  if (showTagline) {
    wmSize = visMarkH / (CAP_RATIO_WM + TAG_GAP_RATIO + TAG_FONT_RATIO * CAP_RATIO_TAG);
  } else {
    wmSize = visMarkH / CAP_RATIO_WM;
  }
  const tagSize = wmSize * TAG_FONT_RATIO;
  const tagGap  = wmSize * TAG_GAP_RATIO;
  const gap     = markBoxH * 0.20;

  const inkBase = onInk ? T.white : T.ink;
  const tagColor = onInk ? 'rgba(255,255,255,0.55)' : 'rgba(17,17,24,0.55)';

  return (
    <div className={className} style={{ display: 'inline-flex', alignItems: 'flex-start', gap, ...style }}>
      <div style={{ marginTop: -visMarkTopOffset }}>
        <Logo size={markBoxH} cellFills={cellFills} onInk={onInk} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: tagGap }}>
        <span style={{
          fontFamily: F.display,
          fontWeight: 900,
          fontSize: wmSize,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: inkBase,
        }}>
          PADEL <span style={{ color: T.lime }}>MATCH</span>
        </span>
        {showTagline && (
          <span style={{
            fontFamily: F.mono,
            fontWeight: 400,
            fontSize: tagSize,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            lineHeight: 1,
            color: tagColor,
          }}>{tagline.toUpperCase()}</span>
        )}
      </div>
    </div>
  );
}

// Mark-only convenience export
export function Mark(props) {
  return <Logo {...props} />;
}
