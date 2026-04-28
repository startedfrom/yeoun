import { Platform } from 'react-native';

const palette = {
  lavender50: '#F9F5FF',
  lavender100: '#F3EEFF',
  lavender200: '#E6D9FF',
  lavender300: '#D3BFFF',
  lavender400: '#B995FF',
  lavender500: '#9A6DFF',
  pink100: '#FFF0F6',
  pink200: '#FFD9EA',
  pink300: '#FFBEDB',
  pink400: '#FF9BC5',
  pink500: '#FF73B0',
  sky100: '#EFF8FF',
  sky200: '#D9EEFF',
  sky300: '#B9DEFF',
  sky400: '#8DC8FF',
  sky500: '#5FAEFF',
  mint100: '#EEFDF6',
  mint300: '#BDF5DA',
  butter100: '#FFF9E8',
  butter300: '#FFE9A8',
  coral300: '#FFB5AE',
  cream50: '#FFFDFC',
  warmGray100: '#F6F2F4',
  warmGray200: '#E8E1E7',
  warmGray400: '#9A8F99',
  warmGray500: '#7A7080',
  ink100: '#F0EBF0',
  ink200: '#E1DBE2',
  ink500: '#7B6F80',
  ink700: '#4F4752',
  ink900: '#2F2932',
  white: '#FFFFFF'
} as const;

export const fontFamilies = {
  brand: 'DungGeunMo',
  body:
    Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'System'
    }) ?? 'System'
} as const;

export const colors = {
  ...palette,
  background: palette.cream50,
  surface: palette.white,
  surfaceMuted: palette.lavender100,
  borderSoft: palette.warmGray100,
  borderStrong: palette.warmGray200,
  textPrimary: palette.ink900,
  textSecondary: palette.ink700,
  textMuted: palette.warmGray400,
  textAccent: palette.lavender500,
  textDanger: palette.coral300,
  interactivePrimary: palette.lavender500,
  interactiveSecondary: palette.white,
  interactiveGhost: 'transparent',
  active: palette.mint300,
  warning: palette.butter300,
  danger: palette.coral300,
  disabledBackground: palette.warmGray200,
  disabledText: palette.warmGray400
} as const;

export const spacing = {
  xxs: 4,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  screenHorizontal: 16,
  cardPadding: 16,
  sectionGap: 24
} as const;

export const radii = {
  xs: 8,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999
} as const;

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0
  },
  soft: {
    shadowColor: '#9A6DFF',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  focus: {
    shadowColor: '#B995FF',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2
  }
} as const;

export const motion = {
  duration: {
    fast: 120,
    normal: 180,
    slow: 240
  },
  scale: {
    press: 0.98,
    jelly: 1.04
  },
  translate: {
    tab: 4,
    fadeSlide: 8
  }
} as const;

export const typography = {
  displayXL: {
    fontFamily: fontFamilies.brand,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700' as const,
    letterSpacing: 0.2
  },
  headingL: {
    fontFamily: fontFamilies.brand,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700' as const,
    letterSpacing: 0.1
  },
  headingM: {
    fontFamily: fontFamilies.brand,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700' as const
  },
  bodyL: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400' as const
  },
  bodyM: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const
  },
  bodyS: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400' as const
  },
  caption: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const
  },
  label: {
    fontFamily: fontFamilies.brand,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700' as const
  },
  reaction: {
    fontFamily: fontFamilies.brand,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700' as const
  },
  display: {
    fontFamily: fontFamilies.brand,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700' as const,
    letterSpacing: 0.2
  }
} as const;

export const theme = {
  colors,
  spacing,
  radii,
  shadows,
  motion,
  typography,
  fontFamilies
} as const;
