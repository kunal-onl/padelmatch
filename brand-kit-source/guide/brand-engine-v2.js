// ═══════════════════════════════════════════════════════════════════
//  PADELMATCH · BRAND ENGINE  (v2 — FINAL LOGO)
//  Source-of-truth geometry derived from the FINAL hand-designed
//  logo SVG. Key changes vs v1:
//    • Black center NET bar (always drawn)
//    • Default cell colors flipped:  TL = BLUE,  BR = LIME
//    • Rebuilt court path with cleaner rounded corners (radius 4)
//    • New viewBox "5 30 90 36"  (aspect 2.5 : 1)
// ═══════════════════════════════════════════════════════════════════

window.PM = window.PM || {};

// ── Color tokens ───────────────────────────────────────────────────
PM.C = {
  lime:   '#C9E52F',
  blue:   '#1A56FF',
  purple: '#6E28D9',
  ink:    '#111118',
  cream:  '#F5F2E8',
  white:  '#FFFFFF',
  error:  '#FF4136',
  win:    '#1A6B3A',
  loss:   '#B52A1C',
  grey:   '#888888',
  border: '#DDDAD0',
};

PM.PALETTE = [
  { name: 'LIME',   hex: PM.C.lime,   role: 'PRIMARY · CTA · #1 RANK',         light: false },
  { name: 'BLUE',   hex: PM.C.blue,   role: 'SECONDARY · RANK · HEADERS',      light: true  },
  { name: 'PURPLE', hex: PM.C.purple, role: 'TERTIARY · PROFILE · SOCIAL',     light: true  },
  { name: 'INK',    hex: PM.C.ink,    role: 'NEUTRAL · TYPE · COURT · NET',    light: true  },
  { name: 'CREAM',  hex: PM.C.cream,  role: 'BACKGROUND · WARM SURFACE',       light: false },
  { name: 'WHITE',  hex: PM.C.white,  role: 'CARD · INTERIOR SURFACE',         light: false },
  { name: 'ERROR',  hex: PM.C.error,  role: 'ERROR ONLY · NEVER DECORATIVE',   light: true  },
];

PM.FONTS = {
  display: "'Unbounded', 'Arial Black', sans-serif",
  body:    "'DM Sans', sans-serif",
  mono:    "'DM Mono', monospace",
};

// ── Logo geometry (v2 — final) ─────────────────────────────────────
PM.VIEWBOX = { x: 5, y: 30, w: 90, h: 36 };
PM.ASPECT  = PM.VIEWBOX.h / PM.VIEWBOX.w; // 0.4

PM.CELLS = {
  L:  { x: 10, y: 35,    w: 10, h: 26    },
  TL: { x: 23, y: 35,    w: 23, h: 11.77 },
  TR: { x: 55, y: 35,    w: 23, h: 11.77 },
  BL: { x: 23, y: 49.23, w: 23, h: 11.77 },
  BR: { x: 55, y: 49.23, w: 23, h: 11.77 },
  R:  { x: 81, y: 35,    w: 10, h: 26    },
};
PM.CELL_BLEED = 0.30;

// Net (always rendered in ink/white)
PM.NET = { x: 47.5, y: 35, w: 5, h: 26 };
PM.NET_BLEED = 0.0;

// Default cell coloring (THE final identity)
PM.DEFAULT_CELLS = { TL: PM.C.blue, BR: PM.C.lime };

// Court outline path — copied verbatim from final logo SVG, even-odd fill
PM.COURT_PATH = "m 11,32 c 0,0 -4,0 -4,4 v 24 c 0,0 -0.2235262,3.967962 3.776472,3.971315 L 45,64 c 3.999999,0.0034 4,-4 4,-4 V 36 c 0,-4 -4,-4 -4,-4 z m 45,0 c -4,0 -4,4 -4,4 v 24 c 0,4 4,4 4,4 h 34 c 0,0 4,0 4,-4 V 36 c 0,0 0,-4 -4,-4 z m 22,2.957031 V 46.765625 H 55 V 35 Z M 10,35 H 20 V 61 H 10 Z m 13,0 h 23 l -0.0047,11.771437 H 23.0621 Z m 58,0 H 91 V 61 H 81 Z M 23,49.234375 H 46 V 61 l -23,0.04297 z m 32.00473,-0.0058 H 77.9379 L 78,61 H 55 Z";

