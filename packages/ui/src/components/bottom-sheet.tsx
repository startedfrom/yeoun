import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, StyleSheet, Text, View, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { colors, radii, shadows, spacing, typography } from '../tokens';
import { IconButton } from './icon-button';

export type BottomSheetProps = React.PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  title?: string;
}>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(visible);
  
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        setShowModal(false);
      });
    }
  }, [visible, translateY, opacity]);

  const handleClose = () => {
    // Only trigger onClose, the effect above will handle the exit animation
    onClose();
  };

  if (!showModal) return null;

  return (
    <Modal visible={showModal} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay} accessibilityRole="none">
        <Animated.View style={[styles.backdrop, { opacity }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            accessibilityLabel="닫기"
            accessibilityRole="button"
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing.xxl) },
            { transform: [{ translateY }] }
          ]}
          accessibilityRole="none"
          accessibilityLabel={title || '다이얼로그'}
        >
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            {title && (
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            )}
            <View style={styles.headerAction}>
              <IconButton
                name="settings" // mock icon for close
                onPress={handleClose}
                accessibilityLabel="닫기"
                size={20}
              />
            </View>
          </View>

          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  backdrop: {
    ...(StyleSheet.absoluteFill as object),
    backgroundColor: 'rgba(0, 0, 0, 0.4)'
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32, // Extra roundness for softness
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 16,
    elevation: 8
  },
  handleContainer: {
    alignItems: 'center',
    paddingBottom: spacing.lg
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.borderStrong
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl
  },
  headerSpacer: {
    width: 44
  },
  title: {
    ...typography.headingM,
    color: colors.lavender400,
    flex: 1,
    textAlign: 'center'
  },
  headerAction: {
    width: 44,
    alignItems: 'flex-end'
  },
  content: {
    // Allows content to layout normally
  }
});