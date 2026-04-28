import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Screen, TagChip, colors, spacing, typography } from '@gamdojang/ui';

import { useMoodTags } from '../src/hooks/use-mood-tags';

export default function OnboardingRoute() {
  const router = useRouter();
  const { data = [] } = useMoodTags();
  const seededDefaults = useRef(false);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (seededDefaults.current || data.length < 2) return;
    seededDefaults.current = true;
    setSelected([data[0].id, data[1].id]);
  }, [data]);

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.title}>YEO:UN에서 흩어진 취향을 모아요</Text>
        <Text style={styles.description}>
          관심 있는 무드를 먼저 골라두면 홈과 산책이 더 그윽하게 시작돼요.
        </Text>
      </View>

      <View style={styles.tagWrap}>
        {data.map((tag) => {
          const active = selected.includes(tag.id);
          return (
            <TagChip
              key={tag.id}
              accentColor={tag.accentColor}
              label={tag.name}
              onPress={() =>
                setSelected((current) =>
                  active
                    ? current.filter((item) => item !== tag.id)
                    : [...current, tag.id]
                )
              }
              selected={active}
            />
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>알림 권한 안내</Text>
        <Text style={styles.cardBody}>
          누군가의 여운이 도착하거나, 편지 요청이 오거나, 찰나에 반응이 오면 알려드릴게요.
        </Text>
      </View>

      <Button
        onPress={() => {
          router.push({
            pathname: '/auth/signup',
            params: { tags: JSON.stringify(selected) }
          });
        }}
      >
        회원가입으로 이어가기
      </Button>
      <Button variant="ghost" onPress={() => router.push('/auth/login')}>
        로그인 이어가기
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg
  },
  title: {
    ...typography.headingL,
    fontSize: 20,
    lineHeight: 26,
    color: colors.lavender400
  },
  description: {
    ...typography.bodyL,
    color: colors.ink700
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  card: {
    borderRadius: 20,
    backgroundColor: colors.sky100,
    padding: spacing.lg,
    gap: spacing.sm
  },
  cardTitle: {
    ...typography.headingM,
    color: colors.ink900
  },
  cardBody: {
    ...typography.bodyM,
    color: colors.ink700
  }
});
