import { Pressable, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';

import { motion } from '../tokens';
import { PixelIcon, type PixelIconName } from './pixel-icon';

export interface IconButtonProps {
  name: PixelIconName; // From PixelIcon names
  color?: string;
  size?: number;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function IconButton({
  name,
  color,
  size = 24,
  onPress,
  disabled,
  accessibilityLabel
}: IconButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(scale, {
        toValue: 0.9,
        useNativeDriver: true,
        friction: 6,
        tension: 100
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 100
      }).start();
    }
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        disabled && styles.disabled,
        { transform: [{ scale }] }
      ]}
    >
      <PixelIcon name={name} color={color} size={size} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minWidth: 44, // Minimum touch target size
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center'
  },
  pressed: {
    transform: [{ scale: motion.scale.press }],
    opacity: 0.8
  },
  disabled: {
    opacity: 0.5
  }
});
