// ═══════════════════════════════════════════════════════════════════
//  PADELMATCH BRAND KIT — TEXTURE HELPERS
//
//  Generators that return inline-style objects. Use directly:
//    <div style={{ ...TX.perforations(), height: 200 }} />
//    <div style={TX.courtLines(0.05, T.lime)} />
//
//  Or use the class-based versions from /styles/textures.css:
//    <div className="pm-texture-perforations" />
// ═══════════════════════════════════════════════════════════════════

import { T } from './tokens';

const _hex = (opacity) =>
  Math.round(opacity * 255).toString(16).padStart(2, '0');

export const TX = {
  perforations: (opacity = T.txStandard, color = T.ink) => ({
    backgroundImage: `radial-gradient(circle, ${color}${_hex(opacity)} 1.5px, transparent 1.5px)`,
    backgroundSize: '14px 14px',
  }),
  courtLines: (opacity = T.txStandard, color = T.ink) => ({
    backgroundImage: [
      `repeating-linear-gradient(0deg, transparent, transparent 29px, ${color}${_hex(opacity)} 30px)`,
      `repeating-linear-gradient(90deg, transparent, transparent 59px, ${color}${_hex(opacity)} 60px)`,
    ].join(', '),
  }),
  glassPanels: (opacity = T.txStandard, color = T.ink) => ({
    backgroundImage: [
      `repeating-linear-gradient(0deg, transparent, transparent 43px, ${color}${_hex(opacity)} 44px)`,
      `repeating-linear-gradient(90deg, transparent, transparent 87px, ${color}${_hex(opacity)} 88px)`,
    ].join(', '),
  }),
  wireFence: (opacity = T.txStandard, color = T.ink) => ({
    backgroundImage: [
      `repeating-linear-gradient(45deg, ${color}${_hex(opacity)} 0, ${color}${_hex(opacity)} 1px, transparent 0, transparent 50%)`,
      `repeating-linear-gradient(-45deg, ${color}${_hex(opacity)} 0, ${color}${_hex(opacity)} 1px, transparent 0, transparent 50%)`,
    ].join(', '),
    backgroundSize: '10px 10px',
  }),
};
