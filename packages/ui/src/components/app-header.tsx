import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, motion, spacing, typography } from '../tokens';
import { PixelIcon } from './pixel-icon';

export interface AppHeaderProps {
  /** 비어 있으면 타이틀 텍스트 대신 `leftSlot`이 중앙(title) 영역에 배치됩니다(로고 등). */
  title?: string;
  subtitle?: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  onBack?: () => void;
}

export function AppHeader({
  title = '',
  subtitle,
  leftSlot,
  rightSlot,
  onBack
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const titleTrimmed = title.trim();
  const hasTitle = titleTrimmed.length > 0;
  /** title이 없을 때만: leftSlot을 왼쪽 슬롯이 아니라 중앙(타이틀 자리)에 둡니다. 다른 탭과 동일한 헤더 리듬을 유지합니다. */
  const centerSlotFromLeft = !hasTitle && Boolean(leftSlot);

  return (
    <View
      style={[styles.container, { paddingTop: Math.max(insets.top, spacing.md) }]}
      accessibilityRole="header"
    >
      {onBack && !leftSlot ? (
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <PixelIcon name={'back'} />
        </Pressable>
      ) : !centerSlotFromLeft && leftSlot ? (
        <View style={styles.slot}>{leftSlot}</View>
      ) : onBack && centerSlotFromLeft ? (
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <PixelIcon name={'back'} />
        </Pressable>
      ) : null}

      <View style={styles.center}>
        {centerSlotFromLeft ? (
          leftSlot
        ) : (
          <>
            {hasTitle ? (
              <Text style={styles.title} numberOfLines={1}>
                {titleTrimmed}
              </Text>
            ) : null}
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </>
        )}
      </View>

      <View style={styles.slot}>{rightSlot}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.md,
    backgroundColor: 'transparent', // Let Screen's background show through
    minHeight: 44 // Minimum touch target size equivalent
  },
  center: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginHorizontal: spacing.md
  },
  slot: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    ...typography.headingM,
    color: colors.textPrimary
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center'
  },
  pressed: {
    transform: [{ scale: motion.scale.press }],
    opacity: 0.8
  }
});
