import {
  type FeedTab,
  type PawScore,
  type PostCardModel,
  type ReactionSummary,
  chalnaSecondsRemainingFromExpiry,
  isChalnaLiveByExpiresAt
} from '@gamdojang/domain';
import { useRouter } from 'expo-router';
import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Alert,
  FlatList,
  Animated,
  type ViewToken,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ImpactFeedbackStyle } from 'expo-haptics';

import {
  AppHeader,
  ChalnaStrip,
  FeedCard,
  IconButton,
  PixelIcon,
  Screen,
  colors,
  spacing,
  typography,
  safeHapticImpact,
} from '@gamdojang/ui';
import { useHomeFeed } from '../../src/hooks/use-home-feed';
import { useFeedStore } from '../../src/store/feed-store';
import { useUpdateReaction } from '../../src/hooks/use-reactions';
import { useCreateReport } from '../../src/hooks/use-reports';

const feedTabs: Array<{ key: FeedTab; label: string }> = [
  { key: 'recommended', label: '추천' },
  { key: 'latest', label: '최신' },
  { key: 'following', label: '팔로우' }
];

/** 커스텀 BottomTabBar(대략 56 + 세로 패딩) + 홈 인디케이터 여유 */
const HOME_TAB_BAR_EXTRA = 76;

/** 리스트 맨 위에선 작성자 스트립 숨김 — 이 픽셀 이상 스크롤 시 표시 */
const FEED_CONTEXT_STRIP_REVEAL_Y = 36;

function HomeFeedContextStrip({
  post,
  onPressProfile,
  onReport,
}: {
  post: PostCardModel;
  onPressProfile: () => void;
  onReport?: () => void;
}) {
  const handle = post.author.nickname.replace(/^@/, '');
  return (
    <View style={styles.feedContextStrip}>
      <Pressable
        onPress={() => {
          safeHapticImpact(ImpactFeedbackStyle.Light);
          onPressProfile();
        }}
        style={styles.feedContextProfileHit}
        accessibilityRole="button"
        accessibilityLabel={`${post.author.nickname}, @${handle} 프로필`}
      >
        <Image source={{ uri: post.author.profileImageUrl }} style={styles.feedContextAvatar} />
        <View style={styles.feedContextTextCol}>
          <Text style={styles.feedContextNick} numberOfLines={1}>
            {post.author.nickname}
          </Text>
          <Text style={styles.feedContextHandle} numberOfLines={1}>
            @{handle}
          </Text>
        </View>
      </Pressable>
      {onReport ? (
        <Pressable
          onPress={() => {
            safeHapticImpact(ImpactFeedbackStyle.Light);
            onReport();
          }}
          style={styles.feedContextReportHit}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="게시물 신고하기"
        >
          <PixelIcon name="more" color={colors.lavender400} size={22} />
        </Pressable>
      ) : null}
    </View>
  );
}

