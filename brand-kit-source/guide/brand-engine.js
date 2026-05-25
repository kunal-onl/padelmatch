// ═══════════════════════════════════════════════════════════════════
//  PADELMATCH · BRAND ENGINE
//  Logo geometry, color tokens, SVG builders, downloads, animation.
//  Shared by Brand Book + any other asset pages.
// ═══════════════════════════════════════════════════════════════════

window.PM = window.PM || {};

// ── Color tokens (Sport Brutalism design system v1.0) ──────────────
PM.C = {
  lime:   '#C9E52F',  // Primary — CTA, active, rating #1
  blue:   '#1A56FF',  // Secondary — rank, headers, info
  purple: '#6E28D9',  // Tertiary — profile, social
  ink:    '#111118',  // Anchor — type, borders
  cream:  '#F5F2E8',  // Background — warm surface
  white:  '#FFFFFF',  // Card surface
  error:  '#FF4136',  // Error / unavailable
  win:    '#1A6B3A',  // Win state
  loss:   '#B52A1C',  // Loss state
  grey:   '#888888',  // Secondary text
  border: '#DDDAD0',  // Subtle borders
};

PM.PALETTE = [
  { name: 'LIME',   hex: PM.C.lime,   role: 'PRIMARY · CTA · #1 RANK',     light: false },
  { name: 'BLUE',   hex: PM.C.blue,   role: 'SECONDARY · RANK · HEADERS',   light: true  },
  { name: 'PURPLE', hex: PM.C.purple, role: 'TERTIARY · PROFILE · SOCIAL',  light: true  },
  { name: 'INK',    hex: PM.C.ink,    role: 'NEUTRAL · TYPE · BORDERS',     light: true  },
  { name: 'CREAM',  hex: PM.C.cream,  role: 'BACKGROUND · WARM SURFACE',    light: false },
  { name: 'WHITE',  hex: PM.C.white,  role: 'CARD · INTERIOR SURFACE',      light: false },
  { name: 'ERROR',  hex: PM.C.error,  role: 'ERROR ONLY · NEVER DECORATIVE', light: true },
];

PM.FONTS = {
  display: "'Unbounded', 'Arial Black', sans-serif",
  body:    "'DM Sans', sans-serif",
  mono:    "'DM Mono', monospace",
};

// ── Logo geometry (mirrors Logo Lab v5) ────────────────────────────
PM.CELLS = {
  L:  { x: 12.371, y: 36.597, w:  9.555, h: 26.797 },
  TL: { x: 26.094, y: 36.601, w: 21.930, h: 11.316 },
  TR: { x: 52.192, y: 36.601, w: 21.930, h: 11.316 },
  BL: { x: 26.094, y: 52.081, w: 21.930, h: 11.309 },
  BR: { x: 52.192, y: 52.081, w: 21.930, h: 11.309 },
  R:  { x: 78.290, y: 36.593, w:  9.555, h: 26.797 },
};
PM.CELL_BLEED = 0.35;

PM.LETTER_TOP = 28.240;
PM.LETTER_BOTTOM = 71.764;
PM.LETTER_H = PM.LETTER_BOTTOM - PM.LETTER_TOP;
PM.LETTER_BLEED = 0.4;

PM.P_RECTS = [
  { x: 12.371, y: PM.LETTER_TOP, w: 13.723, h: PM.LETTER_H },
  { x: 21.926, y: PM.LETTER_TOP, w: 30.266, h: 36.601 - PM.LETTER_TOP },
  { x: 48.024, y: PM.LETTER_TOP, w:  4.168, h: 52.081 - PM.LETTER_TOP },
  { x: 21.926, y: 47.917,        w: 30.266, h: 52.081 - 47.917 },
];
PM.M_RECTS = [
  { x: 12.371, y: PM.LETTER_TOP, w: 13.723, h: PM.LETTER_H },
  { x: 74.122, y: PM.LETTER_TOP, w: 13.723, h: PM.LETTER_H },
  { x: 12.371, y: PM.LETTER_TOP, w: 75.474, h: 36.601 - PM.LETTER_TOP },
  { x: 48.024, y: PM.LETTER_TOP, w:  4.168, h: 47.917 - PM.LETTER_TOP },
];

