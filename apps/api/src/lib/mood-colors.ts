const SLUG_COLORS: Record<string, string> = {
  'daily-look': '#B995FF',
  'today-coordi': '#8DC8FF',
  'ootd-ko': '#FFE9A8',
  ootd: '#FFBEDB',
  'womens-coordi': '#BDF5DA',
  'vintage-look': '#FFC9A8',
  'mood-coordi': '#FFD6B0',
  'effortless-chic': '#C4D4F5',
  'casual-look': '#E8B4D4',
  'layered-look': '#A8D5E2',
  'knit-coordi': '#D4A574',
  'fall-coordi': '#C17B5B',
};

const DEFAULT_COLOR = '#D9D5EC';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withAccentColor<T extends { slug?: string }>(tag: T): T & { accentColor: string } {
  return {
    ...tag,
    accentColor: (tag.slug && SLUG_COLORS[tag.slug]) || DEFAULT_COLOR,
  };
}