function JellyFeedTabs({ currentTab, onTabChange }: { currentTab: FeedTab, onTabChange: (tab: FeedTab) => void }) {
  const selectedIndex = feedTabs.findIndex(t => t.key === currentTab);
  const translateX = useRef(new Animated.Value(0)).current;
  const [tabWidth, setTabWidth] = useState(0);

  useEffect(() => {
    if (tabWidth > 0) {
      Animated.spring(translateX, {
        toValue: selectedIndex * tabWidth,
        useNativeDriver: true,
        friction: 8,
        tension: 60
      }).start();
    }
  }, [selectedIndex, tabWidth]);

  return (
    <View style={styles.tabsWrapper}>
      <View style={styles.tabsContainer}>
        {tabWidth > 0 && (
          <Animated.View
            style={[
              styles.jellyBg,
              { width: tabWidth, transform: [{ translateX }] }
            ]}
          />
        )}
        {feedTabs.map((tab, idx) => {
          const isActive = currentTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onLayout={(e) => {
                if (idx === 0) setTabWidth(e.nativeEvent.layout.width);
              }}
              style={styles.tabItem}
              onPress={() => {
                safeHapticImpact(ImpactFeedbackStyle.Light);
                onTabChange(tab.key);
              }}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function HomeTabRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentTab = useFeedStore((state) => state.currentTab);
  const setCurrentTab = useFeedStore((state) => state.setCurrentTab);
  
  const { data, isLoading, isError, error, refetch } = useHomeFeed(currentTab);
  const { mutate: updateReaction } = useUpdateReaction();
  const { mutate: createReport } = useCreateReport();

  const reactionOverrides = useRef<Record<string, ReactionSummary>>({});
  const [, forceUpdate] = useState(0);
  const [chalnaWave, setChalnaWave] = useState(0);
  const [stickyPost, setStickyPost] = useState<PostCardModel | null>(null);
  const [feedScrollY, setFeedScrollY] = useState(0);
  const feedDataRef = useRef(data);
  feedDataRef.current = data;

  const showAuthorContextStrip = !!stickyPost && feedScrollY > FEED_CONTEXT_STRIP_REVEAL_Y;

  const onFeedScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    setFeedScrollY(y > 0 ? y : 0);
  }, []);

  const listBottomPad = HOME_TAB_BAR_EXTRA + Math.max(insets.bottom, spacing.md) + spacing.lg;

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 42,
      minimumViewTime: 120,
    }),
    []
  );

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const token = viewableItems.find((v) => v.isViewable);
    const item = token?.item as PostCardModel | undefined;
    if (item) setStickyPost(item);
  }, []);

  const handleReportPost = (postId: string) => {
    Alert.alert(
      '게시물 신고',
      '신고 사유를 선택해주세요. (외모 평가, 비하 등은 제재 대상입니다.)',
      [
        { text: '스팸/홍보 도배', onPress: () => createReport({ targetType: 'post', targetId: postId, reasonCode: 'spam' }) },
        { text: '욕설/혐오 발언', onPress: () => createReport({ targetType: 'post', targetId: postId, reasonCode: 'abuse' }) },
        { text: '외모 평가/비하', onPress: () => createReport({ targetType: 'post', targetId: postId, reasonCode: 'appearance_shaming' }) },
        { text: '취소', style: 'cancel' }
      ]
    );
  };

  const chalnas = data?.pages[0]?.chalna || [];

  useEffect(() => {
    const id = setInterval(() => {
      const d = feedDataRef.current;
      const raw = d?.pages.flatMap((page) => page.items) ?? [];
      const ch = d?.pages[0]?.chalna ?? [];
      /** 만료 직후엔 `anyLive`가 false라 틱이 멈추고, 캐시에 남은 찰나 카드가 그대로 보일 수 있음 */
      const mayNeedChalnaRefresh =
        ch.length > 0 || raw.some((p) => p.postType === 'chalna');
      if (mayNeedChalnaRefresh) setChalnaWave((w) => w + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const feedItems = useMemo(() => {
    const rawPosts = data?.pages.flatMap((page) => page.items) || [];
    const liveStrip = chalnas.filter((c) => isChalnaLiveByExpiresAt(c.expiresAt));

    const mappedChalnas = liveStrip.map((c): PostCardModel => ({
      postId: c.postId,
      postType: 'chalna',
      author: c.author,
      images: [{ imageUrl: c.thumbnailImageUrl, width: 800, height: 800 }],
      caption: c.caption,
      moodTags: c.moodTags,
      reactionSummary: c.reactionSummary,
      commentsCount: 0,
      bookmarked: false,
      createdAt: new Date().toISOString(),
      visibility: 'public',
      expiresAt: c.expiresAt,
      remainingSeconds: chalnaSecondsRemainingFromExpiry(c.expiresAt)
    }));

    const chalnaIds = new Set(liveStrip.map((c) => c.postId));
    const filteredPosts = rawPosts.filter((p) => {
      if (chalnaIds.has(p.postId)) return false;
      if (p.postType === 'chalna') {
        if (p.expiresAt && !isChalnaLiveByExpiresAt(p.expiresAt)) return false;
        if (
          (!p.expiresAt || Number.isNaN(Date.parse(p.expiresAt))) &&
          p.remainingSeconds !== undefined &&
          p.remainingSeconds <= 0
        ) {
          return false;
        }
      }
      return true;
    });

    const intertwined = [...filteredPosts];
    mappedChalnas.forEach((chalna, idx) => {
      const insertIndex = Math.min(Math.max(0, idx * 3 + 2), intertwined.length);
      intertwined.splice(insertIndex, 0, chalna);
    });

    return intertwined;
  }, [data?.pages, chalnas, chalnaWave]);

  useEffect(() => {
    if (!feedItems.length) {
      setStickyPost(null);
      return;
    }
    setStickyPost((prev) => {
      if (prev && feedItems.some((p) => p.postId === prev.postId)) return prev;
      return feedItems[0];
    });
  }, [feedItems, currentTab]);

  useEffect(() => {
    setFeedScrollY(0);
  }, [currentTab]);

  const handleReactionChange = useCallback((postId: string, score: PawScore, originalSummary: ReactionSummary) => {
    const prev = reactionOverrides.current[postId] || originalSummary;
    const oldScore = prev.myScore;
    const oldCount = prev.reactionsCount;
    const oldAvg = prev.averageScore;

    let newCount = oldCount;
    let newAvg = oldAvg;
    if (oldScore == null) {
      newCount = oldCount + 1;
      newAvg = newCount > 0 ? (oldAvg * oldCount + score) / newCount : score;
    } else {
      newAvg = oldCount > 0 ? (oldAvg * oldCount - oldScore + score) / oldCount : score;
    }

    reactionOverrides.current[postId] = {
      ...prev,
      myScore: score,
      averageScore: newAvg,
      reactionsCount: newCount,
    };
    forceUpdate(n => n + 1);
    updateReaction({ postId, data: { score } });
  }, [updateReaction]);

  const renderChalnaHeader = useCallback(() => {
    if (!chalnas.some((c) => isChalnaLiveByExpiresAt(c.expiresAt))) {
      return null;
    }
    return (
      <View style={styles.chalnaHeader}>
        <Text style={styles.chalnaMiniLabel}>오늘의 찰나</Text>
        <ChalnaStrip
          items={chalnas}
          onPressItem={(postId) => router.push(`/chalna/${postId}`)}
        />
        <View style={styles.feedSpacer} />
      </View>
    );
  }, [chalnas, chalnaWave, router]);

  if (isLoading) {
    return (
      <Screen header={
        <AppHeader
          leftSlot={
            <Text style={{ fontFamily: 'DungGeunMo', fontSize: 24, color: colors.lavender400 }}>
              YEO:UN
            </Text>
          }
        />
      }>
        <ActivityIndicator size="large" color={colors.lavender400} style={{ marginTop: 100 }} />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen
        scroll
        header={
          <AppHeader
            leftSlot={
              <Text style={{ fontFamily: 'DungGeunMo', fontSize: 24, color: colors.lavender400 }}>
                YEO:UN
              </Text>
            }
          />
        }
      >
        <View style={{ paddingHorizontal: 24, paddingTop: 32, gap: 12 }}>
          <Text style={{ textAlign: 'center', fontFamily: 'DungGeunMo', color: colors.ink900 }}>
            피드를 불러오지 못했어요
          </Text>
          <Text style={{ textAlign: 'center', ...typography.caption, color: colors.warmGray500 }}>
            {error instanceof Error ? error.message : '네트워크·로그인·API 주소를 확인해 주세요.'}
          </Text>
          <Pressable onPress={() => refetch()} style={{ alignSelf: 'center', paddingVertical: 12 }}>
            <Text style={{ fontFamily: 'DungGeunMo', color: colors.lavender500 }}>다시 시도</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scroll={false}
      header={
        <AppHeader
          leftSlot={
            <Text style={{ fontFamily: 'DungGeunMo', fontSize: 24, color: colors.lavender400 }}>
              YEO:UN
            </Text>
          }
          rightSlot={
            <IconButton
              name="bell"
              accessibilityLabel="알림"
              onPress={() => router.push('/notifications')}
            />
          }
        />
      }
    >
      <View style={styles.feedScreenBody}>
        <JellyFeedTabs currentTab={currentTab} onTabChange={setCurrentTab} />
        {showAuthorContextStrip && stickyPost ? (
          <HomeFeedContextStrip
            post={stickyPost}
            onPressProfile={() => router.push(`/profile/${stickyPost.author.userId}`)}
            onReport={() => handleReportPost(stickyPost.postId)}
          />
        ) : null}
        <FlatList
          key={currentTab}
          style={styles.feedList}
          data={feedItems}
          extraData={reactionOverrides.current}
          keyExtractor={(item) => item.postType === 'chalna' ? `chalna-${item.postId}` : item.postId}
          ListEmptyComponent={
            <Text style={[typography.bodyM, styles.feedEmptyHint]}>
              아직 피드에 글이 없어요. DB 시드 후 다시 불러오거나, 업로드해 보세요.
            </Text>
          }
          ListHeaderComponent={renderChalnaHeader}
          keyboardShouldPersistTaps="always"
          ItemSeparatorComponent={() => <View style={styles.feedSpacer} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: listBottomPad }}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          onScroll={onFeedScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => {
          const override = reactionOverrides.current[item.postId];
          const post = override
            ? { ...item, reactionSummary: override }
            : item;
          return (
            <FeedCard
              layoutMode="home"
              onChangeReaction={(score) => handleReactionChange(post.postId, score, item.reactionSummary)}
              onPress={() => router.push(post.postType === 'chalna' ? `/chalna/${post.postId}` : `/post/${post.postId}`)}
              onPressProfile={() => router.push(`/profile/${post.author.userId}`)}
              onPressMoodTagWalk={(tag) =>
                router.push(`/(tabs)/walk?moodTagId=${encodeURIComponent(tag.id)}`)
              }
              onReport={() => handleReportPost(post.postId)}
              post={post}
            />
          );
        }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chalnaHeader: {
    paddingTop: spacing.xs,
    backgroundColor: colors.cream50, // Match screen background so it flows seamlessly
  },
  chalnaMiniLabel: {
    ...typography.label,
    color: colors.warmGray500,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  tabsWrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.cream50,
    zIndex: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: colors.lavender400,
  },
  jellyBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: colors.lavender400,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  tabLabel: {
    ...typography.bodyM,
    fontFamily: 'DungGeunMo',
    color: colors.ink700,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: colors.white,
  },
  feedSpacer: {
    height: spacing.xxxl,
  },
  feedScreenBody: {
    flex: 1,
  },
  feedList: {
    flex: 1,
  },
  feedEmptyHint: {
    textAlign: 'center',
    marginTop: 48,
    paddingHorizontal: spacing.lg,
    color: colors.warmGray500,
    fontFamily: 'DungGeunMo',
  },
  feedContextStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 6,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink100,
  },
  feedContextProfileHit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  feedContextReportHit: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedContextAvatar: {
    width: 22,
    height: 22,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.lavender400,
    backgroundColor: colors.ink100,
  },
  feedContextTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  feedContextNick: {
    ...typography.bodyS,
    fontFamily: 'DungGeunMo',
    color: colors.ink900,
    fontWeight: '700',
  },
  feedContextHandle: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.warmGray500,
  },
});
