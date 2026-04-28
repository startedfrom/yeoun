import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Screen, colors, spacing, typography } from '@gamdojang/ui';

import { useSessionStore } from '../src/store/session-store';

export default function SplashRoute() {
  const router = useRouter();
  const sessionToken = useSessionStore((state) => state.sessionToken);

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.copy}>
          <Text style={styles.title}>YEO:UN</Text>
          <Text style={styles.subtitle}>흩어진 취향을 모아요.</Text>
        </View>

        <View style={styles.actions}>
          {sessionToken ? (
            <Button
              variant="secondary"
              shape="pixel"
              fullWidth
              onPress={() => router.replace('/(tabs)')}
            >
              홈으로 이어서
            </Button>
          ) : (
            <>
              <Button onPress={() => router.push('/onboarding')}>YEO:UN 시작하기</Button>
              <Button onPress={() => router.push('/auth/login')} variant="secondary">
                로그인 이어가기
              </Button>
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg
  },
  copy: {
    gap: spacing.md,
    marginTop: spacing.xxxl
  },
  title: {
    ...typography.display,
    color: colors.lavender500
  },
  subtitle: {
    ...typography.headingM,
    color: colors.ink700
  },
  actions: {
    gap: spacing.md
  }
});