// Letter monograms — adapted to new viewBox
// Letter rects sit exactly on existing court walls (no bleed).
PM.LETTER_BLEED  = 0;

// P: thin overlays that highlight existing court walls — spine + bowl
// Strategy: every rect sits exactly on an existing structural wall of the court.
// The letter is highlighted FROM the court, not painted on top of it.
PM.P_RECTS = [
  { x: 20, y: 32,   w: 3,  h: 32 },   // spine — inner wall between L and TL/BL (full height)
  { x: 20, y: 32,   w: 26, h: 3  },   // top bowl — top wall of left frame
  { x: 20, y: 46.5, w: 26, h: 3  },   // bottom of bowl — middle gap (slight oversize for visual weight = other strokes)
  { x: 46, y: 35,   w: 3,  h: 14 },   // right of bowl — right wall of left frame, from top to middle
];
// M: net-as-stem — outer pillars + top connector + top half of net colored blue
// (bottom half of net stays black, forming a central V-drop from top connector to mid-height)
PM.M_RECTS = [
  { x: 7,    y: 32, w: 3,  h: 32 },   // left leg — outer-left wall (full height) → x=7-10
  { x: 91,   y: 32, w: 3,  h: 32 },   // right leg — outer-right wall (full height) → x=91-94
  { x: 7,    y: 32, w: 87, h: 3  },   // top connector — bridges both top walls (x=7-94)
  { x: 46,   y: 35, w: 9,  h: 13 },   // top half of central column (covers net + both inner walls so visual width matches black bottom of net region)
];

