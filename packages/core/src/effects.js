// Visual effects: each takes { turn, win, target, empty, accent, levels } and
// returns an ordered list of [percentStop, cssDeclarations] pairs describing a
// single cell's @keyframes timeline — deciding HOW a cell looks at its turn.
//
//   turn   percent (0..100) where this cell activates in the shared loop
//   win    percent width of the action window
//   target the cell's own settled color (its contribution tier)
//   empty  the empty-cell color
//   accent a bright highlight color
//   levels the 5 tier colors [l0..l4]
//
// Only fill / opacity / transform are animated — no script, no SMIL.

export const EFFECTS = {
  reveal: (o) => [
    [0, `fill:${o.empty};opacity:1`],
    [o.turn, `fill:${o.empty};opacity:1`],
    [o.turn + o.win, `fill:${o.target};opacity:1`],
    [100, `fill:${o.target};opacity:1`],
  ],

  'pulse-glow': (o) => [
    [0, `fill:${o.target};opacity:0;transform:scale(.6)`],
    [o.turn, `fill:${o.accent};opacity:0;transform:scale(.6)`],
    [o.turn + o.win * 0.4, `fill:${o.accent};opacity:1;transform:scale(1.35)`],
    [o.turn + o.win, `fill:${o.target};opacity:1;transform:scale(1)`],
    [100, `fill:${o.target};opacity:1;transform:scale(1)`],
  ],

  flicker: (o) => [
    [0, `fill:${o.empty};opacity:1`],
    [o.turn, `fill:${o.levels[1]};opacity:1`],
    [o.turn + o.win * 0.15, `fill:${o.levels[3]}`],
    [o.turn + o.win * 0.3, `fill:${o.levels[2]}`],
    [o.turn + o.win * 0.45, `fill:${o.levels[4]}`],
    [o.turn + o.win * 0.6, `fill:${o.levels[1]}`],
    [o.turn + o.win * 0.8, `fill:${o.levels[3]}`],
    [o.turn + o.win, `fill:${o.target}`],
    [100, `fill:${o.target}`],
  ],

  'color-flip': (o) => [
    [0, `fill:${o.empty};opacity:1`],
    [o.turn, `fill:${o.accent}`],
    [o.turn + o.win * 0.33, `fill:${o.target}`],
    [o.turn + o.win * 0.5, `fill:${o.accent}`],
    [o.turn + o.win * 0.75, `fill:${o.target}`],
    [100, `fill:${o.target}`],
  ],

  'drop-bounce': (o) => [
    [0, `fill:${o.target};opacity:0;transform:translateY(-7px)`],
    [o.turn, `fill:${o.target};opacity:0;transform:translateY(-7px)`],
    [o.turn + o.win * 0.5, `opacity:1;transform:translateY(2px)`],
    [o.turn + o.win * 0.75, `transform:translateY(-1px)`],
    [o.turn + o.win, `opacity:1;transform:translateY(0)`],
    [100, `opacity:1;transform:translateY(0)`],
  ],

  'double-blink': (o) => [
    [0, `fill:${o.target};opacity:0`],
    [o.turn, `opacity:0`],
    [o.turn + o.win * 0.2, `opacity:1`],
    [o.turn + o.win * 0.4, `opacity:0`],
    [o.turn + o.win * 0.6, `opacity:1`],
    [o.turn + o.win * 0.8, `opacity:0`],
    [o.turn + o.win, `opacity:1`],
    [100, `fill:${o.target};opacity:1`],
  ],

  twinkle: (o) => [
    [0, `fill:${o.target};opacity:0`],
    [o.turn, `opacity:.1`],
    [o.turn + o.win * 0.15, `opacity:.9`],
    [o.turn + o.win * 0.3, `opacity:.35`],
    [o.turn + o.win * 0.45, `opacity:1`],
    [o.turn + o.win * 0.6, `opacity:.5`],
    [o.turn + o.win * 0.8, `opacity:.85`],
    [o.turn + o.win, `opacity:1`],
    [100, `fill:${o.target};opacity:1`],
  ],

  'grow-in': (o) => [
    [0, `fill:${o.target};opacity:0;transform:scale(0)`],
    [o.turn, `fill:${o.target};opacity:0;transform:scale(0)`],
    [o.turn + o.win * 0.6, `opacity:1;transform:scale(1.25)`],
    [o.turn + o.win * 0.85, `transform:scale(.95)`],
    [o.turn + o.win, `opacity:1;transform:scale(1)`],
    [100, `opacity:1;transform:scale(1)`],
  ],

  'slide-in': (o) => [
    [0, `fill:${o.target};opacity:0;transform:translateX(-9px)`],
    [o.turn, `fill:${o.target};opacity:0;transform:translateX(-9px)`],
    [o.turn + o.win * 0.7, `opacity:1;transform:translateX(1px)`],
    [o.turn + o.win, `opacity:1;transform:translateX(0)`],
    [100, `opacity:1;transform:translateX(0)`],
  ],

  'flash-accent': (o) => [
    [0, `fill:${o.empty};opacity:1`],
    [o.turn, `fill:${o.empty};opacity:1`],
    [o.turn + o.win * 0.15, `fill:${o.accent};opacity:1`],
    [o.turn + o.win * 0.5, `fill:${o.accent}`],
    [o.turn + o.win, `fill:${o.target}`],
    [100, `fill:${o.target};opacity:1`],
  ],
};

export const EFFECT_NAMES = Object.keys(EFFECTS);

export const EFFECT_DESCRIPTIONS = {
  reveal: 'Plain crossfade from the empty color to the cell color.',
  'pulse-glow': 'Scales up with a bright accent glow, then settles to size and color.',
  flicker: 'Rapid strobe through every theme tier before locking to the real color.',
  'color-flip': 'Two accent/colour flashes before settling.',
  'drop-bounce': 'Drops in from above with a slight overshoot bounce.',
  'double-blink': 'Two opacity blinks before staying lit.',
  twinkle: 'Irregular opacity flutter, like a star, before steadying.',
  'grow-in': 'Pops from zero scale with an overshoot.',
  'slide-in': 'Slides in horizontally from the left edge of its cell.',
  'flash-accent': 'One brief bright accent flash, then settles to the real color.',
};