PM.COURT_PATH = "m89.922 26.156h-79.633c-1.1523 0-2.082 0.93359-2.082 2.082v6.2617 0.011719 0.011719 30.945 0.011719 0.011719 6.2734c0 1.1484 0.92969 2.082 2.082 2.082h79.637c1.1523 0 2.082-0.93359 2.082-2.082v-43.527c0-1.1484-0.92969-2.082-2.082-2.082zm-77.551 37.238v-26.797h9.5547v26.797zm13.723-26.793h21.93v11.316h-21.93zm26.098 0h21.93v11.316h-21.93zm-26.098 15.48h21.93v11.309h-21.93zm26.098 11.309v-11.309h21.93v11.309zm26.098-26.797h9.5547v26.797h-9.5547zm9.5547-4.168h-35.652v-2.1055h35.652zm-39.82-2.1055v2.1055l-35.652 0.003907v-2.1055h35.648zm-35.652 37.238h11.613s0.015625 0.003906 0.023437 0.003906h24.012v2.1133h-35.648zm39.816 2.1172v-2.1133h24.016s0.015625-0.003906 0.023437-0.003906h11.613v2.1172z";

// ═══════════════════════════════════════════════════════════════════
//  STATIC LOGO SVG BUILDER
// ═══════════════════════════════════════════════════════════════════
PM.buildLogoSVG = function({
  cellFills = {},
  showLetter = null,
  onInk = false,
  bgColor = null,
  width = 360,
  includeXMLDecl = false,
  square = false,         // if true, pad to square viewbox for icons
  padding = 0,            // additional padding around viewbox (in viewbox units)
} = {}) {
  const C = PM.C;
  const outlineColor = onInk ? C.white : C.ink;
  let vbX = 5, vbY = 23, vbW = 90, vbH = 56;
  if (padding > 0) {
    vbX -= padding; vbY -= padding; vbW += padding * 2; vbH += padding * 2;
  }
  if (square) {
    const size = Math.max(vbW, vbH);
    vbX -= (size - vbW) / 2;
    vbY -= (size - vbH) / 2;
    vbW = vbH = size;
  }
  const aspect = vbH / vbW;
  const height = Math.round(width * aspect);

  let svg = '';
  if (includeXMLDecl) svg += '<?xml version="1.0" encoding="UTF-8"?>\n';
  svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" width="${width}" height="${height}" role="img" aria-label="PadelMatch logo">`;

  if (bgColor) {
    svg += `<rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="${bgColor}"/>`;
  }

  // Cell fills (skip transparent)
  for (const [name, c] of Object.entries(PM.CELLS)) {
    const fill = cellFills[name];
    if (!fill) continue;
    const b = PM.CELL_BLEED;
    svg += `<rect x="${(c.x - b).toFixed(3)}" y="${(c.y - b).toFixed(3)}" width="${(c.w + b*2).toFixed(3)}" height="${(c.h + b*2).toFixed(3)}" fill="${fill}"/>`;
  }

  // Court outline
  svg += `<path d="${PM.COURT_PATH}" fill="${outlineColor}" fill-rule="evenodd"/>`;

  // Letter shape
  const b = PM.LETTER_BLEED;
  if (showLetter === 'P') {
    for (const r of PM.P_RECTS) {
      svg += `<rect x="${(r.x - b).toFixed(3)}" y="${(r.y - b).toFixed(3)}" width="${(r.w + b*2).toFixed(3)}" height="${(r.h + b*2).toFixed(3)}" fill="${C.lime}"/>`;
    }
  } else if (showLetter === 'M') {
    for (const r of PM.M_RECTS) {
      svg += `<rect x="${(r.x - b).toFixed(3)}" y="${(r.y - b).toFixed(3)}" width="${(r.w + b*2).toFixed(3)}" height="${(r.h + b*2).toFixed(3)}" fill="${C.blue}"/>`;
    }
  }

  svg += '</svg>';
  return svg;
};