// ═══════════════════════════════════════════════════════════════════
//  STATIC LOGO SVG BUILDER
// ═══════════════════════════════════════════════════════════════════
PM.buildLogoSVG = function({
  cellFills = null,        // null → use DEFAULT_CELLS; pass {} for none
  showLetter = null,
  onInk = false,
  bgColor = null,
  width = 360,
  includeXMLDecl = false,
  square = false,
  padding = 0,
  showNet = true,
  netColor = null,         // override net color; default = outline color
} = {}) {
  const C = PM.C;
  const outlineColor = onInk ? C.white : C.ink;
  const fills = cellFills == null ? PM.DEFAULT_CELLS : cellFills;
  let vbX = PM.VIEWBOX.x, vbY = PM.VIEWBOX.y, vbW = PM.VIEWBOX.w, vbH = PM.VIEWBOX.h;
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

  // Cell fills (drawn first so court path frames them)
  if (!showLetter) {
    for (const [name, c] of Object.entries(PM.CELLS)) {
      const fill = fills[name];
      if (!fill) continue;
      const b = PM.CELL_BLEED;
      svg += `<rect x="${(c.x - b).toFixed(3)}" y="${(c.y - b).toFixed(3)}" width="${(c.w + b*2).toFixed(3)}" height="${(c.h + b*2).toFixed(3)}" fill="${fill}"/>`;
    }
  }

  // Court outline (even-odd) — frames the cells
  svg += `<path d="${PM.COURT_PATH}" fill="${outlineColor}" fill-rule="evenodd"/>`;

  // Center net bar — drawn ABOVE the court so it sits over any cell color
  if (showNet) {
    const n = PM.NET;
    svg += `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" fill="${netColor || outlineColor}"/>`;
  }

  // Letter monogram (replaces cells when active)
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
//  ANIMATED SVG (SMIL, runtime-free)
// ═══════════════════════════════════════════════════════════════════
PM.PULSE_FRAMES = [
  { name: 'DEFAULT',  cells: { TL: PM.C.blue, BR: PM.C.lime }, letter: null, ms: 600 },
  { name: 'SWAP',     cells: { TR: PM.C.blue, BL: PM.C.lime }, letter: null, ms: 480 },
  { name: 'BUILD',    cells: { L:  PM.C.blue, TL: PM.C.blue, BR: PM.C.lime, R: PM.C.lime }, letter: null, ms: 400 },
  { name: 'P',        cells: {}, letter: 'P', ms: 900 },
  { name: 'TRANS',    cells: { L: PM.C.blue, R: PM.C.lime }, letter: null, ms: 320 },
  { name: 'M',        cells: {}, letter: 'M', ms: 900 },
  { name: 'PULSE',    cells: { TL: PM.C.blue, TR: PM.C.lime, BL: PM.C.lime, BR: PM.C.blue }, letter: null, ms: 280 },
  { name: 'RESET',    cells: { TL: PM.C.blue, BR: PM.C.lime }, letter: null, ms: 700 },
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

  const vb = PM.VIEWBOX;
  let svg = '';
  if (includeXMLDecl) svg += '<?xml version="1.0" encoding="UTF-8"?>\n';
  svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" width="${width}" height="${Math.round(width * PM.ASPECT)}" role="img" aria-label="PadelMatch animated mark">`;

  if (bgColor) {
    svg += `<rect x="${vb.x}" y="${vb.y}" width="${vb.w}" height="${vb.h}" fill="${bgColor}"/>`;
  }

  // Animated cell fills
  for (const [name, c] of Object.entries(PM.CELLS)) {
    const b = PM.CELL_BLEED;
    svg += `<rect x="${(c.x - b).toFixed(3)}" y="${(c.y - b).toFixed(3)}" width="${(c.w + b*2).toFixed(3)}" height="${(c.h + b*2).toFixed(3)}" fill="transparent">`;
    svg += `<animate attributeName="fill" calcMode="discrete" values="${valuesForCell(name)}" keyTimes="${keyTimesAttr}" dur="${durSec}" repeatCount="indefinite"/>`;
    svg += `</rect>`;
  }

  // Court outline (always)
  svg += `<path d="${PM.COURT_PATH}" fill="${outlineColor}" fill-rule="evenodd"/>`;

  // Net (always)
  const n = PM.NET;
  svg += `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" fill="${outlineColor}"/>`;

  // Letter P (toggled visible only in P frame)
  const b = PM.LETTER_BLEED;
  svg += `<g opacity="0"><animate attributeName="opacity" calcMode="discrete" values="${valuesForLetterOpacity('P')}" keyTimes="${keyTimesAttr}" dur="${durSec}" repeatCount="indefinite"/>`;
  for (const r of PM.P_RECTS) {
    svg += `<rect x="${(r.x - b).toFixed(3)}" y="${(r.y - b).toFixed(3)}" width="${(r.w + b*2).toFixed(3)}" height="${(r.h + b*2).toFixed(3)}" fill="${C.lime}"/>`;
  }
  svg += `</g>`;

  // Letter M
  svg += `<g opacity="0"><animate attributeName="opacity" calcMode="discrete" values="${valuesForLetterOpacity('M')}" keyTimes="${keyTimesAttr}" dur="${durSec}" repeatCount="indefinite"/>`;
  for (const r of PM.M_RECTS) {
    svg += `<rect x="${(r.x - b).toFixed(3)}" y="${(r.y - b).toFixed(3)}" width="${(r.w + b*2).toFixed(3)}" height="${(r.h + b*2).toFixed(3)}" fill="${C.blue}"/>`;
  }
  svg += `</g>`;

  svg += '</svg>';
  return svg;
};

// ═══════════════════════════════════════════════════════════════════
//  DOWNLOAD + CLIPBOARD HELPERS  (unchanged from v1)
// ═══════════════════════════════════════════════════════════════════
PM.downloadBlob = function(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
};
PM.downloadSVG = function(filename, svgString) {
  PM.downloadBlob(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }), filename);
};
PM.svgToPNGBlob = async function(svgString, pxWidth, pxHeight = null) {
  if (!pxHeight) {
    const vbMatch = svgString.match(/viewBox="([\d.\-\s]+)"/);
    if (vbMatch) {
      const [, , vbW, vbH] = vbMatch[1].split(/\s+/).map(parseFloat);
      pxHeight = Math.round(pxWidth * vbH / vbW);
    } else pxHeight = pxWidth;
  }
  const cleanSVG = svgString.replace(/width="[\d.]+"\s+height="[\d.]+"/, `width="${pxWidth}" height="${pxHeight}"`);
  const blob = new Blob([cleanSVG], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i); i.onerror = reject; i.src = url;
  });
  const canvas = document.createElement('canvas');
  canvas.width = pxWidth; canvas.height = pxHeight;
  canvas.getContext('2d').drawImage(img, 0, 0, pxWidth, pxHeight);
  URL.revokeObjectURL(url);
  return await new Promise(res => canvas.toBlob(res, 'image/png'));
};
PM.downloadPNG = async function(filename, svgString, pxWidth, pxHeight = null) {
  PM.downloadBlob(await PM.svgToPNGBlob(svgString, pxWidth, pxHeight), filename);
};
// ── Inline fonts so SVG-foreignObject PNG export doesn't taint canvas ──
// SVG images rendered as <img> run in an isolated origin. Any external font
// fetch they trigger TAINTS the canvas. Solution: pre-fetch WOFF2 files,
// embed them as base64 data: URLs inside an inline @font-face block.
PM._fontInlineCSS = null;
PM._fontInlinePromise = null;

