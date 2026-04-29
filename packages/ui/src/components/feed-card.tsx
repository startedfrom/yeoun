import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
  Modal,
  ScrollView,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { useRef, useState } from 'react';

import {
  chalnaSecondsRemainingFromExpiry,
  formatAverageMood,
  getPawLabelFromAverage,
  getPawScoreFromAverage,
  type MoodTag,
  type PawScore,
  type PostCardModel,
} from '@gamdojang/domain';

import { PAW_IMAGES } from '../paw-images';
import { safeHapticImpact } from '../safe-haptics';
import { colors, spacing, typography } from '../tokens';
import { PawReactionSelector } from './paw-reaction-selector';
import { PixelIcon } from './pixel-icon';
import { TagChip } from './tag-chip';

/** 웹에서는 `file://`·업로드 blob 이 DB에 들어간 이미지 URL이 그대로 오면 깨져 보임 */
const FALLBACK_POST_IMAGE =
  'https://images.unsplash.com/photo-1503341450723-e9b137aff6c9?auto=format&fit=crop&w=720&q=80';

function heroImageUri(post: PostCardModel): string {
  const raw = post.images?.[0]?.imageUrl?.trim();
  if (!raw) return FALLBACK_POST_IMAGE;
  if (raw.startsWith('https://')) return raw;
  if (raw.startsWith('http://')) return raw;
  return FALLBACK_POST_IMAGE;
}

export type FeedCardProps = {
  post: PostCardModel;
  onPress?: () => void;
  onPressProfile?: () => void;
  onChangeReaction?: (score: PawScore) => void;
  onReport?: () => void;
  /** 홈 피드: 이미지 위주 레이아웃, 우측 액션 레일, 하단 해시+여운 한 줄 */
  layoutMode?: 'default' | 'home';
  /** 홈: 해시 탭 시 산책 탭으로 해당 무드 태그 룩 탐색 */
  onPressMoodTagWalk?: (tag: MoodTag) => void;
};

