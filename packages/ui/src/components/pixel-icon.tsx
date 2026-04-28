import { Image, StyleSheet, View } from 'react-native';

import { colors } from '../tokens';

export type PixelIconName =
  | 'home'
  | 'walk'
  | 'upload'
  | 'mailbox'
  | 'mood-card'
  | 'bell'
  | 'bookmark'
  | 'comment'
  | 'settings'
  | 'search'
  | 'chalna'
  | 'back'
  | 'close'
  | 'more'
  | 'camera'
  | 'gallery'
  | 'paw'
  | 'stamp'
  | 'archive';

type PixelIconProps = {
  name: PixelIconName;
  color?: string;
  size?: number;
};

// Transparent background icons — tintColor works for active/inactive coloring
const transparentIcons: Partial<Record<PixelIconName, any>> = {
  chalna: require('../../../../assets/nav_chalna_icon_transparent.png'),
  bookmark: require('../../../../assets/icon_bookmark_pixel_transparent.png'),
};

// Full-color pixel art icons (icon_ref series) — use opacity for active/inactive
const colorIcons: Partial<Record<PixelIconName, any>> = {
  home: require('../../../../assets/icon_ref_1.png'),
  walk: require('../../../../assets/icon_ref_2.png'),
  paw: require('../../../../assets/icon_ref_2.png'),
  'mood-card': require('../../../../assets/icon_ref_3.png'),
  search: require('../../../../assets/icon_ref_4.png'),
  comment: require('../../../../assets/icon_ref_6.png'),
  settings: require('../../../../assets/icon_ref_7.png'),
  upload: require('../../../../assets/icon_ref_8.png'),
  camera: require('../../../../assets/icon_ref_10.png'),
  archive: require('../../../../assets/icon_ref_11.png'),
  stamp: require('../../../../assets/icon_ref_12.png'),
  mailbox: require('../../../../assets/icon_ref_13.png'),
  gallery: require('../../../../assets/icon_ref_15.png'),
  bell: require('../../../../assets/icon_bell_pixel_transparent.png'),
};

const MUTED_COLORS = new Set<string>([colors.textMuted, colors.textSecondary, colors.warmGray400]);

// Minimal fallback pixel maps for utility icons without image assets
const fallbackPixelMaps: Record<string, Array<[number, number]>> = {
  bell: [
    [2, 1], [3, 1], [1, 2], [4, 2], [1, 3], [2, 3], [3, 3], [4, 3], [2, 4], [3, 4]
  ],
  bookmark: [
    [1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [4, 2], [1, 3], [4, 3], [2, 4], [3, 4]
  ],
  comment: [
    [1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [4, 2], [1, 3], [2, 3], [3, 3], [2, 4]
  ],
  settings: [
    [2, 0], [4, 0], [0, 2], [2, 2], [4, 2], [6, 2], [2, 4], [4, 4], [2, 6], [4, 6]
  ],
  search: [
    [1, 1], [2, 1], [3, 1], [1, 2], [3, 2], [2, 3], [4, 4], [5, 5]
  ],
  back: [
    [3, 0], [2, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 6]
  ],
  close: [
    [0, 0], [5, 0], [1, 1], [4, 1], [2, 2], [3, 2], [2, 3], [3, 3], [1, 4], [4, 4], [0, 5], [5, 5]
  ],
  more: [
    [1, 3], [3, 3], [5, 3]
  ],
};

export function PixelIcon({
  color = colors.lavender500,
  name,
  size = 24
}: PixelIconProps) {
  const isMuted = MUTED_COLORS.has(color);

  // 1. Transparent icons — tintColor for coloring
  const transparentSource = transparentIcons[name];
  if (transparentSource) {
    return (
      <Image
        source={transparentSource}
        style={{ width: size, height: size, opacity: isMuted ? 0.4 : 1, tintColor: color }}
        resizeMode="contain"
      />
    );
  }

  // 2. Full-color pixel art icons — render as-is with opacity
  const colorSource = colorIcons[name];
  if (colorSource) {
    return (
      <Image
        source={colorSource}
        style={{ width: size, height: size, opacity: isMuted ? 0.45 : 1 }}
        resizeMode="contain"
      />
    );
  }

  // 3. Fallback pixel art rendering
  const pixelMap = fallbackPixelMaps[name];
  if (pixelMap) {
    const pixelSize = Math.max(2, Math.floor(size / 8));
    return (
      <View style={[styles.container, { width: pixelSize * 8, height: pixelSize * 8 }]}>
        {pixelMap.map(([x, y], index) => (
          <View
            key={`${name}-${index}`}
            style={{
              position: 'absolute',
              left: x * pixelSize,
              top: y * pixelSize,
              width: pixelSize,
              height: pixelSize,
              backgroundColor: color
            }}
          />
        ))}
      </View>
    );
  }

  return <View style={{ width: size, height: size, backgroundColor: colors.borderSoft }} />;
}

const styles = StyleSheet.create({
  container: {
    position: 'relative'
  }
});
