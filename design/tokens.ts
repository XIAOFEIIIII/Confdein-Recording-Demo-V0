/**
 * 设计 Token 单一数据源
 * - tokens：当前生效主题
 * - 通过 injectDesignTokens() 注入为 CSS 变量
 *
 * Typography source: https://www.figma.com/design/8UZRNJDZKtP79N3uCR4lC2 (node 1:51)
 * Color source:      https://www.figma.com/design/8UZRNJDZKtP79N3uCR4lC2 (node 3:70)
 * Fonts: Anthropic Sans (sans) + Anthropic Mono (mono)
 */

// ─── Typography (Figma: node 1:51) ────────────────────────────────────────────
const typography = {
  fontFamily: {
    sans: "'Anthropic Sans', sans-serif",
    mono: "'Anthropic Mono', monospace",
  },
  fontWeight: {
    normal:   '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
  },
  // Body / UI text sizes
  textSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    md: '1rem',       // 16px
    lg: '1.125rem',   // 18px
  },
  textLineHeight: {
    xs: '1.4',
    sm: '1.4',
    md: '1.4',
    lg: '1.389',
  },
  // Heading sizes
  headingSize: {
    xs:    '0.75rem',   // 12px
    sm:    '0.875rem',  // 14px
    md:    '1rem',      // 16px
    lg:    '1.25rem',   // 20px
    xl:    '1.5rem',    // 24px
    '2xl': '1.75rem',   // 28px
    '3xl': '2.25rem',   // 36px
  },
  headingLineHeight: {
    xs:    '1.4',
    sm:    '1.4',
    md:    '1.4',
    lg:    '1.25',
    xl:    '1.25',
    '2xl': '1.1',
    '3xl': '1',
  },
} as const;

// ─── Colors (Figma: node 3:70) ────────────────────────────────────────────────
const colors = {
  // Background / Surface
  bgPrimary:    '#ffffff',    // Background/Primary   — white (cards, inputs)
  bgSecondary:  '#f5f4ed',    // Background/Secondary — panels, sidebars
  bgTertiary:   '#faf9f5',    // Background/Tertiary  — page background
  bgInverse:    '#141413',    // Background/Inverse   — dark surfaces
  bgGhost:      'transparent',

  // Background / Semantic
  bgInfo:       '#d6e4f6',
  bgDanger:     '#b53333',
  bgSuccess:    '#e9f1dc',
  bgWarning:    '#f6eedf',
  bgDisabled:   '#ffffff80',  // 50% white

  // Text / Surface
  textPrimary:   '#141413',   // Text/Primary
  textSecondary: '#3d3d3a',   // Text/Secondary
  textTertiary:  '#73726c',   // Text/Tertiary
  textInverse:   '#ffffff',   // Text/Inverse
  textGhost:     '#73726c80', // 50% tertiary

  // Text / Semantic
  textInfo:    '#3266ad',
  textDanger:  '#7f2c28',
  textSuccess: '#265b19',
  textWarning: '#5a4815',

  // Border / Surface
  borderPrimary:   '#1f1e1d66',  // Border/Primary   — 40% opacity
  borderSecondary: '#1f1e1d4d',  // Border/Secondary — 30% opacity
  borderTertiary:  '#1f1e1d26',  // Border/Tertiary  — 15% opacity
  borderInverse:   '#ffffff4d',  // Border/Inverse   — 30% white
  borderGhost:     '#1f1e1d00',  // transparent
  borderDisabled:  '#1f1e1d1a',  // 10% opacity

  // Border / Semantic
  borderInfo:    '#4682d5',
  borderDanger:  '#a73d39',
  borderSuccess: '#437426',
  borderWarning: '#805c1f',

  // Ring / Surface
  ringPrimary:   '#141413b2',  // Ring/Primary   — 70% opacity
  ringSecondary: '#3d3d3ab2',  // Ring/Secondary — 70% opacity
  ringInverse:   '#ffffffb2',  // Ring/Inverse   — 70% white

  // Ring / Semantic
  ringInfo:    '#3266ad80',  // 50% opacity
  ringDanger:  '#a73d3980',
  ringSuccess: '#43742680',
  ringWarning: '#805c1f80',
} as const;

