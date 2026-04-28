import { Pressable, StyleSheet, Text, View, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';

import { colors, radii, spacing, typography } from '../tokens';
import { PixelIcon, type PixelIconName } from './pixel-icon';

export interface TabRoute {
  name: string;
  label: string;
  icon: PixelIconName; // icon name for PixelIcon
}

export interface BottomTabBarProps {
  routes: TabRoute[];
  currentRoute: string;
  onTabPress: (routeName: string) => void;
}

function TabItem({ 
  route, 
  isFocused, 
  onPress 
}: { 
  route: TabRoute; 
  isFocused: boolean; 
  onPress: () => void; 
}) {
  const scale = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(isFocused ? -4 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: isFocused ? 1 : 0,
        useNativeDriver: true,
        friction: 8,
        tension: 50
      }),
      Animated.spring(translateY, {
        toValue: isFocused ? -4 : 0,
        useNativeDriver: true,
        friction: 8,
        tension: 50
      })
    ]).start();
  }, [isFocused]);

  const jellyOpacity = scale.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={route.label}
      onPress={onPress}
      style={styles.tabButton}
    >
      <Animated.View style={[styles.iconWrapper, { transform: [{ translateY }] }]}>
        {/* Sharp Bottom Underline for Active Tab */}
        <Animated.View 
          style={[
            styles.activeLine, 
            { 
              opacity: jellyOpacity,
            }
          ]} 
        />
        
        <View style={styles.iconContainer}>
          <PixelIcon
            name={route.icon}
            color={isFocused ? colors.lavender400 : colors.warmGray400}
            size={24}
          />
        </View>
        <Text
          style={[styles.tabLabel, isFocused ? styles.tabLabelFocused : null]}
          numberOfLines={1}
        >
          {route.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function BottomTabBar({ routes, currentRoute, onTabPress }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.outerContainer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <View
        style={styles.container}
        accessibilityRole="tablist"
      >
        {routes.map((route) => (
          <TabItem 
            key={route.name}
            route={route}
            isFocused={currentRoute === route.name}
            onPress={() => {
              if (currentRoute !== route.name) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onTabPress(route.name);
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: colors.white,
    borderTopWidth: 2,
    borderTopColor: colors.lavender400
  },
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    position: 'relative'
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%'
  },
  activeLine: {
    position: 'absolute',
    bottom: -6,
    width: '50%',
    height: 4,
    backgroundColor: colors.lavender400,
    borderRadius: 0,
    zIndex: 1
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 6
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.warmGray400,
    marginTop: 2
  },
  tabLabelFocused: {
    color: colors.lavender400,
    fontWeight: 'bold'
  }
});