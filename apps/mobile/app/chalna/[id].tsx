import {
  chalnaSecondsRemainingFromExpiry,
  isChalnaLiveByExpiresAt,
  type MoodTag,
  type PawScore,
} from '@gamdojang/domain';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import {
  PawReactionSelector,
  TagChip,
  colors,
  radii,
  spacing,
  typography,
  PixelIcon
} from '@gamdojang/ui';

import { usePost } from '../../src/hooks/use-posts';
import { useUpdateReaction } from '../../src/hooks/use-reactions';

const { width } = Dimensions.get('window');

export default function ChalnaDetailRoute() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = typeof id === 'string' ? id : '';
  const { data: post, isLoading, isError } = usePost(postId);
  const { mutate: updateReaction } = useUpdateReaction();

  const [tick, setTick] = useState(0);
  const [reactionOverride, setReactionOverride] = useState<PawScore | null>(null);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  const isChalna = post?.postType === 'chalna';
  const stillLive =
    isChalna && post?.expiresAt != null && isChalnaLiveByExpiresAt(post.expiresAt as string);

  useEffect(() => {
    if (!stillLive) return;
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [stillLive]);

  useFocusEffect(
    useCallback(() => {
      if (!postId) return;
      void queryClient.invalidateQueries({ queryKey: ['post', postId] });
    }, [postId, queryClient])
  );

  useEffect(() => {
    if (!isLoading && !isError && post && post.postType !== 'chalna') {
      router.replace(`/post/${post.id}`);
    }
  }, [isLoading, isError, post, router]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true
      })
    ]).start();
  }, [opacity, translateY]);

  if (isLoading && !post) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Stack.Screen options={{ headerShown: false, presentation: 'transparentModal' }} />
        <ActivityIndicator size="large" color={colors.lavender500} />
      </SafeAreaView>
    );
  }

  if (post && post.postType !== 'chalna') {
    return null;
  }

  const showGone =
    isError ||
    !post ||
    !post.expiresAt ||
    !isChalnaLiveByExpiresAt(post.expiresAt as string);

  if (showGone) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Stack.Screen options={{ headerShown: false, presentation: 'transparentModal' }} />
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>사라진 찰나입니다.</Text>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>돌아가기</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  void tick;

  const moodTags: MoodTag[] =
    post.moodTags?.map((mt: { moodTag: MoodTag }) => mt.moodTag) ?? [];
  const thumbnailImageUrl = post.images?.[0]?.imageUrl ?? '';
  const remainingSeconds = chalnaSecondsRemainingFromExpiry(post.expiresAt as string);

  const hoursLeft = Math.floor(remainingSeconds / 3600);
  const minsLeft = Math.floor((remainingSeconds % 3600) / 60);

  const reactionSummary = {
    averageScore: Number(post.reactionScoreAvg) || 0,
    topLabel: post.topReactionLabel || '슬쩍',
    reactionsCount: post.reactionsCount || 0,
    myScore: reactionOverride ?? undefined
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: 'transparentModal',
          animation: 'fade'
        }}
      />

      <Pressable style={styles.backdrop} onPress={() => router.back()} />

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.header, { opacity }]}>
          <Pressable onPress={() => router.back()} style={styles.dismissBtn}>
            <PixelIcon name="close" size={20} color={colors.white} />
          </Pressable>
          <View style={styles.timerBadge}>
            <Text style={styles.timerText}>
              {hoursLeft > 0 ? `${hoursLeft}H ` : ''}
              {minsLeft}M LEFT
            </Text>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.cardScroll}
          contentContainerStyle={styles.cardScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <Animated.View
            style={[
              styles.polaroid,
              {
                opacity,
                transform: [{ translateY }]
              }
            ]}
          >
            <View style={styles.polaroidImageWrapper}>
              <Image source={{ uri: thumbnailImageUrl }} style={styles.image} />
            </View>

            <View style={styles.polaroidContent}>
              <View style={styles.tagWrap}>
                {moodTags.map((tag) => (
                  <TagChip key={tag.id} accentColor={tag.accentColor} label={tag.name} />
                ))}
              </View>

              <Text style={styles.caption} numberOfLines={3}>
                {post.caption}
              </Text>

              <View style={styles.divider} />

              <View style={styles.reactionRow}>
                <Text style={styles.reactionLabel}>조용히 무드 남기기</Text>
                <PawReactionSelector
                  precision={2}
                  summary={reactionSummary}
                  onChange={(score) => {
                    setReactionOverride(score);
                    updateReaction({ postId: post.id, data: { score } });
                  }}
                />
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        <Animated.View style={[styles.hintWrapper, { opacity }]}>
          <Text style={styles.hintText}>배경을 터치하면 산책로로 돌아갑니다</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(20, 18, 24, 0.85)'
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg
  },
  dismissBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  timerBadge: {
    backgroundColor: colors.ink900,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.pink500
  },
  timerText: {
    fontFamily: 'DungGeunMo',
    color: colors.pink500,
    fontSize: 16,
    letterSpacing: 1
  },
  cardScroll: {
    flex: 1,
    width: '100%'
  },
  cardScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md
  },
  polaroid: {
    width: width * 0.85,
    backgroundColor: colors.white,
    padding: 12,
    paddingBottom: 24,
    borderRadius: radii.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 10
  },
  polaroidImageWrapper: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.warmGray100,
    borderRadius: radii.sm,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  polaroidContent: {
    gap: spacing.sm,
    paddingHorizontal: 4
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  caption: {
    ...typography.bodyL,
    fontFamily: 'DungGeunMo',
    color: colors.ink900,
    lineHeight: 24,
    marginTop: spacing.xs
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: colors.warmGray200,
    borderStyle: 'dashed',
    marginVertical: spacing.sm
  },
  reactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    flexWrap: 'wrap',
    gap: spacing.sm,
    rowGap: spacing.sm
  },
  reactionLabel: {
    ...typography.caption,
    color: colors.warmGray500
  },
  hintWrapper: {
    alignItems: 'center',
    paddingBottom: spacing.xxxl
  },
  hintText: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.5)'
  },
  errorContainer: {
    flex: 1,
    backgroundColor: 'rgba(20, 18, 24, 0.9)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: radii.lg,
    alignItems: 'center',
    gap: spacing.lg
  },
  errorText: {
    ...typography.bodyL,
    color: colors.ink700
  },
  closeBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.lavender500,
    borderRadius: radii.pill
  },
  closeBtnText: {
    ...typography.bodyM,
    color: colors.white,
    fontWeight: 'bold'
  }
});
