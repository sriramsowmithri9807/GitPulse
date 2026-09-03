// Cross-multiply patterns × effects into named forms and resolve a name back to
// its pattern + effect pair, with a safe fallback for unknown names.

import { PATTERNS, PATTERN_NAMES } from './patterns.js';
import { EFFECTS, EFFECT_NAMES } from './effects.js';

const SEP = '--';

/** Every valid form name, e.g. "radial-center--pulse-glow". */
export const CATALOG = PATTERN_NAMES.flatMap((p) => EFFECT_NAMES.map((e) => `${p}${SEP}${e}`));

export const FALLBACK = `${PATTERN_NAMES[0]}${SEP}${EFFECT_NAMES[0]}`;

/**
 * Resolve a form name into its concrete pieces. An unrecognized name warns and
 * falls back rather than throwing.
 *
 * @param {string} name
 * @returns {{name:string, patternName:string, effectName:string, pattern:Function, effect:Function}}
 */
export function resolveAnimation(name) {
  let resolved = name;
  if (!CATALOG.includes(name)) {
    if (name) {
      console.warn(`[warn] Unknown animation "${name}". Falling back to "${FALLBACK}". Run --list-animations for valid names.`);
    }
    resolved = FALLBACK;
  }
  const idx = resolved.indexOf(SEP);
  const patternName = resolved.slice(0, idx);
  const effectName = resolved.slice(idx + SEP.length);
  return {
    name: resolved,
    patternName,
    effectName,
    pattern: PATTERNS[patternName],
    effect: EFFECTS[effectName],
  };
}

export function listAnimations() {
  return [...CATALOG];
}