export function FeedCard({
  post,
  onPress,
  onPressProfile,
  onChangeReaction,
  onReport,
  layoutMode = 'default',
  onPressMoodTagWalk,
}: FeedCardProps) {
  const insets = useSafeAreaInsets();
  const [hashSheetOpen, setHashSheetOpen] = useState(false);
  const [reactionExpandNonce, setReactionExpandNonce] = useState(0);
  const cardScale = useRef(new Animated.Value(1)).current;
  const chalnaRemaining =
    post.postType === 'chalna' && post.expiresAt
      ? chalnaSecondsRemainingFromExpiry(post.expiresAt)
      : post.postType === 'chalna'
        ? (post.remainingSeconds ?? 0)
        : 0;

  const handleCardPressIn = () => {
    Animated.spring(cardScale, { toValue: 0.98, useNativeDriver: true, friction: 7 }).start();
  };
  const handleCardPressOut = () => {
    Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
  };

  const railInset = Math.max(spacing.sm, insets.right);

  if (layoutMode === 'home') {
    return (
      <>
        <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
          {post.postType === 'chalna' && chalnaRemaining > 0 && (
            <View style={styles.chalnaExpirationStrip}>
              <Text style={styles.chalnaExpirationText}>
                EXPIRES
                {chalnaRemaining >= 3600
                  ? ` -${Math.floor(chalnaRemaining / 3600)}H`
                  : chalnaRemaining >= 60
                    ? ` -${Math.floor(chalnaRemaining / 60)}M`
                    : ` -${chalnaRemaining}S`}
              </Text>
            </View>
          )}

          <View style={styles.imageWrapperHome}>
            <Image
              source={{ uri: heroImageUri(post) }}
              style={styles.image}
              accessibilityIgnoresInvertColors
            />
            {post.caption ? (
              <View style={[styles.captionScrim, { paddingRight: 56 + railInset }]} pointerEvents="box-none">
                <Text style={styles.captionOnImage} numberOfLines={3}>
                  {post.caption}
                </Text>
              </View>
            ) : null}

            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => {
                safeHapticImpact(ImpactFeedbackStyle.Light);
                onPress?.();
              }}
              onPressIn={handleCardPressIn}
              onPressOut={handleCardPressOut}
              accessibilityRole="button"
              accessibilityLabel={`${post.author.nickname}님의 게시물`}
            />

            <View style={[styles.actionRail, { right: railInset, bottom: spacing.md }]} pointerEvents="box-none">
              <Pressable
                style={styles.railFab}
                onPress={() => {
                  safeHapticImpact(ImpactFeedbackStyle.Light);
                  setHashSheetOpen(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="해시 태그 보기"
              >
                <Text style={styles.railHashGlyph}>#</Text>
              </Pressable>

              <View
                style={[styles.railFab, styles.railFabAverage]}
                accessibilityRole="text"
                accessibilityLabel={
                  post.reactionSummary.reactionsCount > 0
                    ? `평균 ${getPawLabelFromAverage(post.reactionSummary.averageScore)} ${formatAverageMood(post.reactionSummary.averageScore, 1)}점`
                    : '아직 남긴 여운 없음'
                }
              >
                <Image
                  source={PAW_IMAGES[getPawScoreFromAverage(post.reactionSummary.averageScore)] as ImageSourcePropType}
                  style={styles.railFabAvgPaw}
                  resizeMode="contain"
                />
                <Text style={styles.railFabAvgScore} numberOfLines={1}>
                  {post.reactionSummary.reactionsCount > 0
                    ? formatAverageMood(post.reactionSummary.averageScore, 1)
                    : '—'}
                </Text>
              </View>

              <Pressable
                style={styles.railFab}
                onPress={() => setReactionExpandNonce((n) => n + 1)}
                accessibilityRole="button"
                accessibilityLabel="여운 남기기"
              >
                <PixelIcon name="paw" color={colors.lavender400} size={26} />
              </Pressable>
            </View>
          </View>

          <View style={styles.homeBottomBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.homeTagScroll}
              contentContainerStyle={styles.homeTagScrollContent}
            >
              {post.moodTags.map((tag) => (
                <TagChip
                  key={tag.id}
                  label={tag.name}
                  accentColor={tag.accentColor}
                  onPress={onPressMoodTagWalk ? () => onPressMoodTagWalk(tag) : undefined}
                />
              ))}
            </ScrollView>
          </View>
        </Animated.View>

        <PawReactionSelector
          showCollapsedTrigger={false}
          onChange={onChangeReaction}
          summary={post.reactionSummary}
          stripAlign="leading"
          requestExpandNonce={reactionExpandNonce > 0 ? reactionExpandNonce : undefined}
        />

        <Modal transparent visible={hashSheetOpen} animationType="fade" onRequestClose={() => setHashSheetOpen(false)}>
          <View style={styles.hashModalRoot}>
            <Pressable
              style={StyleSheet.absoluteFill}
              accessibilityRole="button"
              accessibilityLabel="닫기"
              onPress={() => setHashSheetOpen(false)}
            />
            <View style={styles.hashModalCard}>
              <Text style={styles.hashModalTitle}>여운 해시</Text>
              <View style={styles.hashModalTags}>
                {post.moodTags.map((tag) => (
                  <TagChip
                    key={tag.id}
                    label={tag.name}
                    accentColor={tag.accentColor}
                    onPress={
                      onPressMoodTagWalk
                        ? () => {
                            setHashSheetOpen(false);
                            onPressMoodTagWalk(tag);
                          }
                        : undefined
                    }
                  />
                ))}
              </View>
              <View style={styles.hashModalActions}>
                <Pressable
                  onPress={() => setHashSheetOpen(false)}
                  accessibilityRole="button"
                  accessibilityLabel="닫기"
                >
                  <Text style={styles.hashModalCloseText}>닫기</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
      {/* 0. Chalna Expiration Warning (Only for chalna posts) */}
      {post.postType === 'chalna' && chalnaRemaining > 0 && (
        <View style={styles.chalnaExpirationStrip}>
          <Text style={styles.chalnaExpirationText}>
            EXPIRES
            {chalnaRemaining >= 3600
              ? ` -${Math.floor(chalnaRemaining / 3600)}H`
              : chalnaRemaining >= 60
                ? ` -${Math.floor(chalnaRemaining / 60)}M`
                : ` -${chalnaRemaining}S`}
          </Text>
        </View>
      )}

      {/* 1. Full Bleed Image — tap opens post (no outer <button> wrapping tags / reactions on web) */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: heroImageUri(post) }}
          style={styles.image}
          accessibilityIgnoresInvertColors
        />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            safeHapticImpact(ImpactFeedbackStyle.Light);
            onPress?.();
          }}
          onPressIn={handleCardPressIn}
          onPressOut={handleCardPressOut}
          accessibilityRole="button"
          accessibilityLabel={`${post.author.nickname}님의 게시물 열기`}
        />
      </View>

      {/* 2. Content below the image */}
      <View style={styles.contentContainer}>
        {/* Tags */}
        <View style={styles.tagRow} accessibilityRole="none">
          {post.moodTags.map((tag) => (
            <TagChip
              key={tag.id}
              label={tag.name}
              accentColor={tag.accentColor}
              onPress={onPressMoodTagWalk ? () => onPressMoodTagWalk(tag) : undefined}
            />
          ))}
        </View>

        {/* Caption */}
        <Pressable
          onPress={() => {
            safeHapticImpact(ImpactFeedbackStyle.Light);
            onPress?.();
          }}
          accessibilityRole="button"
          accessibilityLabel={`${post.author.nickname}님의 게시물 본문 열기`}
        >
          <Text style={styles.caption} accessibilityRole="text">
            {post.caption}
          </Text>
        </Pressable>

        {/* 3. Stamp/Reactions */}
        <View style={styles.reactionRow}>
          <PawReactionSelector onChange={onChangeReaction} summary={post.reactionSummary} />
        </View>
      </View>

      {/* 4. Footer Row (Author & Actions) - Reduced Priority */}
      <View style={styles.footerRow}>
        <Pressable
          onPress={() => {
            safeHapticImpact(ImpactFeedbackStyle.Light);
            onPressProfile?.();
          }}
          style={styles.authorInfo}
          accessibilityRole="button"
          accessibilityLabel={`${post.author.nickname} 프로필 보기`}
        >
          <Image source={{ uri: post.author.profileImageUrl }} style={styles.avatar} />
          <View style={styles.authorCopy}>
            <Text style={styles.nickname}>{post.author.nickname}</Text>
            <Text style={styles.meta}>
              {post.locationText ?? '무드 기록'} · {new Date(post.createdAt).toLocaleDateString('ko-KR')}
            </Text>
          </View>
        </Pressable>

        <View style={styles.actionRowRight}>
          <Pressable
            style={styles.actionItem}
            onPress={() => {
              safeHapticImpact(ImpactFeedbackStyle.Light);
            }}
            accessibilityRole="button"
            accessibilityLabel={`총 여운 포인트 ${Math.round(post.reactionSummary.averageScore * post.reactionSummary.reactionsCount)}`}
          >
            <PixelIcon name="comment" color={colors.lavender400} />
            <Text style={styles.actionLabel}>{Math.round(post.reactionSummary.averageScore * post.reactionSummary.reactionsCount)}</Text>
          </Pressable>

          {onReport && (
            <Pressable
              onPress={() => {
                safeHapticImpact(ImpactFeedbackStyle.Light);
                onReport();
              }}
              accessibilityRole="button"
              accessibilityLabel="게시물 신고하기"
              style={styles.actionItem}
            >
              <PixelIcon name="more" color={colors.lavender400} />
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lavender400,
    marginBottom: spacing.xxl,
  },
  chalnaExpirationStrip: {
    backgroundColor: colors.lavender400,
    borderBottomWidth: 2,
    borderBottomColor: colors.lavender400,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chalnaExpirationText: {
    ...typography.bodyM,
    fontFamily: 'DungGeunMo',
    color: colors.white,
    letterSpacing: 2,
  },
  imageWrapper: {
    borderBottomWidth: 2,
    borderBottomColor: colors.lavender400,
  },
  image: {
    width: '100%',
    aspectRatio: 1, // Make it square to look more retro
    backgroundColor: colors.ink100,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  caption: {
    ...typography.bodyL,
    fontFamily: 'DungGeunMo',
    color: colors.ink900,
    lineHeight: 28,
  },
  reactionRow: {
    marginTop: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: colors.lavender400,
    backgroundColor: colors.white,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.lavender400,
  },
  authorCopy: {
    gap: 2,
  },
  nickname: {
    ...typography.bodyS,
    fontFamily: 'DungGeunMo',
    color: colors.ink900,
  },
  meta: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.ink500,
  },
  actionRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    minWidth: 40,
    justifyContent: 'center',
  },
  actionLabel: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.lavender400,
  },
  imageWrapperHome: {
    position: 'relative',
    borderBottomWidth: 2,
    borderBottomColor: colors.lavender400,
  },
  captionScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingLeft: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: 'rgba(47, 41, 50, 0.62)',
  },
  captionOnImage: {
    ...typography.bodyM,
    fontFamily: 'DungGeunMo',
    color: colors.white,
    lineHeight: 22,
  },
  actionRail: {
    position: 'absolute',
    flexDirection: 'column',
    gap: spacing.sm,
    alignItems: 'center',
  },
  railFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lavender400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railFabImage: {
    width: 28,
    height: 28,
  },
  railHashGlyph: {
    fontFamily: 'DungGeunMo',
    fontSize: 22,
    color: colors.lavender400,
    marginTop: -2,
  },
  homeBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: colors.lavender400,
    backgroundColor: colors.white,
  },
  homeTagScroll: {
    flexGrow: 1,
    width: '100%',
  },
  homeTagScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  railFabAverage: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    minHeight: 52,
    paddingVertical: 4,
  },
  railFabAvgPaw: {
    width: 22,
    height: 22,
  },
  railFabAvgScore: {
    fontFamily: 'DungGeunMo',
    fontSize: 10,
    lineHeight: 12,
    color: colors.ink700,
    fontWeight: '600',
  },
  hashModalRoot: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(29, 24, 32, 0.45)',
  },
  hashModalCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lavender400,
    padding: spacing.lg,
    gap: spacing.md,
  },
  hashModalTitle: {
    ...typography.headingM,
    fontFamily: 'DungGeunMo',
    color: colors.ink900,
  },
  hashModalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  hashModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  hashModalCloseText: {
    ...typography.bodyM,
    fontFamily: 'DungGeunMo',
    color: colors.lavender400,
  },
});