// ═══════════════════════════════════════════════════════════════════
//  ANIMATED LOGO SVG (SMIL — no JS required at runtime)
// ═══════════════════════════════════════════════════════════════════
PM.PULSE_FRAMES = [
  { name: 'DIAGONAL', cells: { TL: PM.C.lime, BR: PM.C.blue }, letter: null, ms: 600 },
  { name: 'SWAP',     cells: { TR: PM.C.lime, BL: PM.C.blue }, letter: null, ms: 480 },
  { name: 'BUILD',    cells: { L: PM.C.lime, TL: PM.C.lime, BR: PM.C.blue, R: PM.C.blue }, letter: null, ms: 400 },
  { name: 'P',        cells: {}, letter: 'P', ms: 900 },
  { name: 'TRANS',    cells: { L: PM.C.lime, R: PM.C.blue }, letter: null, ms: 320 },
  { name: 'M',        cells: {}, letter: 'M', ms: 900 },
  { name: 'PULSE',    cells: { TL: PM.C.lime, TR: PM.C.blue, BL: PM.C.blue, BR: PM.C.lime }, letter: null, ms: 280 },
  { name: 'RESET',    cells: { TL: PM.C.lime, BR: PM.C.blue }, letter: null, ms: 700 },
];

PM.buildAnimatedSVG = function({ onInk = false, bgColor = null, width = 360, includeXMLDecl = false } = {}) {
  const C = PM.C;
  const outlineColor = onInk ? C.white : C.ink;
  const totalMs = PM.PULSE_FRAMES.reduce((s, f) => s + f.ms, 0);
  const durSec = (totalMs / 1000).toFixed(3) + 's';

  let cum = 0;
  const keyTimes = [0];
  for (const f of PM.PULSE_FRAMES) {
    cum += f.ms;
    keyTimes.push(+(cum / totalMs).toFixed(4));
  }
  const keyTimesAttr = keyTimes.join(';');

  function valuesForCell(name) {
    const arr = PM.PULSE_FRAMES.map(f => f.cells[name] || 'transparent');
    arr.push(arr[0]);
    return arr.join(';');
  }
  function valuesForLetterOpacity(letter) {
    const arr = PM.PULSE_FRAMES.map(f => f.letter === letter ? '1' : '0');
    arr.push(arr[0]);
    return arr.join(';');
  }

  let svg = '';
  if (includeXMLDecl) svg += '<?xml version="1.0" encoding="UTF-8"?>\n';
  svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="5 23 90 56" width="${width}" height="${Math.round(width * 56/90)}" role="img" aria-label="PadelMatch animated mark">`;

  if (bgColor) {
    svg += `<rect x="5" y="23" width="90" height="56" fill="${bgColor}"/>`;
  }

  // Animated cell fills
  for (const [name, c] of Object.entries(PM.CELLS)) {
    const b = PM.CELL_BLEED;
    svg += `<rect x="${(c.x - b).toFixed(3)}" y="${(c.y - b).toFixed(3)}" width="${(c.w + b*2).toFixed(3)}" height="${(c.h + b*2).toFixed(3)}" fill="transparent">`;
    svg += `<animate attributeName="fill" calcMode="discrete" values="${valuesForCell(name)}" keyTimes="${keyTimesAttr}" dur="${durSec}" repeatCount="indefinite"/>`;
    svg += `</rect>`;
  }

  // Court outline
  svg += `<path d="${PM.COURT_PATH}" fill="${outlineColor}" fill-rule="evenodd"/>`;

  // Letter groups
  const b = PM.LETTER_BLEED;
  svg += `<g opacity="0"><animate attributeName="opacity" calcMode="discrete" values="${valuesForLetterOpacity('P')}" keyTimes="${keyTimesAttr}" dur="${durSec}" repeatCount="indefinite"/>`;
  for (const r of PM.P_RECTS) {
    svg += `<rect x="${(r.x - b).toFixed(3)}" y="${(r.y - b).toFixed(3)}" width="${(r.w + b*2).toFixed(3)}" height="${(r.h + b*2).toFixed(3)}" fill="${C.lime}"/>`;
  }
  svg += `</g>`;

  svg += `<g opacity="0"><animate attributeName="opacity" calcMode="discrete" values="${valuesForLetterOpacity('M')}" keyTimes="${keyTimesAttr}" dur="${durSec}" repeatCount="indefinite"/>`;
  for (const r of PM.M_RECTS) {
    svg += `<rect x="${(r.x - b).toFixed(3)}" y="${(r.y - b).toFixed(3)}" width="${(r.w + b*2).toFixed(3)}" height="${(r.h + b*2).toFixed(3)}" fill="${C.blue}"/>`;
  }
  svg += `</g>`;

  svg += '</svg>';
  return svg;
};

// ═══════════════════════════════════════════════════════════════════
//  DOWNLOAD HELPERS
// ═══════════════════════════════════════════════════════════════════
PM.downloadBlob = function(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
};

PM.downloadSVG = function(filename, svgString) {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  PM.downloadBlob(blob, filename);
};

PM.svgToPNGBlob = async function(svgString, pxWidth, pxHeight = null) {
  // Auto-derive height from SVG viewBox if not provided
  if (!pxHeight) {
    const vbMatch = svgString.match(/viewBox="([\d.\-\s]+)"/);
    if (vbMatch) {
      const [, , vbW, vbH] = vbMatch[1].split(/\s+/).map(parseFloat);
      pxHeight = Math.round(pxWidth * vbH / vbW);
    } else {
      pxHeight = pxWidth;
    }
  }
  const cleanSVG = svgString.replace(/width="[\d.]+"\s+height="[\d.]+"/, `width="${pxWidth}" height="${pxHeight}"`);
  const blob = new Blob([cleanSVG], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = url;
  });
  const canvas = document.createElement('canvas');
  canvas.width = pxWidth;
  canvas.height = pxHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, pxWidth, pxHeight);
  URL.revokeObjectURL(url);
  return await new Promise(res => canvas.toBlob(res, 'image/png'));
};

PM.downloadPNG = async function(filename, svgString, pxWidth, pxHeight = null) {
  const blob = await PM.svgToPNGBlob(svgString, pxWidth, pxHeight);
  PM.downloadBlob(blob, filename);
};

// Render an HTML element (with inline SVG, CSS, fonts) to PNG via foreignObject.
// Used for wordmark/lockup PNG export since wordmarks are HTML-rendered.
PM.htmlToPNGBlob = async function(htmlString, width, height, bgColor = null) {
  // Wrap into a self-contained SVG with foreignObject
  const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');`;
  const wrapped = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs><style type="text/css">${fontImport}</style></defs>
    ${bgColor ? `<rect width="${width}" height="${height}" fill="${bgColor}"/>` : ''}
    <foreignObject width="100%" height="100%">
      <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;display:flex;align-items:center;justify-content:center;font-family:'Unbounded','Arial Black',sans-serif;">${htmlString}</div>
    </foreignObject>
  </svg>`;
  // Pre-warm fonts before raster
  await document.fonts.ready;
  const blob = new Blob([wrapped], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = url;
  });
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  return await new Promise(res => canvas.toBlob(res, 'image/png'));
};

// ═══════════════════════════════════════════════════════════════════
//  CLIPBOARD + TOAST UI
// ═══════════════════════════════════════════════════════════════════
PM.copyText = function(text) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text);
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  return Promise.resolve();
};

let _toastTimer = null;
PM.toast = function(msg) {
  let el = document.getElementById('pm-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'pm-toast';
    el.className = 'pm-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
};

PM.flashBtn = function(btn, label) {
  const orig = btn.textContent;
  btn.textContent = '✓ ' + label;
  btn.classList.add('flash');
  setTimeout(() => { btn.textContent = orig; btn.classList.remove('flash'); }, 1200);
  PM.toast(label);
};
