// ═══════════════════════════════════════════════════════════════════
//  PADELMATCH · WORDMARK / LOCKUP / ICON BUILDERS  (v2)
//  Updated for FINAL logo geometry:
//    • New viewBox "5 30 90 36" (aspect 2.5 : 1)
//    • Mark always includes center NET bar
//    • Default cell colors: TL=blue, BR=lime
// ═══════════════════════════════════════════════════════════════════

(function(PM) {

  const C = PM.C;
  const F = PM.FONTS;
  const VB = PM.VIEWBOX;
  const A  = PM.ASPECT; // 0.4

  // ── Cap-height measurement ─────────────────────────────────────
  // We need the *actual* cap height of Unbounded 900 and DM Mono to make
  // the horizontal lockup's mark height equal the wordmark cap height
  // (or wordmark+tagline combined height). Hardcoded ratios drift per font.
  PM._wmCapRatio  = 0.73;   // fallback for Unbounded 900
  PM._tagCapRatio = 0.70;   // fallback for DM Mono caps

  function _measureCap(fontCss, text) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const PROBE = 1000;
      ctx.font = fontCss.replace('__SIZE__', PROBE + 'px');
      const m = ctx.measureText(text);
      // actualBoundingBoxAscent ≈ visible cap top → baseline distance for all-caps text
      return m.actualBoundingBoxAscent / PROBE;
    } catch (e) { return null; }
  }

  PM.calibrate = async function() {
    try {
      if (document.fonts && document.fonts.load) {
        // Force-load the exact weights we use before measuring
        await Promise.all([
          document.fonts.load("900 100px 'Unbounded'", 'PADEL MATCH'),
          document.fonts.load("400 100px 'DM Mono'",   'FIND THE PERFECT MATCH'),
        ]);
        if (document.fonts.ready) await document.fonts.ready;
      }
    } catch (_) {}
    const w = _measureCap("900 __SIZE__ 'Unbounded', 'Arial Black', sans-serif", 'PADEL MATCH');
    const t = _measureCap("400 __SIZE__ 'DM Mono', monospace", 'FIND THE PERFECT MATCH.');
    if (w && w > 0.4 && w < 1.1) PM._wmCapRatio  = w;
    if (t && t > 0.4 && t < 1.1) PM._tagCapRatio = t;
  };

  // ── Wordmark cases / weights / specials ────────────────────────
  PM.WORDMARK_CASES = [
    { id: 'pm-single',  label: 'PADELMATCH',     parts: [['PADEL', 'ink'], ['MATCH', 'lime']],                                gap: 0 },
    { id: 'pm-split',   label: 'PADEL MATCH',    parts: [['PADEL', 'ink'], ['MATCH', 'lime']],                                gap: 0.16 },
    { id: 'pm-dot',     label: 'PADEL · MATCH',  parts: [['PADEL', 'ink'], ['·', 'ink-dim'], ['MATCH', 'lime']],              gap: 0.10 },
    { id: 'pm-camel',   label: 'PadelMatch',     parts: [['Padel', 'ink'], ['Match', 'lime']],                                gap: 0, mixedCase: true },
  ];

  PM.WORDMARK_WEIGHTS = [
    { id: 'w700', label: '700 · BOLD',     weights: { padel: 700, match: 700 } },
    { id: 'w900', label: '900 · BLACK',    weights: { padel: 900, match: 900 } },
    { id: 'wmix', label: 'MIX · P/M @900', weights: { padel: 900, match: 900, mix: true } },
  ];

  PM.WORDMARK_SPECIAL = [
    { id: 'clean',   label: 'CLEAN — type only' },
    { id: 'glyphs',  label: 'MINI-MARKS — P/M replaced with letter-marks' },
    { id: 'court',   label: 'COURT-GRID UNDERLINE' },
  ];

  // Inline mini letter-mark SVG sized to cap-height
  function miniMarkSVG(letter, capEm = 0.72) {
    // viewBox aspect = w/h. mini-mark height = capEm em, width = capEm * (w/h) em
    const w = (capEm * (VB.w / VB.h)).toFixed(3);
    const C2 = PM.C;
    const outline = C2.ink;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}" style="height:${capEm}em;width:${w}em;display:inline-block;vertical-align:baseline;margin:0 0.04em -0.02em 0;">`;
    svg += `<path d="${PM.COURT_PATH}" fill="${outline}" fill-rule="evenodd"/>`;
    // Net
    const n = PM.NET;
    svg += `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" fill="${outline}"/>`;
    const b = PM.LETTER_BLEED;
    const rects = letter === 'P' ? PM.P_RECTS : PM.M_RECTS;
    const fill  = letter === 'P' ? C2.lime    : C2.blue;
    for (const r of rects) {
      svg += `<rect x="${(r.x - b).toFixed(3)}" y="${(r.y - b).toFixed(3)}" width="${(r.w + b*2).toFixed(3)}" height="${(r.h + b*2).toFixed(3)}" fill="${fill}"/>`;
    }
    svg += '</svg>';
    return svg;
  }

  // ── Wordmark HTML builder ───────────────────────────────────────
  PM.buildWordmarkHTML = function({
    caseId = 'pm-split',
    weightId = 'w900',
    specialId = 'clean',
    size = 48,
    onInk = false,
    padelColor = 'ink',
    color1 = null,
    color2 = null,
  } = {}) {
    const caseDef   = PM.WORDMARK_CASES.find(c => c.id === caseId);
    const weightDef = PM.WORDMARK_WEIGHTS.find(w => w.id === weightId);
    const inkBase   = onInk ? C.white : C.ink;
    const inkDim    = onInk ? 'rgba(255,255,255,0.45)' : 'rgba(17,17,24,0.4)';
    const padelBaseColor = padelColor === 'blue' ? C.blue : inkBase;
    const c1 = color1 || padelBaseColor;
    const c2 = color2 || C.lime;

    const baseStyle = `font-family:${F.display};font-size:${size}px;letter-spacing:-0.04em;line-height:0.9;display:inline-flex;align-items:baseline;white-space:nowrap;`;
    const gapStyle  = caseDef.gap > 0 ? `gap:${caseDef.gap}em;` : '';

    function partHTML(text, color, weight) {
      const col = color === 'lime' ? c2 : (color === 'ink-dim' ? inkDim : c1);
      return `<span style="color:${col};font-weight:${weight};">${text}</span>`;
    }

    let partsHTML = '';
    let i = 0;
    for (const [text, color] of caseDef.parts) {
      const isP = i === 0;
      const weight = weightDef.weights.mix
        ? (isP || (color === 'lime')) ? 900 : 700
        : (isP ? weightDef.weights.padel : weightDef.weights.match);

      if (specialId === 'glyphs' && (text === 'PADEL' || text === 'MATCH' || text === 'Padel' || text === 'Match')) {
        const isPadel = text.toUpperCase() === 'PADEL';
        const isMatch = text.toUpperCase() === 'MATCH';
        const col = color === 'lime' ? c2 : c1;
        if (isPadel) {
          const rest = text.slice(1);
          partsHTML += `<span style="display:inline-flex;align-items:baseline;color:${col};font-weight:${weight};">${miniMarkSVG('P', 0.82)}<span>${rest}</span></span>`;
        } else if (isMatch) {
          const rest = text.slice(1);
          partsHTML += `<span style="display:inline-flex;align-items:baseline;color:${col};font-weight:${weight};">${miniMarkSVG('M', 0.82)}<span>${rest}</span></span>`;
        } else {
          partsHTML += partHTML(text, color, weight);
        }
      } else {
        partsHTML += partHTML(text, color, weight);
      }
      i++;
    }

    let wm = `<span style="${baseStyle}${gapStyle}">${partsHTML}</span>`;

    if (specialId === 'court') {
      const tickColor = onInk ? 'rgba(255,255,255,0.45)' : 'rgba(17,17,24,0.55)';
      const accent = c2;
      const underlineH = Math.max(8, size * 0.18);
      const ticks = 32;
      const tickSpacing = 100 / ticks;
      let tickHTML = '';
      for (let i = 0; i <= ticks; i++) {
        tickHTML += `<line x1="${(i * tickSpacing).toFixed(2)}" y1="2" x2="${(i * tickSpacing).toFixed(2)}" y2="6" stroke="${tickColor}" stroke-width="0.4"/>`;
      }
      const underlineSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 8" preserveAspectRatio="none" style="display:block;width:100%;height:${underlineH}px;">
        <line x1="0" y1="1" x2="100" y2="1" stroke="${tickColor}" stroke-width="0.7"/>
        <line x1="0" y1="7" x2="100" y2="7" stroke="${tickColor}" stroke-width="0.7"/>
        ${tickHTML}
        <rect x="0" y="0.5" width="14" height="7" fill="${accent}"/>
      </svg>`;
      wm = `<span style="display:inline-flex;flex-direction:column;align-items:stretch;gap:${size * 0.22}px;">
        ${wm}
        ${underlineSVG}
      </span>`;
    }

    return wm;
  };

  // ── Lockups ─────────────────────────────────────────────────────
  PM.buildLockupHTML = function({
    orientation = 'horizontal',
    caseId = 'pm-split',
    weightId = 'w900',
    specialId = 'clean',
    padelColor = 'ink',
    markSize = 96,
    wordmarkSize = null,
    gap = null,
    onInk = false,
    showTagline = false,
    tagline = 'Find the perfect match.',
    cellFills = null,       // null → default (TL blue, BR lime)
    showMarkLetter = null,
  } = {}) {
    const inkBase = onInk ? C.white : C.ink;
    const taglineColor = onInk ? 'rgba(255,255,255,0.55)' : 'rgba(17,17,24,0.55)';
    // viewBox is 5 30 90 36, but the visible court only spans y=32→64 (h=32)
    // and x=7→93 (w=86). We match wordmark/tagline visible heights to the
    // VISIBLE court height, not the SVG bounding-box height.
    const VIS_H_RATIO = 32 / 36;   // 0.8889 — visible court height / viewBox height
    const VIS_TOP_PAD = 2 / 36;    // empty viewBox units above visible court
    const svgBoxH    = markSize * A;
    const markHeight = svgBoxH * VIS_H_RATIO; // visible court height
    const markTopPadPx = svgBoxH * VIS_TOP_PAD;
    const CAP_WM  = PM._wmCapRatio;
    const CAP_TAG = PM._tagCapRatio;
    // Gap between wordmark baseline and tagline cap-top, expressed as a fraction
    // of wmSize. Tagline font-size is also a fraction of wmSize.
    const TAG_FONT_RATIO = 0.30;
    const TAG_GAP_RATIO  = 0.18;

    let wmSize = wordmarkSize;
    if (wmSize == null) wmSize = markHeight / CAP_WM;

    let taglineSize = Math.max(10, wmSize * TAG_FONT_RATIO);
    let taglineGap  = wmSize * TAG_GAP_RATIO;
    if (showTagline && orientation === 'horizontal' && wordmarkSize == null) {
      // Solve: markHeight = wmCap + gap + tagCap
      //                   = wmSize*CAP_WM + wmSize*TAG_GAP_RATIO + wmSize*TAG_FONT_RATIO*CAP_TAG
      wmSize      = markHeight / (CAP_WM + TAG_GAP_RATIO + TAG_FONT_RATIO * CAP_TAG);
      taglineSize = Math.max(10, wmSize * TAG_FONT_RATIO);
      taglineGap  = wmSize * TAG_GAP_RATIO;
    }
    const wmCapH  = wmSize * CAP_WM;
    const tagCapH = taglineSize * CAP_TAG;

    const markSVG = showMarkLetter
      ? PM.buildLogoSVG({ showLetter: showMarkLetter, onInk, width: markSize })
      : PM.buildLogoSVG({ cellFills, onInk, width: markSize });

    // Wrap mark so its LAYOUT box height = visible court height (markHeight),
    // with the SVG offset upward so the visible court top aligns with the wrapper top.
    // overflow:visible lets the padding above/below render outside the box freely.
    const markWrap = `<div style="display:block;flex-shrink:0;width:${markSize}px;height:${markHeight}px;line-height:0;overflow:visible;">
      <div style="transform:translateY(-${markTopPadPx.toFixed(3)}px);display:inline-block;line-height:0;">${markSVG}</div>
    </div>`;

    const wm = PM.buildWordmarkHTML({ caseId, weightId, specialId, size: wmSize, onInk, padelColor });

    const taglineHTML = showTagline
      ? `<div style="font-family:${F.mono};font-size:${taglineSize}px;letter-spacing:0.12em;text-transform:uppercase;color:${taglineColor};line-height:1;">${tagline.toUpperCase()}</div>`
      : '';

    if (orientation === 'mark')    return `<div style="display:inline-block;">${markSVG}</div>`;
    if (orientation === 'wordmark') return `<div style="display:inline-flex;flex-direction:column;align-items:flex-start;gap:${taglineGap}px;">${wm}${taglineHTML}</div>`;
    if (orientation === 'stacked') {
      const g = gap == null ? markSize * 0.12 : gap;
      return `<div style="display:inline-flex;flex-direction:column;align-items:center;gap:${g}px;">
        <div style="display:flex;">${markSVG}</div>
        ${wm}
        ${taglineHTML}
      </div>`;
    }
    // HORIZONTAL — both mark wrapper and wordmark column have height = visible
    // mark height (or wmCap+gap+tagCap), so flex center-alignment yields exact
    // top/bottom matching.
    const g = gap == null ? markSize * 0.20 : gap;
    if (showTagline) {
      const colH = wmCapH + taglineGap + tagCapH;
      return `<div style="display:inline-flex;align-items:center;gap:${g}px;">
        ${markWrap}
        <div style="display:flex;flex-direction:column;align-items:flex-start;height:${colH}px;">
          ${_capBox(wm, wmCapH, wmSize)}
          <div style="height:${taglineGap}px;flex-shrink:0;"></div>
          ${_capBox(taglineHTML, tagCapH, taglineSize)}
        </div>
      </div>`;
    }
    return `<div style="display:inline-flex;align-items:center;gap:${g}px;">
      ${markWrap}
      ${_capBox(wm, wmCapH, wmSize)}
    </div>`;
  };

  // Wrap a text element so its BOX is exactly capHeight tall, with the caps
  // top-aligned to box-top and baseline at box-bottom. The natural ascender
  // overshoot above caps and descender below baseline overflow visibly.
  function _capBox(inner, capHeight, fontSize) {
    // Most fonts: ascender ~ 0.93em, cap ~ 0.73em → ascender-to-cap overshoot ~ 0.20em.
    // We pull the inner element up by that overshoot so caps land at box top.
    // Then the box height = capHeight; baseline = capHeight from top.
    return `<div style="display:block;height:${capHeight}px;line-height:0;overflow:visible;">
      <div style="display:inline-block;line-height:1;transform:translateY(-${(fontSize - capHeight).toFixed(3)}px);">${inner}</div>
    </div>`;
  }

  // ── Icon builders ───────────────────────────────────────────────
  function _renderMarkInside(svgInner, opts) {
    // Helper: appends the mark-inside-icon to svgInner string. Returns updated string.
    const { onInk, cellFills, showLetter, showNet = true } = opts;
    const outlineColor = onInk ? C.white : C.ink;
    // Cells
    if (!showLetter) {
      for (const [name, c] of Object.entries(PM.CELLS)) {
        const fill = cellFills[name];
        if (!fill) continue;
        const b = PM.CELL_BLEED;
        svgInner += `<rect x="${(c.x - b).toFixed(3)}" y="${(c.y - b).toFixed(3)}" width="${(c.w + b*2).toFixed(3)}" height="${(c.h + b*2).toFixed(3)}" fill="${fill}"/>`;
      }
    }
    // Court
    svgInner += `<path d="${PM.COURT_PATH}" fill="${outlineColor}" fill-rule="evenodd"/>`;
    // Net
    if (showNet) {
      const n = PM.NET;
      svgInner += `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" fill="${outlineColor}"/>`;
    }
    // Letters
    if (showLetter) {
      const b = PM.LETTER_BLEED;
      const rects = showLetter === 'P' ? PM.P_RECTS : PM.M_RECTS;
      const lf    = showLetter === 'P' ? C.lime    : C.blue;
      for (const rr of rects) {
        svgInner += `<rect x="${(rr.x - b).toFixed(3)}" y="${(rr.y - b).toFixed(3)}" width="${(rr.w + b*2).toFixed(3)}" height="${(rr.h + b*2).toFixed(3)}" fill="${lf}"/>`;
      }
    }
    return svgInner;
  }

  PM.buildAppIconSVG = function({
    size = 1024,
    bgColor = C.cream,
    onInk = false,
    cornerRadius = 0.225,
    markScale = 0.78,
    cellFills = null,
    showLetter = null,
    includeXMLDecl = false,
  } = {}) {
    const fills = cellFills == null ? PM.DEFAULT_CELLS : cellFills;
    const r = size * cornerRadius;
    const markW = size * markScale;
    const markH = markW * A;
    const markX = (size - markW) / 2;
    const markY = (size - markH) / 2;

    let svg = '';
    if (includeXMLDecl) svg += '<?xml version="1.0" encoding="UTF-8"?>\n';
    svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="PadelMatch app icon">`;
    svg += `<rect x="0" y="0" width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${bgColor}"/>`;
    svg += `<svg x="${markX}" y="${markY}" width="${markW}" height="${markH}" viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}">`;
    svg = _renderMarkInside(svg, { onInk, cellFills: fills, showLetter });
    svg += `</svg></svg>`;
    return svg;
  };

  PM.buildFaviconSVG = function({ size = 48, bgColor = C.cream, onInk = false, includeXMLDecl = false } = {}) {
    const markScale = 0.88;
    const markW = size * markScale;
    const markH = markW * A;
    const markX = (size - markW) / 2;
    const markY = (size - markH) / 2;
    let svg = '';
    if (includeXMLDecl) svg += '<?xml version="1.0" encoding="UTF-8"?>\n';
    svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;
    svg += `<rect x="0" y="0" width="${size}" height="${size}" fill="${bgColor}"/>`;
    svg += `<svg x="${markX}" y="${markY}" width="${markW}" height="${markH}" viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}">`;
    svg = _renderMarkInside(svg, { onInk, cellFills: PM.DEFAULT_CELLS });
    svg += `</svg></svg>`;
    return svg;
  };

  PM.buildOGCardHTML = function({
    width = 1200, height = 630,
    onInk = false, bgColor = null,
    showTagline = true,
    caseId = 'pm-single', weightId = 'w900',
    tagline = 'Find the perfect match.',
  } = {}) {
    const bg = bgColor || (onInk ? C.ink : C.cream);
    const lockup = PM.buildLockupHTML({
      orientation: 'horizontal',
      caseId, weightId, specialId: 'clean',
      markSize: Math.round(height * 0.62),
      wordmarkSize: Math.round(height * 0.15),
      onInk, showTagline, tagline,
    });
    return `<div style="width:${width}px;height:${height}px;background:${bg};display:flex;align-items:center;justify-content:center;padding:${Math.round(height*0.08)}px;box-sizing:border-box;">
      ${lockup}
    </div>`;
  };

  PM.buildAvatarSVG = function({ size = 512, bgColor = C.cream, cellFills = null, onInk = false, includeXMLDecl = false } = {}) {
    return PM.buildAppIconSVG({ size, bgColor, onInk, cornerRadius: 0, markScale: 0.82, cellFills, includeXMLDecl });
  };

})(window.PM);
