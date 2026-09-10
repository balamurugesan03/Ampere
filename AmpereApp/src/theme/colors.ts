// Design tokens ported 1:1 from the prototype's CSS custom properties.
// Different screens in the prototype declare slightly different values
// (some with alpha channels baked into the hex), so screen-specific
// variants are included here rather than collapsed into one palette.
export const colors = {
  bg: '#090b09',
  text: '#ffffff',
  muted: '#8c928d',
  placeholder: '#5c625d',
  green: '#3ecf5b',
  greenDark: '#28a648',
  red: '#e5384d',
  strike: '#5c625d',
  border: '#282c28',
  settingsBorder: '#22261f', // settings screen overrides --border
  field: '#151815', // signin / home
  fieldAlpha: '#14181450', // categories / product field
  card: '#121512', // signin (unused visually but kept for parity)
  cardAlpha: '#14181450', // home / checkout / payment / profile card
  cardAlpha2: '#161a1650', // categories / product card

  // Additive premium-polish tokens (visual only, nothing above was removed/renamed).
  cardElevated: '#171b17', // solid elevated surface, used with shadows for depth
  borderSoft: '#22261f',
  warning: '#f2c14e',
  glowGreen: 'rgba(62,207,91,0.28)',
  greenGradient: ['#3ecf5b', '#28a648'] as [string, string],
  greenGradientDeep: ['#2a8f4c', '#0f3d22'] as [string, string],
} as const;

export type ColorToken = keyof typeof colors;
