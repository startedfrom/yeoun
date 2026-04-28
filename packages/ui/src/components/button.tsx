import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';

import { colors, motion, radii, shadows, spacing, typography } from '../tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = PropsWithChildren<{
  variant?: ButtonVariant;
  /** 기본은 둥근 모서리, `pixel`은 직각(픽셀 UI) */
  shape?: 'rounded' | 'pixel';
  /** 한 줄로 넓게 쓸 때(스플래시 CTA 등) */
  fullWidth?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  children,
  disabled,
  onPress,
  variant = 'primary',
  shape = 'rounded',
  fullWidth = false,
  accessibilityLabel
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(scale, {
        toValue: 0.96,
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
      accessibilityState={{ disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        shape === 'pixel' && styles.pixelShape,
        variantStyles[variant],
        shape === 'pixel' && variant === 'secondary' && styles.pixelSecondaryFrame,
        disabled && styles.disabled,
        { transform: [{ scale }] }
      ]}
    >
      <Text
        style={[
          styles.label,
          labelStyles[variant],
          shape === 'pixel' && variant === 'secondary' && styles.pixelSecondaryLabel,
          disabled && styles.disabledLabel
        ]}
      >
        {children}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    minWidth: 48, // accessibility touch target
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg
  },
  label: {
    ...typography.bodyL,
    fontWeight: '600'
  },
  pressed: {
    transform: [{ scale: motion.scale.press }]
  },
  disabled: {
    backgroundColor: colors.warmGray200,
    borderColor: colors.warmGray200
  },
  disabledLabel: {
    color: colors.warmGray400
  },
  pixelShape: {
    borderRadius: 0
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%'
  },
  pixelSecondaryFrame: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.lavender400
  },
  pixelSecondaryLabel: {
    color: colors.lavender500
  }
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.lavender400,
    ...shadows.soft
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lavender200
  },
  ghost: {
    backgroundColor: 'transparent'
  }
});

const labelStyles = StyleSheet.create({
  primary: {
    color: colors.white
  },
  secondary: {
    color: colors.lavender400
  },
  ghost: {
    color: colors.lavender400
  }
});