// ─── Spacing / Radius / Shadow ────────────────────────────────────────────────
const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  11: '44px',
  12: '48px',
} as const;

const radius = {
  sm:    '8px',
  md:    '12px',
  lg:    '16px',
  xl:    '20px',
  '2xl': '24px',
  full:  '9999px',
} as const;

const shadow = {
  nav:       '0 12px 40px rgba(0, 0, 0, 0.06)',
  navActive: '0 18px 60px rgba(0, 0, 0, 0.08)',
  soft:      '0 4px 16px rgba(0, 0, 0, 0.04)',
} as const;

// ─── Token export ─────────────────────────────────────────────────────────────
export const tokens = { colors, typography, spacing, radius, shadow } as const;

export type DesignTokens = typeof tokens;

/**
 * Injects all design tokens as CSS custom properties on :root.
 *
 * Color variables follow Figma naming:
 *   --color-bg-primary, --color-text-primary, --color-border-primary, --color-ring-primary, …
 *
 * Backward-compat aliases (used by existing CSS):
 *   --color-ink, --color-paper, --color-surface, --color-selection-bg / -fg, …
 */
export function injectDesignTokens(): void {
  const root = document.documentElement;
  const c = tokens.colors;

  // ── Color variables ────────────────────────────────────────────────────────
  // Inject every color token as --color-<camelCase-to-kebab>
  Object.entries(c).forEach(([key, value]) => {
    const varName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(varName, value);
  });

  // ── Backward-compat aliases ────────────────────────────────────────────────
  root.style.setProperty('--color-ink',           c.textPrimary);
  root.style.setProperty('--color-paper',         c.bgTertiary);
  root.style.setProperty('--color-surface',       c.bgSecondary);
  root.style.setProperty('--color-surface-active',c.bgPrimary);
  root.style.setProperty('--color-border-subtle', c.borderTertiary);
  root.style.setProperty('--color-border-warm',   c.borderSecondary);
  root.style.setProperty('--color-border-input',  c.borderPrimary);
  root.style.setProperty('--color-accent',        c.textPrimary);
  root.style.setProperty('--color-accent-contrast',c.textInverse);
  root.style.setProperty('--color-selection-bg',  c.bgInverse);
  root.style.setProperty('--color-selection-fg',  c.textInverse);

  // ── Typography ─────────────────────────────────────────────────────────────
  const t = tokens.typography;
  Object.entries(t.fontFamily).forEach(([k, v]) =>
    root.style.setProperty(`--font-${k}`, v));
  Object.entries(t.fontWeight).forEach(([k, v]) =>
    root.style.setProperty(`--font-weight-${k}`, v));
  Object.entries(t.textSize).forEach(([k, v]) =>
    root.style.setProperty(`--size-text-${k}`, v));
  Object.entries(t.textLineHeight).forEach(([k, v]) =>
    root.style.setProperty(`--line-height-text-${k}`, v));
  Object.entries(t.headingSize).forEach(([k, v]) =>
    root.style.setProperty(`--size-heading-${k}`, v));
  Object.entries(t.headingLineHeight).forEach(([k, v]) =>
    root.style.setProperty(`--line-height-heading-${k}`, v));

  // ── Spacing / Radius / Shadow ──────────────────────────────────────────────
  Object.entries(tokens.spacing).forEach(([k, v]) =>
    root.style.setProperty(`--spacing-${k}`, v));
  Object.entries(tokens.radius).forEach(([k, v]) =>
    root.style.setProperty(`--radius-${k}`, v));
  Object.entries(tokens.shadow).forEach(([k, v]) =>
    root.style.setProperty(`--shadow-${k}`, v));
}
