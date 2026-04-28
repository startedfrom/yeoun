import { Pressable, StyleSheet, Text, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';

import { colors, radii, spacing, typography } from '../tokens';

type TagChipProps = {
  label: string;
  selected?: boolean;
  accentColor?: string;
  onPress?: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function TagChip({
  label,
  selected = false,
  accentColor = colors.lavender300,
  onPress
}: TagChipProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 6,
      tension: 100
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 100
    }).start();
  };

  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`#${label} 태그`}
      style={[
        styles.base,
        {
          backgroundColor: selected ? colors.lavender400 : colors.white,
          borderColor: colors.lavender400,
          transform: [{ scale }]
        }
      ]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>#{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 0,
    borderWidth: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    ...typography.label,
    color: colors.ink700,
  },
  selectedLabel: {
    color: colors.white,
  }
});