function _arrayBufferToBase64(buf) {
  let bin = '';
  const bytes = new Uint8Array(buf);
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

PM.ensureFontInline = function() {
  if (PM._fontInlineCSS != null) return Promise.resolve(PM._fontInlineCSS);
  if (PM._fontInlinePromise)     return PM._fontInlinePromise;
  PM._fontInlinePromise = (async () => {
    try {
      // Fetch the Google Fonts stylesheet (CORS-allowed; returns woff2 URLs for modern Chrome UA)
      const cssURL = 'https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap';
      const cssRes = await fetch(cssURL);
      if (!cssRes.ok) throw new Error('CSS fetch ' + cssRes.status);
      let css = await cssRes.text();
      // Collect every unique font URL the CSS references
      const urlRE = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
      const urls = [...new Set([...css.matchAll(urlRE)].map(m => m[1]))];
      // Fetch each in parallel, convert to data URL
      const replacements = await Promise.all(urls.map(async (url) => {
        const r = await fetch(url);
        if (!r.ok) throw new Error('Font fetch ' + r.status + ' for ' + url);
        const buf = await r.arrayBuffer();
        const ext = (url.match(/\.(woff2|woff|ttf|otf)/i) || ['', 'woff2'])[1].toLowerCase();
        const mime = ext === 'woff' ? 'font/woff' : ext === 'ttf' ? 'font/ttf' : ext === 'otf' ? 'font/otf' : 'font/woff2';
        return { url, dataURL: `data:${mime};base64,${_arrayBufferToBase64(buf)}` };
      }));
      for (const { url, dataURL } of replacements) css = css.split(url).join(dataURL);
      PM._fontInlineCSS = css;
      return css;
    } catch (e) {
      console.warn('Inline-font failed; PNG exports will use fallback fonts:', e);
      PM._fontInlineCSS = '';
      return '';
    }
  })();
  return PM._fontInlinePromise;
};

PM.htmlToPNGBlob = async function(htmlString, width, height, bgColor = null) {
  // Ensure host fonts are loaded first
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (_) {}
  }
  // Embed fonts as data URLs so the isolated SVG render context doesn't taint canvas
  const inlineFontCSS = await PM.ensureFontInline();
  const fontStyle = inlineFontCSS ? `<defs><style type="text/css">${inlineFontCSS}</style></defs>` : '';
  const wrapped = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${fontStyle}
    ${bgColor ? `<rect width="${width}" height="${height}" fill="${bgColor}"/>` : ''}
    <foreignObject width="100%" height="100%">
      <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;display:flex;align-items:center;justify-content:center;font-family:'Unbounded','Arial Black',sans-serif;">${htmlString}</div>
    </foreignObject>
  </svg>`;
  const blob = new Blob([wrapped], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('SVG image load failed (foreignObject or nested resource)'));
      i.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    return await new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('canvas.toBlob returned null (likely canvas tainted)')), 'image/png'));
  } finally {
    URL.revokeObjectURL(url);
  }
};
// ═══════════════════════════════════════════════════════════════════
//  CANVAS-NATIVE PNG RENDERERS  (no foreignObject, no taint)
// ═══════════════════════════════════════════════════════════════════
// SVG-with-foreignObject taints canvas because the isolated SVG render context
// fetches fonts cross-origin. Canvas 2D context uses the host page's fonts
// directly via document.fonts — never taints. We use canvas for any text-bearing
// output (wordmark, lockup, og-card) and load the mark SVG as an Image (no text).

PM._svgToImage = function(svgString) {
  // Same-origin Blob URL → Image. Mark SVG has no external resources so won't taint.
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(new Error('SVG image load failed')); };
    img.src = url;
  });
};

// ── Mini-mark image cache for 'glyphs' wordmark variant ───────────
PM._miniMarkCache = {};
PM._loadMiniMark = async function(letter, onInk = false) {
  const key = letter + (onInk ? '-ink' : '');
  if (PM._miniMarkCache[key]) return PM._miniMarkCache[key];
  const svg = PM.buildLogoSVG({ showLetter: letter, onInk, width: 300, cellFills: {} });
  const img = await PM._svgToImage(svg);
  PM._miniMarkCache[key] = img;
  return img;
};

// Measure total width of the rendered wordmark at given size.
PM.measureWordmarkPx = function(wmOpts, size) {
  const caseDef   = PM.WORDMARK_CASES.find(c => c.id === wmOpts.caseId)   || PM.WORDMARK_CASES[1];
  const weightDef = PM.WORDMARK_WEIGHTS.find(w => w.id === wmOpts.weightId) || PM.WORDMARK_WEIGHTS[1];
  const gap = caseDef.gap * size;
  const letterSpacing = -0.04 * size;
  const ctx = document.createElement('canvas').getContext('2d');
  let total = 0;
  let i = 0;
  for (const [text, color] of caseDef.parts) {
    const isP = i === 0;
    const weight = weightDef.weights.mix
      ? ((isP || color === 'lime') ? 900 : 700)
      : (isP ? weightDef.weights.padel : weightDef.weights.match);
    ctx.font = `${weight} ${size}px 'Unbounded', 'Arial Black', sans-serif`;
    // Mini-mark replaces leading P (in PADEL/Padel) or leading M (in MATCH/Match)
    const useGlyph = wmOpts.specialId === 'glyphs' && /^(padel|match)$/i.test(text);
    let chars = useGlyph ? text.slice(1) : text;
    let widthChars = 0;
    for (let j = 0; j < chars.length; j++) widthChars += ctx.measureText(chars[j]).width + letterSpacing;
    if (chars.length > 0) widthChars -= letterSpacing;
    if (useGlyph) {
      const glyphW = size * 0.82 * (PM.VIEWBOX.w / PM.VIEWBOX.h);
      total += glyphW + (size * 0.04) + widthChars;
    } else {
      total += widthChars;
    }
    total += gap;
    i++;
  }
  total -= gap; // remove trailing
  return total;
};

// Render wordmark onto a canvas context at baseline (x, baselineY).
PM.renderWordmarkOnCanvas = async function(ctx, wmOpts, x, baselineY, size) {
  const caseDef   = PM.WORDMARK_CASES.find(c => c.id === wmOpts.caseId)   || PM.WORDMARK_CASES[1];
  const weightDef = PM.WORDMARK_WEIGHTS.find(w => w.id === wmOpts.weightId) || PM.WORDMARK_WEIGHTS[1];
  const onInk = !!wmOpts.onInk;
  const inkBase = onInk ? PM.C.white : PM.C.ink;
  const inkDim  = onInk ? 'rgba(255,255,255,0.45)' : 'rgba(17,17,24,0.4)';
  const padelBaseColor = wmOpts.padelColor === 'blue' ? PM.C.blue : inkBase;
  const c1 = wmOpts.color1 || padelBaseColor;
  const c2 = wmOpts.color2 || PM.C.lime;

  const gap = caseDef.gap * size;
  const letterSpacing = -0.04 * size;

  let cursorX = x;
  let i = 0;
  for (const [text, color] of caseDef.parts) {
    const isP = i === 0;
    const weight = weightDef.weights.mix
      ? ((isP || color === 'lime') ? 900 : 700)
      : (isP ? weightDef.weights.padel : weightDef.weights.match);
    const colorHex = color === 'lime' ? c2 : (color === 'ink-dim' ? inkDim : c1);
    ctx.font = `${weight} ${size}px 'Unbounded', 'Arial Black', sans-serif`;
    ctx.fillStyle = colorHex;
    ctx.textBaseline = 'alphabetic';

    const useGlyph = wmOpts.specialId === 'glyphs' && /^(padel|match)$/i.test(text);
    let chars = useGlyph ? text.slice(1) : text;

    if (useGlyph) {
      const isPad = text.toUpperCase().startsWith('P');
      const glyphLetter = isPad ? 'P' : 'M';
      const glyphImg = await PM._loadMiniMark(glyphLetter, onInk);
      // glyph height = 0.82 * size (matches HTML version capEm)
      // glyph aspect = VB.w/VB.h
      const gh = size * 0.82;
      const gw = gh * (PM.VIEWBOX.w / PM.VIEWBOX.h);
      // glyph baseline aligns with text baseline — top of glyph at baselineY - gh
      ctx.drawImage(glyphImg, cursorX, baselineY - gh, gw, gh);
      cursorX += gw + size * 0.04;
    }
    for (let j = 0; j < chars.length; j++) {
      ctx.fillText(chars[j], cursorX, baselineY);
      cursorX += ctx.measureText(chars[j]).width + letterSpacing;
    }
    if (chars.length > 0) cursorX -= letterSpacing;
    cursorX += gap;
    i++;
  }
};

// Render the full lockup (mark + wordmark + optional tagline) to PNG.
PM.renderLockupPNG = async function(lockupOpts, exportW, exportH, bgColor) {
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (_) {}
  }
  const canvas = document.createElement('canvas');
  canvas.width = exportW; canvas.height = exportH;
  const ctx = canvas.getContext('2d');
  if (bgColor) { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, exportW, exportH); }

  const showTagline = !!lockupOpts.showTagline;
  const onInk = !!lockupOpts.onInk;
  const padY = exportH * 0.18;
  const padX = exportW * 0.06;
  const availH = exportH - 2 * padY;
  const availW = exportW - 2 * padX;

  const visRatio = 32 / 36;
  const CAP_WM  = PM._wmCapRatio;
  const CAP_TAG = PM._tagCapRatio;
  const TAG_FONT_RATIO = 0.30;
  const TAG_GAP_RATIO  = 0.18;

  // First pass: compute sizes if mark fills full available height.
  // If total width exceeds availW, scale everything down.
  function computeLayout(markBoxH) {
    const markW    = markBoxH / PM.ASPECT;
    const visMarkH = markBoxH * visRatio;
    let wmSize, taglineSize = 0, taglineGap = 0;
    if (showTagline) {
      wmSize = visMarkH / (CAP_WM + TAG_GAP_RATIO + TAG_FONT_RATIO * CAP_TAG);
      taglineSize = wmSize * TAG_FONT_RATIO;
      taglineGap  = wmSize * TAG_GAP_RATIO;
    } else {
      wmSize = visMarkH / CAP_WM;
    }
    const gap = markBoxH * 0.20;
    const wmTotalW = PM.measureWordmarkPx(lockupOpts, wmSize);
    const taglineText = (lockupOpts.tagline || 'Find the perfect match.').toUpperCase();
    const taglineLS = 0.12 * taglineSize;
    let tagW = 0;
    if (showTagline) {
      ctx.font = `400 ${taglineSize}px 'DM Mono', monospace`;
      for (let j = 0; j < taglineText.length; j++) tagW += ctx.measureText(taglineText[j]).width + taglineLS;
      if (taglineText.length > 0) tagW -= taglineLS;
    }
    const colW = Math.max(wmTotalW, tagW);
    return { markBoxH, markW, visMarkH, wmSize, taglineSize, taglineGap, gap, colW, totalW: markW + gap + colW, taglineText, taglineLS };
  }

  let layout = computeLayout(availH);
  if (layout.totalW > availW) {
    const scale = availW / layout.totalW;
    layout = computeLayout(availH * scale);
  }

  const { markBoxH, markW, visMarkH, wmSize, taglineSize, taglineGap, gap, totalW, taglineText, taglineLS } = layout;
  const visMarkTopOffset = markBoxH * (2 / 36);

  // Center horizontally + vertically
  const xStart = (exportW - totalW) / 2;
  const yStart = (exportH - markBoxH) / 2;
  const markX = xStart;
  const markY = yStart;

  // Draw mark
  const markSVG = PM.buildLogoSVG({
    showLetter: lockupOpts.showMarkLetter,
    cellFills: lockupOpts.cellFills,
    onInk,
    width: Math.max(300, Math.round(markW * 3)),
  });
  const markImg = await PM._svgToImage(markSVG);
  ctx.drawImage(markImg, markX, markY, markW, markBoxH);

  // Wordmark baseline = top-of-visible-court + cap height
  const visMarkTop = markY + visMarkTopOffset;
  const wmX = markX + markW + gap;
  const wmBaselineY = visMarkTop + wmSize * CAP_WM;
  await PM.renderWordmarkOnCanvas(ctx, lockupOpts, wmX, wmBaselineY, wmSize);

  // Tagline
  if (showTagline) {
    const tagBaselineY = wmBaselineY + taglineGap + taglineSize * CAP_TAG;
    ctx.font = `400 ${taglineSize}px 'DM Mono', monospace`;
    ctx.fillStyle = onInk ? 'rgba(255,255,255,0.55)' : 'rgba(17,17,24,0.55)';
    ctx.textBaseline = 'alphabetic';
    let tx = wmX;
    for (let j = 0; j < taglineText.length; j++) {
      ctx.fillText(taglineText[j], tx, tagBaselineY);
      tx += ctx.measureText(taglineText[j]).width + taglineLS;
    }
  }

  return new Promise(r => canvas.toBlob(r, 'image/png'));
};

// Render a wordmark-only PNG with auto-scale-to-fit.
PM.renderWordmarkPNG = async function(wmOpts, exportW, exportH, bgColor) {
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (_) {}
  }
  const canvas = document.createElement('canvas');
  canvas.width = exportW; canvas.height = exportH;
  const ctx = canvas.getContext('2d');
  if (bgColor) { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, exportW, exportH); }
  const padX = exportW * 0.06;
  const padY = exportH * 0.20;
  const availW = exportW - 2 * padX;
  const availH = exportH - 2 * padY;
  const CAP_WM = PM._wmCapRatio;
  // Start at cap = availH, scale down if width exceeds availW
  let size = availH / CAP_WM;
  const measured = PM.measureWordmarkPx(wmOpts, size);
  if (measured > availW) size = size * (availW / measured);
  const finalMeasured = PM.measureWordmarkPx(wmOpts, size);
  const x = (exportW - finalMeasured) / 2;
  const baselineY = (exportH + size * CAP_WM) / 2;
  await PM.renderWordmarkOnCanvas(ctx, wmOpts, x, baselineY, size);
  return new Promise(r => canvas.toBlob(r, 'image/png'));
};

PM.copyText = function(text) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text);
  const ta = document.createElement('textarea');
  ta.value = text; document.body.appendChild(ta);
  ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
  return Promise.resolve();
};

let _toastTimer = null;
PM.toast = function(msg) {
  let el = document.getElementById('pm-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'pm-toast'; el.className = 'pm-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg; el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
};
PM.flashBtn = function(btn, label, color) {
  const orig = btn.dataset.origText || btn.textContent;
  btn.dataset.origText = orig;
  btn.textContent = (color ? '✗ ' : '✓ ') + label;
  btn.classList.add('flash');
  if (color) btn.style.color = color;
  setTimeout(() => {
    btn.textContent = btn.dataset.origText || orig;
    btn.classList.remove('flash');
    if (color) btn.style.color = '';
  }, 1400);
  PM.toast(label);
};
