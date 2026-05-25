// ═══════════════════════════════════════════════════════════════════
//  PADELMATCH · WORDMARK / LOCKUP / ICON BUILDERS
//  Produces HTML strings (with inline SVG marks for lockups + icons).
//  All output is self-contained and PNG-exportable via PM.htmlToPNGBlob.
// ═══════════════════════════════════════════════════════════════════

(function(PM) {

  const C = PM.C;
  const F = PM.FONTS;

  // ── Wordmark variants ────────────────────────────────────────────
  // Each variant is a label + the HTML it should render.
  // Defaults: PADEL=ink, MATCH=lime (chosen direction)
  PM.WORDMARK_CASES = [
    { id: 'pm-single',  label: 'PADELMATCH',     parts: [['PADEL', 'ink'], ['MATCH', 'lime']],   gap: 0 },
    { id: 'pm-split',   label: 'PADEL MATCH',    parts: [['PADEL', 'ink'], ['MATCH', 'lime']],   gap: 0.16 },
    { id: 'pm-dot',     label: 'PADEL · MATCH',  parts: [['PADEL', 'ink'], ['·', 'ink-dim'], ['MATCH', 'lime']], gap: 0.10 },
    { id: 'pm-camel',   label: 'PadelMatch',     parts: [['Padel', 'ink'], ['Match', 'lime']],   gap: 0, mixedCase: true },
  ];

  PM.WORDMARK_WEIGHTS = [
    { id: 'w700', label: '700 · BOLD',    weights: { padel: 700, match: 700 } },
    { id: 'w900', label: '900 · BLACK',   weights: { padel: 900, match: 900 } },
    { id: 'wmix', label: 'MIX · P/M @900', weights: { padel: 900, match: 900, mix: true } },
  ];

  PM.WORDMARK_SPECIAL = [
    { id: 'clean',   label: 'CLEAN — type only' },
    { id: 'glyphs',  label: 'MINI-MARKS — P/M replaced with letter-marks' },
    { id: 'court',   label: 'COURT-GRID UNDERLINE' },
  ];

  // Inline mini letter-mark SVG sized to cap-height
  function miniMarkSVG(letter, capEm = 0.72) {
    // letter-marks viewBox 5 23 90 56 — aspect 90:56 ≈ 1.607
    // For inline-block at height = capEm em, width = capEm * (90/56) em
    const w = (capEm * (90 / 56)).toFixed(3);
    const showLetter = letter; // 'P' or 'M'
    const C2 = PM.C;
    const outline = C2.ink;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="5 23 90 56" style="height:${capEm}em;width:${w}em;display:inline-block;vertical-align:baseline;margin:0 0.04em -0.02em 0;"><path d="${PM.COURT_PATH}" fill="${outline}" fill-rule="evenodd"/>`;
    const b = PM.LETTER_BLEED;
    const rects = showLetter === 'P' ? PM.P_RECTS : PM.M_RECTS;
    const fill = showLetter === 'P' ? C2.lime : C2.blue;
    for (const r of rects) {
      svg += `<rect x="${(r.x - b).toFixed(3)}" y="${(r.y - b).toFixed(3)}" width="${(r.w + b*2).toFixed(3)}" height="${(r.h + b*2).toFixed(3)}" fill="${fill}"/>`;
    }
    svg += '</svg>';
    return svg;
  }

  // ── Wordmark HTML builder ────────────────────────────────────────
  // Returns an HTML string (no surrounding <div>) for the wordmark.
  PM.buildWordmarkHTML = function({
    caseId = 'pm-split',   // default updated to pm-split per brand decision
    weightId = 'w900',
    specialId = 'clean',
    size = 48,
    onInk = false,
    padelColor = 'ink',    // 'ink' (default) or 'blue' — color of "PADEL"
    color1 = null,         // override PADEL color directly
    color2 = null,         // override MATCH color directly (default lime)
  } = {}) {
    const caseDef = PM.WORDMARK_CASES.find(c => c.id === caseId);
    const weightDef = PM.WORDMARK_WEIGHTS.find(w => w.id === weightId);
    const inkBase = onInk ? C.white : C.ink;
    const inkDim  = onInk ? 'rgba(255,255,255,0.45)' : 'rgba(17,17,24,0.4)';
    // padelColor: 'blue' overrides to brand blue; otherwise ink/white based on bg
    const padelBaseColor = padelColor === 'blue' ? C.blue : inkBase;
    const c1 = color1 || padelBaseColor;
    const c2 = color2 || C.lime;

    const baseStyle = `font-family:${F.display};font-size:${size}px;letter-spacing:-0.04em;line-height:0.9;display:inline-flex;align-items:baseline;white-space:nowrap;`;
    const gapStyle = caseDef.gap > 0 ? `gap:${caseDef.gap}em;` : '';

    // Build text parts
    function partHTML(text, color, weight) {
      const col = color === 'lime' ? c2 : (color === 'ink-dim' ? inkDim : c1);
      return `<span style="color:${col};font-weight:${weight};">${text}</span>`;
    }

    let partsHTML = '';
    let i = 0;
    for (const [text, color] of caseDef.parts) {
      const isP = i === 0;
      const weight = weightDef.weights.mix
        ? (isP || (color === 'lime')) ? 900 : 700  // mix: heaviest on PADEL+MATCH whole words
        : (isP ? weightDef.weights.padel : weightDef.weights.match);

      // Special: glyphs — replace P of PADEL and M of MATCH with mini-marks
      if (specialId === 'glyphs' && (text === 'PADEL' || text === 'MATCH' || text === 'Padel' || text === 'Match')) {
        const isPadel = text.toUpperCase() === 'PADEL';
        const isMatch = text.toUpperCase() === 'MATCH';
        if (isPadel) {
          // Replace P with mini P-mark — sized to cap-height of surrounding type
          const rest = text.slice(1);
          partsHTML += `<span style="display:inline-flex;align-items:baseline;color:${color === 'lime' ? c2 : c1};font-weight:${weight};">${miniMarkSVG('P', 0.82)}<span>${rest}</span></span>`;
        } else if (isMatch) {
          // Replace M with mini M-mark — sized to cap-height of surrounding type
          const rest = text.slice(1);
          partsHTML += `<span style="display:inline-flex;align-items:baseline;color:${color === 'lime' ? c2 : c1};font-weight:${weight};">${miniMarkSVG('M', 0.82)}<span>${rest}</span></span>`;
        } else {
          partsHTML += partHTML(text, color, weight);
        }
      } else {
        partsHTML += partHTML(text, color, weight);
      }
      i++;
    }

    let wm = `<span style="${baseStyle}${gapStyle}">${partsHTML}</span>`;

    // Special: court-grid underline — a thin net-like graphic below the wordmark
    if (specialId === 'court') {
      const tickColor = onInk ? 'rgba(255,255,255,0.45)' : 'rgba(17,17,24,0.55)';
      const accent = c2;
      const underlineH = Math.max(8, size * 0.18);
      // Inline SVG underline: top + bottom rails + vertical ticks + lime accent at start
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

  // ── Lockups ──────────────────────────────────────────────────────
  // Renders mark + wordmark together as inline-flex.
  // Returns HTML string.
  //
  // Sizing rule (v2 — per brand feedback):
  //   wordmark cap-height ≈ mark height. Unbounded 900 cap-height ≈ 0.732em,
  //   mark height = markSize × 56/90 = markSize × 0.622.
  //   So wordmarkSize ≈ markSize × 0.85 to match heights visually.
  //   If a tagline is shown, wordmark+tagline combined height must fit the
  //   mark height — wordmark shrinks accordingly.
  PM.buildLockupHTML = function({
    orientation = 'horizontal',
    caseId = 'pm-split',           // default updated
    weightId = 'w900',
    specialId = 'clean',
    padelColor = 'ink',            // 'ink' or 'blue'
    markSize = 96,
    wordmarkSize = null,           // null = auto-compute from markSize
    gap = null,                    // null = orientation-dependent default
    onInk = false,
    showTagline = false,
    tagline = 'Find the perfect match.',
    cellFills = { TL: C.lime, BR: C.blue },
    showMarkLetter = null,
  } = {}) {
    const inkBase = onInk ? C.white : C.ink;
    const taglineColor = onInk ? 'rgba(255,255,255,0.55)' : 'rgba(17,17,24,0.55)';
    const markHeight = markSize * 56 / 90;
    // Unbounded 900 cap-height ratio (font-size × CAP_RATIO ≈ cap-height in px)
    const CAP_RATIO = 0.732;

    // Auto-compute wordmark size to match mark height exactly (cap-height = mark height)
    let wmSize = wordmarkSize;
    if (wmSize == null) {
      wmSize = markHeight / CAP_RATIO; // matches cap-height to full mark height
    }

    // If tagline shown in horizontal, scale wordmark+tagline to fit mark height
    let taglineSize = Math.max(10, wmSize * 0.30);
    let taglineMarginTop = wmSize * 0.18;
    if (showTagline && (orientation === 'horizontal' || orientation === 'stacked')) {
      // Solve for wmSize so total stack height ≤ markHeight (horizontal) or fits (stacked)
      if (orientation === 'horizontal' && wordmarkSize == null) {
        // (wm × cap) + (wm × 0.18) + (wm × 0.30 × cap) = markHeight
        // wm × (cap + 0.18 + 0.30 × cap) = markHeight
        // wm × (0.732 + 0.18 + 0.22) = markHeight  →  wm × 1.13 ≈ markHeight
        wmSize = markHeight / (CAP_RATIO + 0.18 + 0.30 * CAP_RATIO);
        taglineSize = Math.max(10, wmSize * 0.30);
        taglineMarginTop = wmSize * 0.18;
      }
    }

    const markSVG = (showMarkLetter)
      ? PM.buildLogoSVG({ showLetter: showMarkLetter, onInk, width: markSize })
      : PM.buildLogoSVG({ cellFills, onInk, width: markSize });

    const wm = PM.buildWordmarkHTML({ caseId, weightId, specialId, size: wmSize, onInk, padelColor });

    const taglineHTML = showTagline
      ? `<div style="font-family:${F.mono};font-size:${taglineSize}px;letter-spacing:0.12em;text-transform:uppercase;color:${taglineColor};margin-top:${taglineMarginTop}px;line-height:1;">${tagline.toUpperCase()}</div>`
      : '';

    if (orientation === 'mark') {
      return `<div style="display:inline-block;">${markSVG}</div>`;
    }
    if (orientation === 'wordmark') {
      return `<div style="display:inline-flex;flex-direction:column;align-items:flex-start;">${wm}${taglineHTML}</div>`;
    }
    if (orientation === 'stacked') {
      // Tighter default gap (was markSize × 0.28, now markSize × 0.12)
      const g = gap == null ? markSize * 0.12 : gap;
      return `<div style="display:inline-flex;flex-direction:column;align-items:center;gap:${g}px;">
        <div style="display:flex;">${markSVG}</div>
        ${wm}
        ${taglineHTML}
      </div>`;
    }
    // horizontal (default)
    const g = gap == null ? markSize * 0.28 : gap;
    if (showTagline) {
      return `<div style="display:inline-flex;align-items:center;gap:${g}px;">
        <div style="display:flex;flex-shrink:0;">${markSVG}</div>
        <div style="display:inline-flex;flex-direction:column;align-items:flex-start;justify-content:center;">${wm}${taglineHTML}</div>
      </div>`;
    }
    return `<div style="display:inline-flex;align-items:center;gap:${g}px;">
      <div style="display:flex;flex-shrink:0;">${markSVG}</div>
      <div style="display:inline-flex;align-items:center;">${wm}</div>
    </div>`;
  };

  // ── Icon builders ────────────────────────────────────────────────
  // Each icon = a square SVG built around the mark with bg + padding.

  // App icon — rounded-square iOS/Android style, mark centered.
  // Uses default diagonal mark; bg can be lime/cream/ink.
  PM.buildAppIconSVG = function({
    size = 1024,
    bgColor = C.cream,
    onInk = false,
    cornerRadius = 0.225,    // iOS-style ~22.5% (squircle approximation via border-radius)
    markScale = 0.72,        // mark fills 72% of the icon width
    cellFills = { TL: C.lime, BR: C.blue },
    showLetter = null,
    includeXMLDecl = false,
  } = {}) {
    const r = size * cornerRadius;
    const aspect = 56 / 90;
    const markW = size * markScale;
    const markH = markW * aspect;
    const markX = (size - markW) / 2;
    const markY = (size - markH) / 2;

    let svg = '';
    if (includeXMLDecl) svg += '<?xml version="1.0" encoding="UTF-8"?>\n';
    svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="PadelMatch app icon">`;
    svg += `<rect x="0" y="0" width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${bgColor}"/>`;
    // Place mark inside via nested SVG with its own viewBox
    const outlineColor = onInk ? C.white : C.ink;
    svg += `<svg x="${markX}" y="${markY}" width="${markW}" height="${markH}" viewBox="5 23 90 56">`;
    // Cell fills
    for (const [name, c] of Object.entries(PM.CELLS)) {
      const fill = cellFills[name];
      if (!fill) continue;
      const b = PM.CELL_BLEED;
      svg += `<rect x="${(c.x - b).toFixed(3)}" y="${(c.y - b).toFixed(3)}" width="${(c.w + b*2).toFixed(3)}" height="${(c.h + b*2).toFixed(3)}" fill="${fill}"/>`;
    }
    svg += `<path d="${PM.COURT_PATH}" fill="${outlineColor}" fill-rule="evenodd"/>`;
    if (showLetter) {
      const b = PM.LETTER_BLEED;
      const rects = showLetter === 'P' ? PM.P_RECTS : PM.M_RECTS;
      const lf = showLetter === 'P' ? C.lime : C.blue;
      for (const rr of rects) {
        svg += `<rect x="${(rr.x - b).toFixed(3)}" y="${(rr.y - b).toFixed(3)}" width="${(rr.w + b*2).toFixed(3)}" height="${(rr.h + b*2).toFixed(3)}" fill="${lf}"/>`;
      }
    }
    svg += `</svg></svg>`;
    return svg;
  };

  // Favicon — square, no rounded corners (browser handles tab styling), simple
  PM.buildFaviconSVG = function({ size = 48, bgColor = C.cream, includeXMLDecl = false } = {}) {
    const aspect = 56 / 90;
    const markScale = 0.84;
    const markW = size * markScale;
    const markH = markW * aspect;
    const markX = (size - markW) / 2;
    const markY = (size - markH) / 2;
    let svg = '';
    if (includeXMLDecl) svg += '<?xml version="1.0" encoding="UTF-8"?>\n';
    svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;
    svg += `<rect x="0" y="0" width="${size}" height="${size}" fill="${bgColor}"/>`;
    svg += `<svg x="${markX}" y="${markY}" width="${markW}" height="${markH}" viewBox="5 23 90 56">`;
    const cellFills = { TL: C.lime, BR: C.blue };
    for (const [name, c] of Object.entries(PM.CELLS)) {
      const fill = cellFills[name];
      if (!fill) continue;
      const b = PM.CELL_BLEED;
      svg += `<rect x="${(c.x - b).toFixed(3)}" y="${(c.y - b).toFixed(3)}" width="${(c.w + b*2).toFixed(3)}" height="${(c.h + b*2).toFixed(3)}" fill="${fill}"/>`;
    }
    svg += `<path d="${PM.COURT_PATH}" fill="${C.ink}" fill-rule="evenodd"/>`;
    svg += `</svg></svg>`;
    return svg;
  };

  // OG card builder — returns HTML string (uses inline lockup)
  // Renderable to 1200×630 PNG via PM.htmlToPNGBlob.
  PM.buildOGCardHTML = function({
    width = 1200,
    height = 630,
    onInk = false,
    bgColor = null,
    showTagline = true,
    caseId = 'pm-single',
    weightId = 'w900',
    tagline = 'Find the perfect match.',
  } = {}) {
    const bg = bgColor || (onInk ? C.ink : C.cream);
    const lockup = PM.buildLockupHTML({
      orientation: 'horizontal',
      caseId,
      weightId,
      specialId: 'clean',
      markSize: Math.round(height * 0.42),
      wordmarkSize: Math.round(height * 0.16),
      onInk,
      showTagline,
      tagline,
    });
    return `<div style="width:${width}px;height:${height}px;background:${bg};display:flex;align-items:center;justify-content:center;padding:${Math.round(height*0.08)}px;box-sizing:border-box;">
      ${lockup}
    </div>`;
  };

  // Avatar (square crop, just the mark)
  PM.buildAvatarSVG = function({ size = 512, bgColor = C.cream, cellFills = { TL: C.lime, BR: C.blue }, onInk = false, includeXMLDecl = false } = {}) {
    return PM.buildAppIconSVG({ size, bgColor, onInk, cornerRadius: 0, markScale: 0.76, cellFills, includeXMLDecl });
  };

})(window.PM);
