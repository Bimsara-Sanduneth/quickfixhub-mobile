/**
 * Design tokens ported from the "Modernist" design system (see the design handoff bundle):
 * a light ground with a single red accent, zero border radius, 2px rule dividers, and Archivo
 * throughout. Values are copied 1:1 from the design system's styles.css `:root` block; the dark
 * variant matches the inline overrides the dark-mode screens (2a, 2e, 2u-2y) declare locally.
 *
 * `background`/`backgroundElement`/`backgroundSelected`/`textSecondary` are kept as aliases of
 * `bg`/`surface`/`neutral300`(ish)/`neutral700` so screens built before this redesign keep
 * compiling and theming correctly without changes.
 */

import '@/global.css';

export const Colors = {
  light: {
    bg: '#f3f2f2',
    surface: '#eae9e9',
    text: '#201e1d',
    accent: '#ec3013',
    accent100: '#fff2ef',
    accent600: '#dd2b0f',
    accent700: '#ae1800',
    accent800: '#7c1405',
    divider: 'rgba(32,30,29,0.4)',
    neutral100: '#f8f4f4',
    neutral200: '#eae7e7',
    neutral300: '#d7d3d3',
    neutral400: '#bab6b6',
    neutral500: '#9b9797',
    neutral600: '#7d7979',
    neutral700: '#605d5d',
    neutral800: '#444141',
    neutral900: '#2d2b2b',
    // legacy aliases
    background: '#f3f2f2',
    backgroundElement: '#eae9e9',
    backgroundSelected: '#d7d3d3',
    textSecondary: '#605d5d',
  },
  dark: {
    bg: '#201e1d',
    surface: '#2d2b2b',
    text: '#f3f2f2',
    // The dark screens bump the accent lighter/more saturated for contrast against the dark
    // ground, and invert which end of the ramp reads as "emphasis" (700 lightens, not darkens).
    accent: '#ff563c',
    accent100: '#4d170e',
    accent600: '#dd2b0f',
    accent700: '#ff9783',
    accent800: '#ffc4b8',
    divider: 'rgba(243,242,242,0.28)',
    neutral100: '#2d2b2b',
    neutral200: '#444141',
    neutral300: '#605d5d',
    neutral400: '#7d7979',
    neutral500: '#9b9797',
    neutral600: '#bab6b6',
    neutral700: '#d7d3d3',
    neutral800: '#eae7e7',
    neutral900: '#f8f4f4',
    background: '#201e1d',
    backgroundElement: '#2d2b2b',
    backgroundSelected: '#444141',
    textSecondary: '#bab6b6',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = {
  regular: 'Archivo_400Regular',
  semiBold: 'Archivo_600SemiBold',
  extraBold: 'Archivo_800ExtraBold',
  mono: 'ui-monospace',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

// The design system's own --space-* scale, kept separate from the legacy Spacing scale above
// since the two don't share values and Group A screens are ported pixel-for-pixel from CSS.
export const Space = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 } as const;

export const MaxContentWidth = 800;
