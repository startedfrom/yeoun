import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../tokens';

export function SectionTitle({ children }: PropsWithChildren) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg
  },
  title: {
    ...typography.headingL,
    color: colors.lavender400
  }
});
