import { chalnaSecondsRemainingFromExpiry, isChalnaLiveByExpiresAt } from '@gamdojang/domain';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  AppHeader,
  IconButton,
  Screen,
  colors,
  radii,
  spacing,
  typography
} from '@gamdojang/ui';
import { useProfile } from '../../src/hooks/use-profile';
import { useBookmarks } from '../../src/hooks/use-bookmarks';
import { DraggablePostGrid } from '../../src/components/draggable-post-grid';
import { HolographicCard } from '../../src/components/holographic-card';

export default function MoodCardTabRoute() {
  const router = useRouter();
  const { data: profileSummary, isLoading: profileLoading } = useProfile('me');
  const { data: bookmarksData, isLoading: bookmarksLoading } = useBookmarks();

  const [activeTab, setActiveTab] = useState<'posts' | 'bookmarks'>('posts');
  const [chalnaWave, setChalnaWave] = useState(0);
  const profileRef = useRef(profileSummary);
  profileRef.current = profileSummary;

  useEffect(() => {
    const id = setInterval(() => {
      const ch = profileRef.current?.currentChalna;
      if (!ch || !isChalnaLiveByExpiresAt(ch.expiresAt)) return;
      setChalnaWave((w) => w + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const chalnaRemainingSec = useMemo(() => {
    const currentChalna = profileSummary?.currentChalna;
    if (!currentChalna || !isChalnaLiveByExpiresAt(currentChalna.expiresAt)) return 0;
    return chalnaSecondsRemainingFromExpiry(currentChalna.expiresAt);
  }, [profileSummary?.currentChalna, chalnaWave]);

  const bookmarkPosts = useMemo(
    () => bookmarksData?.pages.flatMap((page) => page.items) || [],
    [bookmarksData]
  );

  const gridPosts = useMemo(
    () =>
      (profileSummary?.posts ?? []).filter(
        (p) => p.postType !== 'chalna' || isChalnaLiveByExpiresAt(p.expiresAt)
      ),
    [profileSummary?.posts]
  );

  if (profileLoading) {
    return (
      <Screen header={<AppHeader title="해시카드" />}>
        <ActivityIndicator size="large" color={colors.lavender500} style={{ marginTop: 100 }} />
      </Screen>
    );
  }

  if (!profileSummary) {
    return (
      <Screen header={<AppHeader title="해시카드" />}>
        <Text style={{ textAlign: 'center', marginTop: 100 }}>프로필을 불러올 수 없습니다.</Text>
      </Screen>
    );
  }

  const { user, bio, averagePawScore, followersCount, receivedReactionsCount, representativeMoodTags, currentChalna } = profileSummary;
  const accentColor = representativeMoodTags[0]?.accentColor || colors.pink100;
  const showLiveChalna =
    currentChalna && isChalnaLiveByExpiresAt(currentChalna.expiresAt);

  return (
    <Screen
      header={
        <AppHeader
          rightSlot={
            <IconButton
              accessibilityLabel="설정"
              name="settings"
              onPress={() => router.push('/settings')}
            />
          }
          title="해시카드"
        />
      }
    >
      <HolographicCard
        accentColor={accentColor}
        averagePawScore={averagePawScore}
        user={user}
        bio={bio}
        representativeMoodTags={representativeMoodTags}
        followersCount={followersCount}
        receivedReactionsCount={receivedReactionsCount}
        onEditPress={() => router.push('/profile/edit?returnTo=mood-card')}
        style={{ marginTop: spacing.md, marginBottom: spacing.xl }}
      />

      {showLiveChalna ? (
        <TouchableOpacity
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="현재 찰나 게시물 열기"
          style={styles.currentChalna}
          onPress={() => router.push(`/chalna/${currentChalna.postId}`)}
        >
          <View style={styles.chalnaHeader}>
            <Text style={styles.chalnaTitle}>현재 찰나</Text>
            <Text style={styles.chalnaTime}>
              남은 시간{' '}
              {chalnaRemainingSec >= 3600
                ? `${Math.floor(chalnaRemainingSec / 3600)}시간`
                : chalnaRemainingSec >= 60
                  ? `${Math.floor(chalnaRemainingSec / 60)}분`
                  : `${Math.max(0, chalnaRemainingSec)}초`}
            </Text>
          </View>
          <Text style={styles.chalnaCaption} numberOfLines={2}>{currentChalna.caption}</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.tabHeader}>
        <Pressable 
          style={[styles.tabPill, activeTab === 'posts' && styles.tabPillActive]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>조각</Text>
        </Pressable>
        <Pressable 
          style={[styles.tabPill, activeTab === 'bookmarks' && styles.tabPillActive]}
          onPress={() => setActiveTab('bookmarks')}
        >
          <Text style={[styles.tabText, activeTab === 'bookmarks' && styles.tabTextActive]}>보관함</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {activeTab === 'posts' ? (
          gridPosts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Image 
                source={require('../../../../assets/archive_empty_transparent.png')} 
                style={styles.emptyImage} 
                resizeMode="contain" 
              />
              <Text style={styles.emptyText}>기록된 룩이 없습니다.</Text>
            </View>
          ) : (
            <View style={styles.gridPostsHost}>
              <DraggablePostGrid posts={gridPosts} />
            </View>
          )
        ) : (
          bookmarksLoading ? (
             <ActivityIndicator size="small" color={colors.lavender500} />
          ) : bookmarkPosts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Image 
                source={require('../../../../assets/archive_empty_transparent.png')} 
                style={styles.emptyImage} 
                resizeMode="contain" 
              />
              <Text style={styles.emptyText}>보관한 룩이 없습니다.</Text>
            </View>
          ) : (
            bookmarkPosts.map((post) => (
              <Pressable
                key={post.postId}
                onPress={() => router.push(`/post/${post.postId}`)}
                style={styles.gridItem}
              >
                <Image source={{ uri: post.images[0].imageUrl }} style={styles.gridImage} />
              </Pressable>
            ))
          )
        )}
      </View>
    </Screen>
  );
}


const styles = StyleSheet.create({
  currentChalna: {
    borderRadius: 0,
    backgroundColor: colors.lavender50,
    borderWidth: 2,
    borderColor: colors.lavender400,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginHorizontal: spacing.lg
  },
  chalnaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  chalnaTitle: {
    ...typography.label,
    fontFamily: 'DungGeunMo',
    color: colors.ink900
  },
  chalnaTime: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.lavender500
  },
  chalnaCaption: {
    ...typography.bodyM,
    fontFamily: 'DungGeunMo',
    color: colors.ink900
  },
  tabHeader: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  tabPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.warmGray100,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabPillActive: {
    backgroundColor: colors.lavender100,
    borderColor: colors.lavender300,
  },
  tabText: {
    ...typography.bodyS,
    fontFamily: 'DungGeunMo',
    color: colors.warmGray400,
  },
  tabTextActive: {
    color: colors.lavender500,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg
  },
  /** 조각 탭: 절대좌표 그리드가 부모 row/flexWrap에 깨지지 않게 한 줄 전체 폭 사용 */
  gridPostsHost: {
    width: '100%'
  },
  gridItem: {
    width: '47%',
    marginBottom: spacing.md
  },
  gridImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radii.md,
    backgroundColor: colors.warmGray100
  },
  emptyContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md
  },
  emptyImage: {
    width: 120,
    height: 120,
    opacity: 0.8
  },
  emptyText: {
    ...typography.bodyM,
    color: colors.warmGray400,
    textAlign: 'center',
  }
});