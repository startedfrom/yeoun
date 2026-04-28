import type { PropsWithChildren, ReactNode } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { colors, spacing } from '../tokens';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  header?: ReactNode;
}>;

export function Screen({ children, header, scroll = true }: ScreenProps) {
  const content = (
    <View style={[styles.content, !scroll && { flex: 1 }]}>
      {header ? <View style={styles.header}>{header}</View> : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>{content}</ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream50
  },
  scrollContent: {
    paddingBottom: spacing.xxxl
  },
  content: {
    paddingTop: spacing.md,
    gap: spacing.lg
  },
  header: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg
  }
});
