// ═══════════════════════════════════════════════════════════════════
//  PADELMATCH · PIXEL COURT — LOADING / MATCHING STATE  (v2)
//  Adapted to v2 geometry (viewBox 5 30 90 36).
// ═══════════════════════════════════════════════════════════════════
//
// Sub-divides the 6 court cells into a 10×6 pixel canvas:
//   col 0   = L strip (1×6)
//   col 1-4 = TL (rows 0-2) / BL (rows 3-5)   (4×3 each)
//   col 5-8 = TR (rows 0-2) / BR (rows 3-5)   (4×3 each)
//   col 9   = R strip (1×6)
//
// Phases pulse through scatter/sweep/match/dissolve states — no letters,
// pure rhythm. Use for splash screens, "finding your match" loaders.

(function(PM) {
  const C = PM.C;
  const CELLS = PM.CELLS;
  const CELL_BLEED = PM.CELL_BLEED;
  const COURT_PATH = PM.COURT_PATH;
  const NET = PM.NET;
  const VB = PM.VIEWBOX;

  const PIXEL_W = 10;
  const PIXEL_H = 6;

  function pixelRect(col, row) {
    let parent, subCol, subRow, subCols, subRows;
    if (col === 0)      { parent = CELLS.L;  subCol = 0; subRow = row; subCols = 1; subRows = 6; }
    else if (col === 9) { parent = CELLS.R;  subCol = 0; subRow = row; subCols = 1; subRows = 6; }
    else if (col <= 4) {
      if (row < 3) { parent = CELLS.TL; subRow = row; }
      else         { parent = CELLS.BL; subRow = row - 3; }
      subCol = col - 1; subCols = 4; subRows = 3;
    } else {
      if (row < 3) { parent = CELLS.TR; subRow = row; }
      else         { parent = CELLS.BR; subRow = row - 3; }
      subCol = col - 5; subCols = 4; subRows = 3;
    }
    const w = parent.w / subCols;
    const h = parent.h / subRows;
    return { x: parent.x + subCol * w, y: parent.y + subRow * h, w, h };
  }

  function renderPixelCourt(svgEl) {
    const onInk = svgEl.dataset.onInk === 'true';
    const outlineColor = onInk ? C.white : C.ink;
    const dim = onInk ? 'rgba(255,255,255,0.05)' : '#EBE7D8';

    // Make sure viewBox matches v2 geometry
    svgEl.setAttribute('viewBox', `${VB.x} ${VB.y} ${VB.w} ${VB.h}`);

    let html = '';
    // Background cell shading (so the empty pixel grid is visible)
    for (const [name, c] of Object.entries(CELLS)) {
      html += `<rect x="${c.x - CELL_BLEED}" y="${c.y - CELL_BLEED}" width="${c.w + CELL_BLEED * 2}" height="${c.h + CELL_BLEED * 2}" fill="${dim}"/>`;
    }
    // Pixel rects (initially transparent) with tiny inset so they read as discrete pixels
    const inset = 0.35;
    for (let r = 0; r < PIXEL_H; r++) {
      for (let col = 0; col < PIXEL_W; col++) {
        const p = pixelRect(col, r);
        html += `<rect class="pix" data-pix="${col}-${r}" x="${(p.x + inset).toFixed(3)}" y="${(p.y + inset).toFixed(3)}" width="${Math.max(0, p.w - inset * 2).toFixed(3)}" height="${Math.max(0, p.h - inset * 2).toFixed(3)}" fill="transparent" style="transition: fill 220ms ease-out;"/>`;
      }
    }
    // Court outline on top so it frames the pixel canvas
    html += `<path d="${COURT_PATH}" fill="${outlineColor}" fill-rule="evenodd"/>`;
    // Net always rendered black/white on top
    html += `<rect x="${NET.x}" y="${NET.y}" width="${NET.w}" height="${NET.h}" fill="${outlineColor}"/>`;
    svgEl.innerHTML = html;
  }

  // Pseudo-random scatter generator (seeded for reproducibility)
  function makeScatter(density, seed) {
    const arr = [];
    let s = seed * 9301 + 49297;
    for (let r = 0; r < PIXEL_H; r++) {
      const row = [];
      for (let c = 0; c < PIXEL_W; c++) {
        s = (s * 9301 + 49297) % 233280;
        const rnd = s / 233280;
        row.push(rnd < density ? 1 : 0);
      }
      arr.push(row);
    }
    return arr;
  }

  function setScatter(svgEl, scatterA, colorA, scatterB, colorB) {
    for (let r = 0; r < PIXEL_H; r++) {
      for (let col = 0; col < PIXEL_W; col++) {
        const pix = svgEl.querySelector(`[data-pix="${col}-${r}"]`);
        if (!pix) continue;
        if (scatterA && scatterA[r][col]) pix.setAttribute('fill', colorA);
        else if (scatterB && scatterB[r][col]) pix.setAttribute('fill', colorB);
        else pix.setAttribute('fill', 'transparent');
      }
    }
  }

  function setColumn(svgEl, col, color) {
    for (let r = 0; r < PIXEL_H; r++) {
      const pix = svgEl.querySelector(`[data-pix="${col}-${r}"]`);
      if (pix) pix.setAttribute('fill', color);
    }
  }
  function clearAll(svgEl) {
    svgEl.querySelectorAll('.pix').forEach(p => p.setAttribute('fill', 'transparent'));
  }

  // ── INIT — wire up the section ────────────────────────────────
  PM.initPixelScatter = function() {
    const pixelMarks = [
      document.getElementById('pixel-mark-ink'),
      document.getElementById('pixel-mark-cream'),
      document.getElementById('pixel-mark-cream-2'),
    ].filter(Boolean);
    if (pixelMarks.length === 0) return;

    pixelMarks.forEach(renderPixelCourt);

    const SCATTER_A     = makeScatter(0.25, 7);
    const SCATTER_B     = makeScatter(0.30, 13);
    const SCATTER_C     = makeScatter(0.18, 23);
    const SCATTER_DENSE = makeScatter(0.55, 41);

    const PIXEL_PHASES = [
      { name: 'SCATTER A',  ms: 700, apply: svg => setScatter(svg, SCATTER_A, C.lime, SCATTER_B, C.blue) },
      { name: 'SCATTER B',  ms: 700, apply: svg => setScatter(svg, SCATTER_B, C.lime, SCATTER_A, C.blue) },
      { name: 'SWEEP L→R',  ms: 900, apply: svg => {
          clearAll(svg);
          for (let c = 0; c < PIXEL_W; c++) setColumn(svg, c, c % 2 === 0 ? C.lime : C.blue);
        } },
      { name: 'SCATTER C',  ms: 600, apply: svg => setScatter(svg, SCATTER_C, C.blue, SCATTER_A, C.lime) },
      { name: 'CONVERGE',   ms: 800, apply: svg => setScatter(svg, SCATTER_DENSE, C.lime, null, null) },
      { name: 'MATCH',      ms: 900, apply: svg => {
          clearAll(svg);
          for (let r = 0; r < 3; r++) for (let c = 1; c < 5; c++) {
            const p = svg.querySelector(`[data-pix="${c}-${r}"]`);
            if (p) p.setAttribute('fill', C.lime);
          }
          for (let r = 3; r < 6; r++) for (let c = 5; c < 9; c++) {
            const p = svg.querySelector(`[data-pix="${c}-${r}"]`);
            if (p) p.setAttribute('fill', C.blue);
          }
          for (let r = 0; r < 6; r++) {
            const pL = svg.querySelector(`[data-pix="0-${r}"]`);
            const pR = svg.querySelector(`[data-pix="9-${r}"]`);
            if (pL) pL.setAttribute('fill', C.lime);
            if (pR) pR.setAttribute('fill', C.blue);
          }
        } },
      { name: 'DISSOLVE',   ms: 500, apply: svg => setScatter(svg, SCATTER_A, C.lime, null, null) },
    ];

    let pixelIdx = 0;
    let pixelPlaying = true;
    let pixelTimer = null;

    function applyPixelPhase(i) {
      pixelIdx = ((i % PIXEL_PHASES.length) + PIXEL_PHASES.length) % PIXEL_PHASES.length;
      const p = PIXEL_PHASES[pixelIdx];
      pixelMarks.forEach(p.apply);
      const nameEl = document.getElementById('pixel-name');
      if (nameEl) nameEl.textContent = p.name;
    }
    function pixelTick() {
      applyPixelPhase(pixelIdx + 1);
      if (pixelPlaying) pixelTimer = setTimeout(pixelTick, PIXEL_PHASES[pixelIdx].ms);
    }

    applyPixelPhase(0);

    const playBtn = document.getElementById('pixel-play');
    const stepBtn = document.getElementById('pixel-step');
    const resetBtn = document.getElementById('pixel-reset');

    if (playBtn) playBtn.addEventListener('click', () => {
      pixelPlaying = !pixelPlaying;
      playBtn.textContent = pixelPlaying ? 'PAUSE' : 'PLAY';
      playBtn.classList.toggle('primary', pixelPlaying);
      if (pixelPlaying) pixelTick();
      else clearTimeout(pixelTimer);
    });
    if (stepBtn) stepBtn.addEventListener('click', () => {
      pixelPlaying = false;
      if (playBtn) {
        playBtn.textContent = 'PLAY';
        playBtn.classList.remove('primary');
      }
      clearTimeout(pixelTimer);
      applyPixelPhase(pixelIdx + 1);
    });
    if (resetBtn) resetBtn.addEventListener('click', () => applyPixelPhase(0));

    pixelTimer = setTimeout(pixelTick, PIXEL_PHASES[0].ms);
  };
})(window.PM);
