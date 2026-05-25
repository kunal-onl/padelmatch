# PadelMatch Brand Kit · v1.0

Drop-in design system for PadelMatch. Built for **Claude Code** and **emergent.sh** — every file is self-contained and zero-dep (except React peer for `.jsx`).

## Quick start

```bash
# 1. Copy these files into your project (suggested layout):
src/styles/tokens.css          # ← CSS custom properties
src/styles/containers.css      # ← .pm-card-* classes
src/styles/textures.css        # ← .pm-texture-* classes
src/lib/tokens.js              # ← T and F token objects
src/lib/logo-geometry.js       # ← source-of-truth mark geometry
src/components/Logo.jsx        # ← Logo + Lockup components
src/components/Containers.jsx  # ← ContainerA-F + NetDivider
src/components/Textures.jsx    # ← TX background generators

# 2. Import the CSS once at app root:
import './styles/tokens.css';
import './styles/containers.css';
import './styles/textures.css';

# 3. Load fonts (in <head>):
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```

## Files

| File | Purpose |
|---|---|
| `tokens.css` | All CSS custom properties — colours, strokes, spacing, opacities |
| `tokens.js` | Same tokens as a JS object (`T`, `F`) for React/JSX use |
| `containers.css` | Class-based implementations of Type A–F containers |
| `textures.css` | Five padel-derived background textures (perforations, court lines, glass panels, wire fence) |
| `logo-geometry.js` | The mark as data — cells, court path, net — so you can render it without an SVG file |
| `Logo.jsx` | React `<Logo>` + `<Lockup>` components |
| `Containers.jsx` | React `<ContainerA>` through `<ContainerF>` + `<NetDivider>` |
| `Textures.jsx` | React `TX` helper that returns inline-style objects |

## Design system summary

**Sport Brutalism.** Bold, unsentimental, typographic. Treats data like a scoreboard.

- **Colours:** Lime #C9E52F (primary), Blue #1A56FF (secondary), Purple #6E28D9 (tertiary), Ink #111118, Cream #F5F2E8, Coral #FF4136 (error only)
- **Type:** Unbounded (display), DM Sans (body), DM Mono (scores/stats)
- **Strokes:** 1px internal · 2px default · 3px primary structural
- **Containers:** Six types (A-F) — each maps to a semantic context
- **Textures:** All derived from the physical padel court at 4–8% opacity

See the full Brand Kit HTML reference for usage rules, examples, and quick-reference decision rules.

## Decision rules

| Question | Answer |
|---|---|
| Is this interactive? | Type A (3px border) or D (top band). Dashed if awaiting input → F. |
| Read-only information? | Type B (corner marks). |
| Status / notification? | Type C — left accent in semantic colour. |
| In-progress / incomplete? | Type E — open-sided. |
| Stroke weight? | 1px = internal rows. 2px = default. 3px = primary, one per cluster. |
| Top accent meaning? | The *category* of card content. |
| Left accent meaning? | The *status / state* right now. |
| When do I use coral? | Errors, unavailable, losses. Never decoratively. |

## License

Internal use for PadelMatch. Not for public distribution without permission.
