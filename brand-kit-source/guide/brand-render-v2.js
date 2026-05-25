// ═══════════════════════════════════════════════════════════════════
//  PADELMATCH · BRAND BOOK RENDERER  (v2)
//  Renders Brand Book v2.html using the FINAL logo geometry.
// ═══════════════════════════════════════════════════════════════════

(async function(PM) {
  const C = PM.C;

  // Calibrate font cap-heights BEFORE any lockup is built so the horizontal
  // mark/wordmark/tagline heights align exactly. Falls through with fallback
  // ratios if calibration fails for any reason.
  if (PM.calibrate) { try { await PM.calibrate(); } catch (_) {} }

  // ── COVER LOCKUP ──
  document.getElementById('cover-lockup').innerHTML = PM.buildLockupHTML({
    orientation: 'horizontal',
    caseId: 'pm-split',
    weightId: 'w900',
    specialId: 'clean',
    markSize: 280,
    onInk: true,
    showTagline: true,
    tagline: 'Find the perfect match.',
  });

  // ── 01 · LOGO MARK ──
  const markCfgs = [
    { title: 'DEFAULT · CREAM',   sub: 'recommended ground', slug: 'padelmatch-mark-cream', bg: 'cream', opts: { bgColor: C.cream } },
    { title: 'DEFAULT · INK',     sub: 'on dark surfaces',   slug: 'padelmatch-mark-ink',   bg: 'ink',   opts: { onInk: true, bgColor: C.ink } },
    { title: 'DEFAULT · WHITE',   sub: 'paper · print',      slug: 'padelmatch-mark-white', bg: 'white', opts: { bgColor: C.white } },
    { title: 'LETTER · P',        sub: 'monogram · lime',    slug: 'padelmatch-P-cream',    bg: 'cream', opts: { showLetter: 'P', bgColor: C.cream } },
    { title: 'LETTER · M',        sub: 'monogram · blue',    slug: 'padelmatch-M-cream',    bg: 'cream', opts: { showLetter: 'M', bgColor: C.cream } },
    { title: 'LETTER · P · INK',  sub: 'lime on ink',        slug: 'padelmatch-P-ink',      bg: 'ink',   opts: { showLetter: 'P', onInk: true, bgColor: C.ink } },
    { title: 'LETTER · M · INK',  sub: 'blue on ink',        slug: 'padelmatch-M-ink',      bg: 'ink',   opts: { showLetter: 'M', onInk: true, bgColor: C.ink } },
    { title: 'INVERSE · LIME BG', sub: 'high-energy',        slug: 'padelmatch-mark-lime',  bg: 'lime',  opts: { bgColor: C.lime, cellFills: { TL: C.ink, BR: C.blue } } },
  ];
  const gridMark = document.getElementById('grid-mark');
  markCfgs.forEach(cfg => gridMark.appendChild(makeAssetCard(cfg)));

  // ── 02 · WORDMARK CASES ──
  const gridWmCase = document.getElementById('grid-wm-case');
  const WORDMARK_SIZE = 42;
  PM.WORDMARK_CASES.forEach((wc, i) => {
    const tile = document.createElement('div');
    tile.className = 'wm-tile';
    const wm = PM.buildWordmarkHTML({ caseId: wc.id, weightId: 'w900', specialId: 'clean', size: WORDMARK_SIZE });
    tile.innerHTML = `
      <div class="wm-stage">${wm}</div>
      <div class="wm-meta">
        <span class="lbl">${wc.label} ${i === 1 ? '<span class="recommend-badge" style="margin-left:8px;">RECOMMENDED</span>' : ''}</span>
        <span class="tag">${wc.id}</span>
      </div>
      <div class="actions">
        <button class="primary" data-action="png" data-wm='${JSON.stringify({ caseId: wc.id, weightId: 'w900', specialId: 'clean' })}' data-slug="padelmatch-wm-${wc.id}" data-size="1200">↓ PNG @1200</button>
        <button data-action="png" data-wm='${JSON.stringify({ caseId: wc.id, weightId: 'w900', specialId: 'clean' })}' data-slug="padelmatch-wm-${wc.id}" data-size="600">PNG @600</button>
        <button data-action="copy-html" data-wm='${JSON.stringify({ caseId: wc.id, weightId: 'w900', specialId: 'clean' })}'>COPY HTML</button>
      </div>
    `;
    gridWmCase.appendChild(tile);
  });

  // ── 03 · WORDMARK COLOR VARIANT ──
  const gridWmColor = document.getElementById('grid-wm-color');
  const colorVariants = [
    { id: 'padel-ink',  label: 'PADEL · INK',  sub: 'conservative · default', padelColor: 'ink',  recommended: true  },
    { id: 'padel-blue', label: 'PADEL · BLUE', sub: 'saturated · energetic',  padelColor: 'blue', recommended: false },
  ];
  colorVariants.forEach(cv => {
    const tile = document.createElement('div');
    tile.className = 'wm-tile';
    const wm = PM.buildWordmarkHTML({ caseId: 'pm-split', weightId: 'w900', specialId: 'clean', size: 56, padelColor: cv.padelColor });
    tile.innerHTML = `
      <div class="wm-stage">${wm}</div>
      <div class="wm-meta">
        <span class="lbl">${cv.label} ${cv.recommended ? '<span class="recommend-badge" style="margin-left:8px;">RECOMMENDED</span>' : ''}</span>
        <span class="tag">${cv.sub}</span>
      </div>
      <div class="actions">
        <button class="primary" data-action="png" data-wm='${JSON.stringify({ caseId: 'pm-split', weightId: 'w900', specialId: 'clean', padelColor: cv.padelColor })}' data-slug="padelmatch-wm-${cv.id}" data-size="1600">↓ PNG @1600</button>
        <button data-action="png" data-wm='${JSON.stringify({ caseId: 'pm-split', weightId: 'w900', specialId: 'clean', padelColor: cv.padelColor })}' data-slug="padelmatch-wm-${cv.id}" data-size="800">PNG @800</button>
        <button data-action="copy-html" data-wm='${JSON.stringify({ caseId: 'pm-split', weightId: 'w900', specialId: 'clean', padelColor: cv.padelColor })}'>COPY HTML</button>
      </div>
    `;
    gridWmColor.appendChild(tile);
  });

  // ── 04 · WORDMARK WEIGHT ──
  const gridWmWeight = document.getElementById('grid-wm-weight');
  PM.WORDMARK_WEIGHTS.forEach((ww) => {
    const tile = document.createElement('div');
    tile.className = 'wm-tile';
    const wm = PM.buildWordmarkHTML({ caseId: 'pm-split', weightId: ww.id, specialId: 'clean', size: WORDMARK_SIZE });
    tile.innerHTML = `
      <div class="wm-stage">${wm}</div>
      <div class="wm-meta">
        <span class="lbl">${ww.label} ${ww.id === 'w900' ? '<span class="recommend-badge" style="margin-left:8px;">RECOMMENDED</span>' : ''}</span>
        <span class="tag">PADEL MATCH</span>
      </div>
      <div class="actions">
        <button class="primary" data-action="png" data-wm='${JSON.stringify({ caseId: 'pm-split', weightId: ww.id, specialId: 'clean' })}' data-slug="padelmatch-wm-${ww.id}" data-size="1200">↓ PNG @1200</button>
        <button data-action="copy-html" data-wm='${JSON.stringify({ caseId: 'pm-split', weightId: ww.id, specialId: 'clean' })}'>COPY HTML</button>
      </div>
    `;
    gridWmWeight.appendChild(tile);
  });

  // ── 05 · WORDMARK SPECIAL ──
  const gridWmSpecial = document.getElementById('grid-wm-special');
  PM.WORDMARK_SPECIAL.forEach((ws) => {
    const tile = document.createElement('div');
    tile.className = 'wm-tile';
    const sz = ws.id === 'glyphs' ? 30 : WORDMARK_SIZE;
    const wm = PM.buildWordmarkHTML({ caseId: 'pm-split', weightId: 'w900', specialId: ws.id, size: sz });
    tile.innerHTML = `
      <div class="wm-stage">${wm}</div>
      <div class="wm-meta">
        <span class="lbl">${ws.label} ${ws.id === 'clean' ? '<span class="recommend-badge" style="margin-left:8px;">RECOMMENDED</span>' : ''}</span>
        <span class="tag">${ws.id}</span>
      </div>
      <div class="actions">
        <button class="primary" data-action="png" data-wm='${JSON.stringify({ caseId: 'pm-split', weightId: 'w900', specialId: ws.id })}' data-slug="padelmatch-wm-${ws.id}" data-size="1200">↓ PNG @1200</button>
        <button data-action="copy-html" data-wm='${JSON.stringify({ caseId: 'pm-split', weightId: 'w900', specialId: ws.id })}'>COPY HTML</button>
      </div>
    `;
    gridWmSpecial.appendChild(tile);
  });

  // ── 06 · LOCKUPS ──
  const lockupCfgs = [
    { title: 'HORIZONTAL · DEFAULT',         sub: 'app bar · header · footer',     slug: 'padelmatch-lockup-horizontal',         bg: 'cream', lockupOpts: { orientation: 'horizontal', markSize: 200 } },
    { title: 'HORIZONTAL · INK',             sub: 'dark mode · video stinger',     slug: 'padelmatch-lockup-horizontal-ink',     bg: 'ink',   lockupOpts: { orientation: 'horizontal', markSize: 200, onInk: true } },
    { title: 'STACKED · CENTERED',           sub: 'square spaces · app store',     slug: 'padelmatch-lockup-stacked',            bg: 'cream', lockupOpts: { orientation: 'stacked', markSize: 240, wordmarkSize: 44 } },
    { title: 'STACKED · WITH TAGLINE',       sub: 'marketing · hero panels',       slug: 'padelmatch-lockup-stacked-tagline',    bg: 'cream', lockupOpts: { orientation: 'stacked', markSize: 240, wordmarkSize: 40, gap: 10, showTagline: true, tagline: 'Find the perfect match.' } },
    { title: 'MARK ONLY',                    sub: 'compact · favicon · nav',       slug: 'padelmatch-mark-only',                 bg: 'cream', lockupOpts: { orientation: 'mark', markSize: 280 } },
    { title: 'WORDMARK ONLY',                sub: 'text-heavy contexts',           slug: 'padelmatch-wordmark-only',             bg: 'cream', lockupOpts: { orientation: 'wordmark', wordmarkSize: 56 } },
    { title: 'HORIZONTAL · WITH TAGLINE',    sub: 'business cards · sign-offs',    slug: 'padelmatch-lockup-horizontal-tagline', bg: 'cream', lockupOpts: { orientation: 'horizontal', markSize: 240, showTagline: true, tagline: 'Find the perfect match.' } },
    { title: 'STACKED · ON INK',             sub: 'splash · dark hero',            slug: 'padelmatch-lockup-stacked-ink',        bg: 'ink',   lockupOpts: { orientation: 'stacked', markSize: 240, wordmarkSize: 40, gap: 10, onInk: true, showTagline: true, tagline: 'Find the perfect match.' } },
  ];
  const gridLockups = document.getElementById('grid-lockups');
  lockupCfgs.forEach(cfg => {
    const tile = document.createElement('div');
    tile.className = 'wm-tile';
    if (cfg.bg === 'ink') tile.classList.add('ink');
    const html = PM.buildLockupHTML(cfg.lockupOpts);
    tile.innerHTML = `
      <div class="wm-stage">${html}</div>
      <div class="wm-meta">
        <span class="lbl">${cfg.title}</span>
        <span class="tag">${cfg.sub}</span>
      </div>
      <div class="actions">
        <button class="primary" data-action="lockup-png" data-cfg='${JSON.stringify(cfg)}' data-size="1600">↓ PNG @1600</button>
        <button data-action="lockup-png" data-cfg='${JSON.stringify(cfg)}' data-size="800">PNG @800</button>
        <button data-action="lockup-copy-html" data-cfg='${JSON.stringify(cfg)}'>COPY HTML</button>
      </div>
    `;
    gridLockups.appendChild(tile);
  });

  // ── 07 · ICONS ──
  const iconCfgs = [
    { title: 'FAVICON · 48 PX',         sub: 'browser tab · light',     slug: 'padelmatch-favicon-48',       stage: 'light', build: () => PM.buildFaviconSVG({ size: 48, bgColor: C.cream }),               sizes: [16, 32, 48] },
    { title: 'FAVICON · DARK · 48 PX',  sub: 'browser tab · dark',      slug: 'padelmatch-favicon-48-dark',  stage: 'dark',  build: () => PM.buildFaviconSVG({ size: 48, bgColor: C.ink, onInk: true }),    sizes: [16, 32, 48] },
    { title: 'APP ICON · CREAM',        sub: 'iOS · Android · 1024',    slug: 'padelmatch-appicon-cream',    stage: 'light', build: () => PM.buildAppIconSVG({ size: 1024, bgColor: C.cream }),               sizes: [1024, 512, 180] },
    { title: 'APP ICON · LIME',         sub: 'high-energy variant',     slug: 'padelmatch-appicon-lime',     stage: 'light', build: () => PM.buildAppIconSVG({ size: 1024, bgColor: C.lime, cellFills: { TL: C.ink, BR: C.blue } }), sizes: [1024, 512, 180] },
    { title: 'APP ICON · INK',          sub: 'dark-mode springboard',   slug: 'padelmatch-appicon-ink',      stage: 'dark',  build: () => PM.buildAppIconSVG({ size: 1024, bgColor: C.ink, onInk: true }),   sizes: [1024, 512, 180] },
    { title: 'APPLE TOUCH · 180 PX',    sub: 'iOS home screen',         slug: 'padelmatch-appletouch',       stage: 'light', build: () => PM.buildAppIconSVG({ size: 180, bgColor: C.cream }),                sizes: [180] },
    { title: 'AVATAR · CREAM',          sub: 'profile placeholder',     slug: 'padelmatch-avatar-cream',     stage: 'light', build: () => PM.buildAvatarSVG({ size: 512, bgColor: C.cream }),                 sizes: [512, 256, 128] },
    { title: 'AVATAR · INK',            sub: 'profile · dark',          slug: 'padelmatch-avatar-ink',       stage: 'dark',  build: () => PM.buildAvatarSVG({ size: 512, bgColor: C.ink, onInk: true }),     sizes: [512, 256, 128] },
  ];
  const gridIcons = document.getElementById('grid-icons');
  iconCfgs.forEach(cfg => {
    const svg = cfg.build();
    const previewSVG = svg.replace(/width="\d+"\s+height="\d+"/, 'width="200" height="200"');
    const tile = document.createElement('div');
    tile.className = 'icon-tile';
    tile.innerHTML = `
      <div class="stage ${cfg.stage === 'dark' ? 'dark' : ''}">${previewSVG}</div>
      <div class="wm-meta">
        <span class="lbl">${cfg.title}</span>
        <span class="tag">${cfg.sub}</span>
      </div>
      <div class="actions">
        <button class="primary" data-action="icon-svg" data-slug="${cfg.slug}" data-idx="${iconCfgs.indexOf(cfg)}">↓ SVG</button>
        ${cfg.sizes.map(s => `<button data-action="icon-png" data-slug="${cfg.slug}" data-idx="${iconCfgs.indexOf(cfg)}" data-size="${s}">PNG @${s}</button>`).join('')}
      </div>
    `;
    gridIcons.appendChild(tile);
  });

  // OG cards
  const ogCfgs = [
    { title: 'OPEN GRAPH · CREAM', sub: 'twitter · facebook · 1200×630', slug: 'padelmatch-og-cream', onInk: false },
    { title: 'OPEN GRAPH · INK',   sub: 'dark variant · 1200×630',        slug: 'padelmatch-og-ink',   onInk: true  },
  ];
  const ogSection = document.getElementById('og-section');
  ogCfgs.forEach(og => {
    const tile = document.createElement('div');
    tile.className = 'og-tile';
    const html = PM.buildOGCardHTML({ width: 1200, height: 630, onInk: og.onInk });
    tile.innerHTML = `
      <div class="stage">
        <div style="transform: scale(0.42); transform-origin: center;">${html}</div>
      </div>
      <div class="wm-meta">
        <span class="lbl">${og.title}</span>
        <span class="tag">${og.sub}</span>
      </div>
      <div class="actions">
        <button class="primary" data-action="og-png" data-slug="${og.slug}" data-onink="${og.onInk}" data-size="1200">↓ PNG · 1200×630</button>
        <button data-action="og-png" data-slug="${og.slug}" data-onink="${og.onInk}" data-size="600">PNG · 600×315</button>
      </div>
    `;
    ogSection.appendChild(tile);
  });

  // ── 08 · PALETTE ──
  const paletteEl = document.getElementById('palette');
  PM.PALETTE.forEach(p => {
    const el = document.createElement('div');
    el.className = 'swatch';
    el.innerHTML = `
      <div class="chip" style="background:${p.hex}"></div>
      <div class="info">
        <div class="name">${p.name}</div>
        <div class="hex">${p.hex.toUpperCase()}</div>
        <div class="role">${p.role}</div>
      </div>
    `;
    el.addEventListener('click', async () => {
      await PM.copyText(p.hex.toUpperCase());
      PM.toast('COPIED ' + p.hex.toUpperCase());
    });
    paletteEl.appendChild(el);
  });

  // ── 09 · TYPOGRAPHY ──
  const typeEl = document.getElementById('typography');
  const TYPES = [
    {
      name: 'UNBOUNDED', role: 'Display / Headings',
      weights: ['400 — secondary headings, labels', '700 — section headings, card headers', '900 — rating numbers, hero text, CTAs'],
      demo: `
        <div style="font-family:var(--ub);font-size:64px;font-weight:900;color:var(--blue);letter-spacing:-0.04em;line-height:0.95;">7.2</div>
        <div style="font-family:var(--ub);font-size:20px;font-weight:700;color:var(--ink);letter-spacing:-0.03em;margin-top:6px;">NORTH GOA PADEL</div>
        <div style="font-family:var(--ub);font-size:14px;font-weight:400;color:var(--purple);letter-spacing:-0.01em;margin-top:4px;">Player Profile · Season 2026</div>
      `,
      bg: 'cream',
    },
    {
      name: 'DM SANS', role: 'Body / UI copy',
      weights: ['400 — body text, descriptions', '500 — labels, secondary headings', '600 — emphasis within body text'],
      demo: `
        <div style="font-family:var(--sans);font-size:16px;font-weight:600;color:var(--ink);line-height:1.4;">Be honest — this helps us match you accurately.</div>
        <div style="font-family:var(--sans);font-size:13px;color:var(--grey);line-height:1.65;margin-top:8px;">A game at your #1 venue just opened. Abhizer and David are already in. Two spots left.</div>
      `,
      bg: 'white',
    },
    {
      name: 'DM MONO', role: 'Scores · Ratings · Stats · Labels',
      weights: ['400 — secondary mono text, timestamps', '500 — scores, stat values, ratings'],
      demo: `
        <div style="font-family:var(--mono);font-size:24px;color:var(--ink);letter-spacing:0.05em;">6–2  4–6  7–5</div>
        <div style="font-family:var(--mono);font-size:13px;color:var(--grey);margin-top:6px;letter-spacing:0.12em;text-transform:uppercase;">Thu 22 May · 19:00–21:00</div>
        <div style="font-family:var(--mono);font-size:11px;color:var(--blue);margin-top:6px;letter-spacing:0.15em;text-transform:uppercase;">SECTION LABEL</div>
      `,
      bg: 'white',
    },
  ];
  TYPES.forEach(t => {
    const el = document.createElement('div');
    el.className = 'type-card';
    el.innerHTML = `
      <div class="th"><div class="name">${t.name}</div><div class="role">${t.role}</div></div>
      <div class="demo ${t.bg === 'white' ? 'white' : ''}">${t.demo}</div>
      <div class="weights">
        ${t.weights.map(w => `<div class="row">· ${w}</div>`).join('')}
      </div>
    `;
    typeEl.appendChild(el);
  });

  // ── 10 · ANIMATED ──
  document.getElementById('anim-ink').innerHTML =
    PM.buildAnimatedSVG({ onInk: true, bgColor: null, width: 360 }) +
    PM.buildAnimatedSVG({ onInk: true, bgColor: null, width: 180 });
  document.getElementById('anim-cream').innerHTML =
    PM.buildAnimatedSVG({ onInk: false, bgColor: null, width: 360 }) +
    PM.buildAnimatedSVG({ onInk: false, bgColor: null, width: 180 });

  document.getElementById('dl-anim-ink').addEventListener('click', (e) => {
    PM.downloadSVG('padelmatch-pulse-ink.svg', PM.buildAnimatedSVG({ onInk: true, bgColor: C.ink, width: 1024, includeXMLDecl: true }));
    PM.flashBtn(e.target, 'DOWNLOADED');
  });
  document.getElementById('dl-anim-cream').addEventListener('click', (e) => {
    PM.downloadSVG('padelmatch-pulse-cream.svg', PM.buildAnimatedSVG({ onInk: false, bgColor: C.cream, width: 1024, includeXMLDecl: true }));
    PM.flashBtn(e.target, 'DOWNLOADED');
  });
  document.getElementById('copy-anim-embed').addEventListener('click', async (e) => {
    await PM.copyText('<img src="padelmatch-pulse-ink.svg" alt="PadelMatch" width="240" />');
    PM.flashBtn(e.target, 'COPIED EMBED');
  });

  // ── 11 · BULK DOWNLOADS ──
  document.getElementById('dl-all-svg').addEventListener('click', async (e) => {
    const all = [
      ['padelmatch-mark-cream.svg',     PM.buildLogoSVG({ bgColor: C.cream, width: 512, includeXMLDecl: true })],
      ['padelmatch-mark-ink.svg',       PM.buildLogoSVG({ onInk: true, bgColor: C.ink, width: 512, includeXMLDecl: true })],
      ['padelmatch-mark-white.svg',     PM.buildLogoSVG({ bgColor: C.white, width: 512, includeXMLDecl: true })],
      ['padelmatch-P-cream.svg',        PM.buildLogoSVG({ showLetter: 'P', bgColor: C.cream, width: 512, includeXMLDecl: true })],
      ['padelmatch-P-ink.svg',          PM.buildLogoSVG({ showLetter: 'P', onInk: true, bgColor: C.ink, width: 512, includeXMLDecl: true })],
      ['padelmatch-M-cream.svg',        PM.buildLogoSVG({ showLetter: 'M', bgColor: C.cream, width: 512, includeXMLDecl: true })],
      ['padelmatch-M-ink.svg',          PM.buildLogoSVG({ showLetter: 'M', onInk: true, bgColor: C.ink, width: 512, includeXMLDecl: true })],
      ['padelmatch-favicon-48.svg',     PM.buildFaviconSVG({ size: 48, includeXMLDecl: true })],
      ['padelmatch-appicon-cream.svg',  PM.buildAppIconSVG({ size: 1024, bgColor: C.cream, includeXMLDecl: true })],
      ['padelmatch-appicon-lime.svg',   PM.buildAppIconSVG({ size: 1024, bgColor: C.lime, cellFills: { TL: C.ink, BR: C.blue }, includeXMLDecl: true })],
      ['padelmatch-appicon-ink.svg',    PM.buildAppIconSVG({ size: 1024, bgColor: C.ink, onInk: true, includeXMLDecl: true })],
      ['padelmatch-avatar-cream.svg',   PM.buildAvatarSVG({ size: 512, bgColor: C.cream, includeXMLDecl: true })],
      ['padelmatch-pulse-ink.svg',      PM.buildAnimatedSVG({ onInk: true, bgColor: C.ink, width: 1024, includeXMLDecl: true })],
      ['padelmatch-pulse-cream.svg',    PM.buildAnimatedSVG({ onInk: false, bgColor: C.cream, width: 1024, includeXMLDecl: true })],
    ];
    PM.toast(`DOWNLOADING ${all.length} SVGs…`);
    for (const [name, svg] of all) {
      PM.downloadSVG(name, svg);
      await new Promise(r => setTimeout(r, 220));
    }
    PM.flashBtn(e.target, 'COMPLETE');
  });

  document.getElementById('dl-all-png').addEventListener('click', async (e) => {
    e.target.textContent = '… EXPORTING';
    const variants = [
      { slug: 'padelmatch-mark-cream', opts: { bgColor: C.cream } },
      { slug: 'padelmatch-mark-ink',   opts: { onInk: true, bgColor: C.ink } },
      { slug: 'padelmatch-P-cream',    opts: { showLetter: 'P', bgColor: C.cream } },
      { slug: 'padelmatch-M-cream',    opts: { showLetter: 'M', bgColor: C.cream } },
    ];
    for (const v of variants) {
      for (const size of [256, 512, 1024]) {
        await PM.downloadPNG(`${v.slug}@${size}.png`, PM.buildLogoSVG({ ...v.opts, width: size }), size);
        await new Promise(r => setTimeout(r, 200));
      }
    }
    PM.flashBtn(e.target, 'COMPLETE');
  });

  document.getElementById('dl-all-icons').addEventListener('click', async (e) => {
    e.target.textContent = '… EXPORTING';
    const out = [
      { name: 'padelmatch-favicon-16.png',         build: () => PM.buildFaviconSVG({ size: 48, bgColor: C.cream }), size: 16 },
      { name: 'padelmatch-favicon-32.png',         build: () => PM.buildFaviconSVG({ size: 48, bgColor: C.cream }), size: 32 },
      { name: 'padelmatch-favicon-48.png',         build: () => PM.buildFaviconSVG({ size: 48, bgColor: C.cream }), size: 48 },
      { name: 'padelmatch-appicon-cream-1024.png', build: () => PM.buildAppIconSVG({ size: 1024, bgColor: C.cream }), size: 1024 },
      { name: 'padelmatch-appicon-lime-1024.png',  build: () => PM.buildAppIconSVG({ size: 1024, bgColor: C.lime, cellFills: { TL: C.ink, BR: C.blue } }), size: 1024 },
      { name: 'padelmatch-appicon-ink-1024.png',   build: () => PM.buildAppIconSVG({ size: 1024, bgColor: C.ink, onInk: true }), size: 1024 },
      { name: 'padelmatch-appletouch-180.png',     build: () => PM.buildAppIconSVG({ size: 180, bgColor: C.cream }), size: 180 },
      { name: 'padelmatch-avatar-cream-512.png',   build: () => PM.buildAvatarSVG({ size: 512, bgColor: C.cream }), size: 512 },
      { name: 'padelmatch-avatar-ink-512.png',     build: () => PM.buildAvatarSVG({ size: 512, bgColor: C.ink, onInk: true }), size: 512 },
    ];
    for (const item of out) {
      await PM.downloadPNG(item.name, item.build(), item.size, item.size);
      await new Promise(r => setTimeout(r, 200));
    }
    for (const onInk of [false, true]) {
      const blob = await PM.renderLockupPNG({
        caseId: 'pm-single', weightId: 'w900', specialId: 'clean', padelColor: 'ink',
        cellFills: { TL: C.blue, BR: C.lime }, onInk, showTagline: true,
        tagline: 'Find the perfect match.',
      }, 1200, 630, onInk ? C.ink : C.cream);
      PM.downloadBlob(blob, `padelmatch-og-${onInk ? 'ink' : 'cream'}-1200x630.png`);
      await new Promise(r => setTimeout(r, 200));
    }
    PM.flashBtn(e.target, 'COMPLETE');
  });

  document.getElementById('dl-tokens').addEventListener('click', async (e) => {
    const tokens = {
      colors: Object.fromEntries(PM.PALETTE.map(p => [p.name.toLowerCase(), p.hex])),
      fonts: PM.FONTS,
      logo: {
        viewBox: `${PM.VIEWBOX.x} ${PM.VIEWBOX.y} ${PM.VIEWBOX.w} ${PM.VIEWBOX.h}`,
        aspect: PM.ASPECT,
        cells: PM.CELLS,
        net: PM.NET,
        defaultCells: PM.DEFAULT_CELLS,
        letters: { P: PM.P_RECTS, M: PM.M_RECTS },
        courtPath: PM.COURT_PATH,
      },
    };
    const json = JSON.stringify(tokens, null, 2);
    const cssVars = `:root {\n${PM.PALETTE.map(p => `  --${p.name.toLowerCase()}: ${p.hex};`).join('\n')}\n  --font-display: ${PM.FONTS.display};\n  --font-body: ${PM.FONTS.body};\n  --font-mono: ${PM.FONTS.mono};\n}`;
    PM.downloadBlob(new Blob([json], { type: 'application/json' }), 'padelmatch-tokens.json');
    await new Promise(r => setTimeout(r, 200));
    PM.downloadBlob(new Blob([cssVars], { type: 'text/css' }), 'padelmatch-tokens.css');
    PM.flashBtn(e.target, 'DOWNLOADED');
  });

  // ── ASSET CARD BUILDER (Section 01) ──
  function makeAssetCard({ title, sub, slug, bg, opts, sizes = [256, 512, 1024] }) {
    const card = document.createElement('div');
    card.className = 'card';
    const previewSVG = PM.buildLogoSVG({ ...opts, width: 280 }).replace(/width="\d+" height="\d+"/, 'width="280"');
    card.innerHTML = `
      <div class="head">
        <span class="ttl">${title}</span>
        <span class="sub">${sub}</span>
      </div>
      <div class="preview bg-${bg}">${previewSVG}</div>
      <div class="actions">
        <button class="primary" data-action="card-svg">↓ SVG</button>
        ${sizes.map(s => `<button data-action="card-png" data-size="${s}">PNG @${s}</button>`).join('')}
        <button data-action="card-copy">COPY</button>
      </div>
    `;
    card.querySelectorAll('button[data-action]').forEach(btn => {
      const originalText = btn.textContent;
      btn.addEventListener('click', async () => {
        const a = btn.dataset.action;
        try {
          if (a === 'card-svg') {
            PM.downloadSVG(`${slug}.svg`, PM.buildLogoSVG({ ...opts, includeXMLDecl: true }));
            PM.flashBtn(btn, 'DOWNLOADED');
          } else if (a === 'card-png') {
            const s = +btn.dataset.size;
            btn.textContent = '…';
            await PM.downloadPNG(`${slug}@${s}.png`, PM.buildLogoSVG({ ...opts, width: s }), s);
            btn.textContent = originalText;
            PM.flashBtn(btn, 'DOWNLOADED');
          } else if (a === 'card-copy') {
            await PM.copyText(PM.buildLogoSVG({ ...opts, includeXMLDecl: true }));
            PM.flashBtn(btn, 'COPIED');
          }
        } catch (err) {
          console.error('[card] download failed', err);
          btn.textContent = originalText;
          PM.flashBtn(btn, 'FAILED', '#FF4136');
        }
      });
    });
    return card;
  }

  // ── GLOBAL CLICK HANDLER ──
  document.body.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const a = btn.dataset.action;
    const originalText = btn.dataset.origText || btn.textContent;
    btn.dataset.origText = originalText;
    const fail = (err) => {
      console.error('[' + a + '] download failed', err);
      btn.textContent = originalText;
      PM.flashBtn(btn, 'FAILED', '#FF4136');
    };

    if (a === 'png' && btn.dataset.wm) {
      try {
        const wm = JSON.parse(btn.dataset.wm);
        const slug = btn.dataset.slug;
        const size = +btn.dataset.size;
        btn.textContent = '…';
        const w = size; const h = Math.round(size * 0.33);
        const blob = await PM.renderWordmarkPNG(wm, w, h, C.cream);
        PM.downloadBlob(blob, `${slug}@${size}.png`);
        btn.textContent = originalText;
        PM.flashBtn(btn, 'DOWNLOADED');
      } catch (err) { fail(err); }
      return;
    }

    if (a === 'copy-html' && btn.dataset.wm) {
      try {
        const wm = JSON.parse(btn.dataset.wm);
        const html = PM.buildWordmarkHTML(wm);
        await PM.copyText(html);
        PM.flashBtn(btn, 'COPIED');
      } catch (err) { fail(err); }
      return;
    }

    if (a === 'lockup-png' && btn.dataset.cfg) {
      try {
        const cfg = JSON.parse(btn.dataset.cfg);
        const size = +btn.dataset.size;
        btn.textContent = '…';
        const w = size; const h = Math.round(size * (cfg.lockupOpts.showTagline ? 0.42 : 0.32));
        const bg = cfg.bg === 'ink' ? C.ink : C.cream;
        const blob = await PM.renderLockupPNG(cfg.lockupOpts, w, h, bg);
        PM.downloadBlob(blob, `${cfg.slug}@${size}.png`);
        btn.textContent = originalText;
        PM.flashBtn(btn, 'DOWNLOADED');
      } catch (err) { fail(err); }
      return;
    }
    if (a === 'lockup-copy-html' && btn.dataset.cfg) {
      try {
        const cfg = JSON.parse(btn.dataset.cfg);
        await PM.copyText(PM.buildLockupHTML(cfg.lockupOpts));
        PM.flashBtn(btn, 'COPIED');
      } catch (err) { fail(err); }
      return;
    }

    if (a === 'icon-svg' && btn.dataset.slug) {
      try {
        const idx = +btn.dataset.idx;
        const cfg = iconCfgs[idx];
        const svg = cfg.build().replace(/<svg /, '<?xml version="1.0" encoding="UTF-8"?>\n<svg ');
        PM.downloadSVG(`${cfg.slug}.svg`, svg);
        PM.flashBtn(btn, 'DOWNLOADED');
      } catch (err) { fail(err); }
      return;
    }
    if (a === 'icon-png' && btn.dataset.slug) {
      try {
        const idx = +btn.dataset.idx;
        const size = +btn.dataset.size;
        const cfg = iconCfgs[idx];
        btn.textContent = '…';
        await PM.downloadPNG(`${cfg.slug}@${size}.png`, cfg.build(), size, size);
        btn.textContent = originalText;
        PM.flashBtn(btn, 'DOWNLOADED');
      } catch (err) { fail(err); }
      return;
    }

    if (a === 'og-png' && btn.dataset.slug) {
      try {
        const onInk = btn.dataset.onink === 'true';
        const size = +btn.dataset.size;
        const w = size; const h = Math.round(size * 630 / 1200);
        btn.textContent = '…';
        const bg = onInk ? C.ink : C.cream;
        const blob = await PM.renderLockupPNG({
          caseId: 'pm-single', weightId: 'w900', specialId: 'clean', padelColor: 'ink',
          cellFills: { TL: C.blue, BR: C.lime }, onInk, showTagline: true,
          tagline: 'Find the perfect match.',
        }, w, h, bg);
        PM.downloadBlob(blob, `${btn.dataset.slug}-${w}x${h}.png`);
        btn.textContent = originalText;
        PM.flashBtn(btn, 'DOWNLOADED');
      } catch (err) { fail(err); }
      return;
    }
  });

})(window.PM);
