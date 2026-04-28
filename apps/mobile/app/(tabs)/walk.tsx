import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import {
  AppHeader,
  Screen,
  SectionTitle,
  TagChip,
  colors,
  spacing,
  typography
} from '@gamdojang/ui';
import { isChalnaLiveByExpiresAt } from '@gamdojang/domain';
import { useDebouncedValue } from '../../src/hooks/use-debounced-value';
import { useExplore } from '../../src/hooks/use-explore';
import { useSearch } from '../../src/hooks/use-search';

/** 1열은 낮게 · 2·3열은 위로 (지그재그 리듬만, 가로 다음 페이지와는 무관) */
const GALLERY_COL_STAGGER = spacing.xxxl + spacing.sm;

export default function WalkTabRoute() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ moodTagId?: string | string[] }>();
  const moodTagIdFromRoute = useMemo(() => {
    const v = searchParams.moodTagId;
    if (v == null) return undefined;
    return Array.isArray(v) ? v[0] : v;
  }, [searchParams.moodTagId]);

  const [keyword, setKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState<'trending' | 'today' | 'niche' | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | undefined>(undefined);
  const [mixEpoch, setMixEpoch] = useState(0);

  const walkScrollRef = useRef<ScrollView>(null);
  const walkScrollYRef = useRef(0);
  const galleryPageIndexRef = useRef(0);
  /** 세로 스크롤에서 갤러리(폴라로이드 그리드) 시작 Y — [ SYSTEM OK ] 배너 직후 */
  const galleryAnchorScrollYRef = useRef(0);

  const onWalkScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    walkScrollYRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  const onWalkAboveGalleryLayout = useCallback((e: LayoutChangeEvent) => {
    const { y, height } = e.nativeEvent.layout;
    galleryAnchorScrollYRef.current = y + height;
  }, []);

  const onGalleryHorizontalScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const w = Dimensions.get('window').width;
      const page = Math.round(e.nativeEvent.contentOffset.x / w);
      const prev = galleryPageIndexRef.current;
      if (page === prev) return;
      galleryPageIndexRef.current = page;
      const deltaPages = page - prev;
      // 오른쪽(이전 페이지): SYSTEM OK 배너 바로 아래까지 세로 스크롤 올림 · 왼쪽(다음)은 세로 건드리지 않음
      if (deltaPages < 0) {
        const anchor = Math.max(0, galleryAnchorScrollYRef.current);
        walkScrollRef.current?.scrollTo({ y: anchor, animated: true });
        walkScrollYRef.current = anchor;
      }
    },
    []
  );

  useEffect(() => {
    if (!moodTagIdFromRoute) return;
    setKeyword('');
    setActiveCategory(null);
    setSelectedTagId(moodTagIdFromRoute);
    router.replace('/(tabs)/walk');
  }, [moodTagIdFromRoute, router]);

  const { data: exploreData, isLoading: exploreLoading, isFetching: exploreFetching } = useExplore(
    'popular',
    selectedTagId,
    mixEpoch
  );

  const exploreItemsRaw = exploreData?.items ?? [];
  const [exploreChalnaTick, setExploreChalnaTick] = useState(0);

  useEffect(() => {
    if (!exploreItemsRaw.some((p) => p.postType === 'chalna')) return;
    const id = setInterval(() => setExploreChalnaTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [exploreItemsRaw]);

  const exploreItems = useMemo(() => {
    void exploreChalnaTick;
    return exploreItemsRaw.filter(
      (p) => p.postType !== 'chalna' || isChalnaLiveByExpiresAt(p.expiresAt)
    );
  }, [exploreItemsRaw, exploreChalnaTick]);

  const onExploreRefresh = useCallback(() => {
    setMixEpoch(Date.now());
  }, []);

  const trimmedKeyword = useMemo(() => keyword.trim(), [keyword]);
  const debouncedSearchQuery = useDebouncedValue(trimmedKeyword, 280);
  const inSearchMode = trimmedKeyword.length > 0;
  const searchDebouncePending = inSearchMode && debouncedSearchQuery !== trimmedKeyword;
  const {
    data: searchData,
    isFetching: searchFetching,
    isError: searchError,
    refetch: refetchSearch
  } = useSearch(debouncedSearchQuery);
  const searchBusy = inSearchMode && (searchDebouncePending || searchFetching);

  const categories = [
    { id: 'trending', label: '급상승 착장 #' },
    { id: 'today', label: '오늘의 무드 #' },
    { id: 'niche', label: '마이너 취향 #' }
  ];

  const allTags = exploreData?.popular_tags || [];
  const chunkCount = Math.ceil(allTags.length / 3) || 1;
  const categorizedTags = {
    trending: allTags.slice(0, chunkCount),
    today: allTags.slice(chunkCount, chunkCount * 2),
    niche: allTags.slice(chunkCount * 2)
  };

  const activeTags = activeCategory ? categorizedTags[activeCategory as keyof typeof categorizedTags] : [];

  useEffect(() => {
    galleryPageIndexRef.current = 0;
  }, [mixEpoch, exploreItems.length]);

  const chunkSize = 12;
  const explorePages = [];
  for (let i = 0; i < exploreItems.length; i += chunkSize) {
    explorePages.push(exploreItems.slice(i, i + chunkSize));
  }
  const screenWidth = Dimensions.get('window').width;

  return (
    <Screen scroll={false} header={<AppHeader title="산책" />}>
      <ScrollView
        ref={walkScrollRef}
        style={styles.walkScroll}
        contentContainerStyle={styles.walkScrollContent}
        keyboardShouldPersistTaps="handled"
        onScroll={onWalkScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={!inSearchMode && !exploreLoading && exploreFetching}
            onRefresh={() => {
              if (trimmedKeyword.length > 0) return;
              onExploreRefresh();
            }}
            tintColor={colors.lavender500}
            colors={[colors.lavender500]}
          />
        }
      >
      <View onLayout={onWalkAboveGalleryLayout}>
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="C:\OOTD_SEARCH> _"
          placeholderTextColor={colors.ink500}
          style={styles.search}
          value={keyword}
          onChangeText={setKeyword}
          autoCorrect={false}
          spellCheck={false}
        />
      </View>

      <Pressable
        style={styles.pieceFindCard}
        onPress={() => router.push('/piece-find')}
        accessibilityRole="button"
        accessibilityLabel="취향 조각 모드로 이동"
      >
        <View style={styles.pieceFindCardInner}>
          <Text style={styles.pieceFindTitle}>취향 조각 고르기</Text>
          <Text style={styles.pieceFindSub}>두 룩 중 더 끌리는 쪽에 여운을 남겨보세요</Text>
          <Text style={styles.pieceFindMeta}>룩 · 핏 · 무드만 골라요</Text>
        </View>
      </Pressable>

      {!inSearchMode && (
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
              <Pressable
                key={cat.id}
                style={[styles.categoryBtn, isActive && styles.categoryBtnActive]}
                onPress={() => {
                  if (activeCategory === cat.id) {
                    setActiveCategory(null);
                    setSelectedTagId(undefined);
                  } else {
                    setActiveCategory(cat.id as 'trending' | 'today' | 'niche');
                    setSelectedTagId(undefined);
                  }
                }}
              >
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
            })}
          </ScrollView>

          {activeCategory && activeTags.length > 0 && (
            <View style={styles.tagFiltersContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagFiltersList}>
                {activeTags.map(tag => (
                  <Pressable 
                    key={tag.id} 
                    style={[styles.tagFilterBtn, selectedTagId === tag.id && styles.tagFilterBtnActive]}
                    onPress={() => setSelectedTagId(selectedTagId === tag.id ? undefined : tag.id)}
                  >
                    <Text style={[styles.tagFilterText, selectedTagId === tag.id && styles.tagFilterTextActive]}>
                      #{tag.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.systemBanner}>
            <Text style={styles.systemBannerText}>
              {`[ SYSTEM OK ] ARCHIVE READY ... \n>_ 좌우로 넘기면 다음 페이지 · 위에서 당기면 다른 룩 30컷`}
            </Text>
          </View>
        </View>
      )}
      </View>

      {inSearchMode ? (
        <View style={styles.searchResultContainer}>
          {searchBusy ? (
            <Text style={styles.loadingText}>[ SYSTEM SYSTEM : FINDING ▒▒▒▒░░ ]</Text>
          ) : searchError ? (
            <View style={styles.searchErrorBox}>
              <Text style={styles.emptyText}>검색을 불러오지 못했어요.</Text>
              <Pressable
                onPress={() => void refetchSearch()}
                style={styles.searchRetryBtn}
                accessibilityRole="button"
                accessibilityLabel="검색 다시 시도"
              >
                <Text style={styles.searchRetryText}>다시 시도</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <SectionTitle>발견한 룩</SectionTitle>
              <View style={styles.searchPostsGrid}>
                {(searchData?.posts?.length ?? 0) === 0 && (
                  <Text style={styles.emptyText}>캡션이나 장소에 이어진 룩이 없어요.</Text>
                )}
                {searchData?.posts?.map((post) => (
                  <Pressable
                    key={post.postId}
                    onPress={() => router.push(`/post/${post.postId}`)}
                    style={styles.searchPostCell}
                  >
                    <View style={styles.searchPostFrame}>
                      <Image
                        source={{
                          uri: post.images[0]?.imageUrl || 'https://via.placeholder.com/320x427'
                        }}
                        style={styles.searchPostImage}
                      />
                      <Text numberOfLines={1} style={styles.searchPostCaption}>
                        {post.caption?.trim() ? post.caption : '>_ 무드만 전해요'}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>

              <SectionTitle>무드 태그</SectionTitle>
              <View style={styles.tagWrap}>
                {(searchData?.tags?.length ?? 0) === 0 && (
                  <Text style={styles.emptyText}>이름에 맞는 태그가 없어요.</Text>
                )}
                {searchData?.tags?.map((tag) => (
                  <TagChip
                    key={tag.id}
                    accentColor={tag.accentColor}
                    label={tag.name}
                    onPress={() => {
                      setKeyword('');
                      setSelectedTagId(tag.id);
                    }}
                  />
                ))}
              </View>

              <SectionTitle>발견한 사람들</SectionTitle>
              <View style={styles.userRow}>
                {(searchData?.users?.length ?? 0) === 0 && (
                  <Text style={styles.emptyText}>닉네임·소개에 맞는 프로필이 없어요.</Text>
                )}
                {searchData?.users?.map((user, index) => (
                  <Pressable
                    key={user.userId}
                    style={[
                      styles.userCard,
                      { transform: [{ rotate: `${index % 2 === 0 ? -3 : 3}deg` }] }
                    ]}
                    onPress={() => router.push(`/profile/${user.userId}`)}
                  >
                    <Image source={{ uri: user.profileImageUrl }} style={styles.avatar} />
                    <Text style={styles.userName}>{user.nickname}</Text>
                    {user.representativeMoodTag && (
                      <Text style={styles.userTag}>#{user.representativeMoodTag.name}</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>
      ) : (
        // Explore View (Museum / Gallery Feel)
        <View style={styles.exploreContainer}>
          {exploreLoading ? (
            <Text style={styles.loadingText}>[ SYSTEM : LOADING ▒▒▒▒░░ ]</Text>
          ) : (
            <>
              <View style={styles.gallerySection}>
                <ScrollView 
                  horizontal 
                  pagingEnabled 
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  onMomentumScrollEnd={onGalleryHorizontalScrollEnd}
                >
                  {explorePages.map((page, pageIndex) => (
                    <View key={`page-${pageIndex}`} style={{ width: screenWidth }}>
                      <View style={styles.masonryGrid}>
                        {page.map((post, index) => {
                          const isTasteVariant = index % 5 === 4; // 20% of posts are deemed "taste/mood"
                          const col = index % 3;
                          return (
                            <Pressable
                              key={post.postId}
                              onPress={() => router.push(`/post/${post.postId}`)}
                              style={[
                                styles.masonryItem,
                                isTasteVariant && styles.tasteVariantItem,
                                isTasteVariant && { alignSelf: index % 2 === 0 ? 'flex-start' : 'flex-end' },
                                col === 0 ? styles.masonryItemColFirst : styles.masonryItemColRaised,
                                { 
                                  transform: [
                                    { rotate: `${((index + pageIndex) % 3 === 0 ? -3 : (index + pageIndex) % 3 === 1 ? 2.5 : -1.5)}deg` }, 
                                    { translateX: (index + pageIndex) % 2 === 0 ? 5 : -4 },
                                    { translateY: (index + pageIndex) % 2 !== 0 ? 2 : -1 }
                                  ] 
                                }
                              ]}
                            >
                              <View style={[styles.frame, isTasteVariant && styles.tasteVariantFrame]}>
                                <Image source={{ uri: post.images[0].imageUrl }} style={styles.framedImage} />
                                <View style={styles.frameInfo}>
                                  {!isTasteVariant ? (
                                    <>
                                      <Text numberOfLines={1} style={styles.frameAuthor}>
                                        {post.author.nickname}
                                      </Text>
                                      <Text numberOfLines={1} style={styles.frameReaction}>
                                        {'>_ '}
                                        {post.reactionSummary.reactionsCount > 0
                                          ? post.reactionSummary.reactionsCount
                                          : '0'}
                                      </Text>
                                    </>
                                  ) : (
                                    <Text numberOfLines={1} style={styles.tasteLogLabel}>
                                      [ TASTE LOG ]
                                    </Text>
                                  )}
                                </View>
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </>
          )}
        </View>
      )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  walkScroll: {
    flex: 1
  },
  walkScrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm
  },
  pieceFindCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.lavender400,
    borderBottomWidth: 4,
    backgroundColor: colors.lavender50
  },
  pieceFindCardInner: {
    padding: spacing.lg,
    gap: spacing.xs
  },
  pieceFindTitle: {
    ...typography.bodyL,
    fontFamily: 'DungGeunMo',
    color: colors.ink900,
    fontWeight: 'bold'
  },
  pieceFindSub: {
    ...typography.bodyM,
    fontFamily: 'DungGeunMo',
    color: colors.ink700
  },
  pieceFindMeta: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.ink500
  },
  search: {
    minHeight: 56,
    borderRadius: 0,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    color: colors.ink900,
    ...typography.bodyL,
    fontFamily: 'DungGeunMo',
    borderWidth: 2,
    borderColor: colors.lavender400,
    borderBottomWidth: 4, 
  },
  categoryContainer: {
    backgroundColor: colors.white,
    marginBottom: spacing.xs,
  },
  categoryList: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  /** 산책 해시 카테고리: 흰 박스 + 검정 글씨, 선택 시 라벤더 테두리 */
  categoryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.ink900
  },
  categoryBtnActive: {
    backgroundColor: colors.white,
    borderColor: colors.lavender400,
    borderBottomWidth: 4
  },
  categoryText: {
    ...typography.bodyM,
    fontFamily: 'DungGeunMo',
    color: colors.ink900
  },
  categoryTextActive: {
    fontWeight: 'bold'
  },
  tagFiltersContainer: {
    paddingBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.lavender400,
    backgroundColor: colors.white,
  },
  tagFiltersList: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    alignItems: 'center',
  },
  tagFilterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: colors.warmGray200,
    backgroundColor: colors.white,
    borderRadius: 0,
  },
  tagFilterBtnActive: {
    borderColor: colors.ink900,
    backgroundColor: colors.lavender300,
    borderBottomWidth: 4,
  },
  tagFilterText: {
    ...typography.bodyM,
    fontFamily: 'DungGeunMo',
    color: colors.ink500,
  },
  tagFilterTextActive: {
    color: colors.ink900,
    fontWeight: 'bold',
  },
  systemBanner: {
    backgroundColor: colors.lavender50,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.lavender400,
    marginBottom: spacing.md,
  },
  systemBannerText: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.ink900,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  searchResultContainer: {
    gap: spacing.xl,
    paddingTop: spacing.md
  },
  loadingText: {
    ...typography.bodyL,
    fontFamily: 'DungGeunMo',
    color: colors.ink900,
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },
  exploreContainer: {
    gap: spacing.xxl,
    paddingBottom: 80
  },
  gallerySection: {
    gap: spacing.md
  },
  horizontalTagScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.sm
  },
  galleryTag: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: 0,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lavender400,
  },
  galleryTagSelected: {
    backgroundColor: colors.lavender400,
  },
  galleryTagText: {
    ...typography.bodyM,
    fontFamily: 'DungGeunMo',
    color: colors.ink700
  },
  galleryTagTextSelected: {
    color: colors.white,
  },
  masonryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    justifyContent: 'space-between',
    gap: 8,
  },
  masonryItem: {
    width: '31%',
    marginBottom: spacing.xl
  },
  masonryItemColFirst: {
    marginTop: GALLERY_COL_STAGGER
  },
  masonryItemColRaised: {
    marginTop: 0
  },
  tasteVariantItem: {
    width: '50%',
    marginBottom: spacing.xxl,
    marginLeft: 10,
    marginRight: 10,
  },
  frame: {
    width: '100%',
    aspectRatio: 3/4,
    backgroundColor: colors.white,
    padding: 6, 
    borderRadius: 0,
    borderWidth: 2,
    borderColor: colors.lavender400,
    borderBottomWidth: 4, 
    marginBottom: spacing.sm
  },
  /** 취향 변형: 일반 폴라로이드와 같은 라벤더 리듬(검정 필 제거) */
  tasteVariantFrame: {
    backgroundColor: colors.lavender100,
    borderColor: colors.lavender400,
    padding: 6,
    borderBottomWidth: 4,
  },
  tasteLogLabel: {
    ...typography.caption,
    fontSize: 10,
    fontFamily: 'DungGeunMo',
    color: colors.lavender500,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
  },
  framedImage: {
    width: '100%',
    flex: 1,
    borderRadius: 0,
    backgroundColor: colors.ink100,
    borderWidth: 1,
    borderColor: colors.lavender400,
  },
  frameInfo: {
    paddingTop: 8,
    paddingBottom: 2,
    gap: 2
  },
  frameAuthor: {
    ...typography.caption,
    fontSize: 10,
    fontFamily: 'DungGeunMo',
    color: colors.ink900,
    fontWeight: 'bold',
  },
  frameReaction: {
    ...typography.caption,
    fontSize: 10,
    fontFamily: 'DungGeunMo',
    color: colors.ink900
  },
  emptyText: {
    ...typography.bodyM,
    fontFamily: 'DungGeunMo',
    color: colors.ink900,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg
  },
  userRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg
  },
  userCard: {
    width: 100,
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 0,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lavender400,
    borderBottomWidth: 4,
    padding: spacing.md
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: colors.lavender400,
  },
  userName: {
    ...typography.bodyM,
    fontFamily: 'DungGeunMo',
    color: colors.ink900,
  },
  userTag: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.ink900
  },
  searchPostsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    justifyContent: 'flex-start'
  },
  searchPostCell: {
    width: '31%'
  },
  searchPostFrame: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lavender400,
    borderBottomWidth: 4,
    padding: 4,
    gap: 4
  },
  searchPostImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.ink100,
    borderWidth: 1,
    borderColor: colors.lavender400
  },
  searchPostCaption: {
    ...typography.caption,
    fontSize: 9,
    fontFamily: 'DungGeunMo',
    color: colors.ink900
  },
  searchErrorBox: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.md,
    alignItems: 'center'
  },
  searchRetryBtn: {
    borderWidth: 2,
    borderColor: colors.lavender400,
    borderBottomWidth: 4,
    backgroundColor: colors.lavender50,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm
  },
  searchRetryText: {
    ...typography.bodyM,
    fontFamily: 'DungGeunMo',
    color: colors.ink900,
    fontWeight: 'bold'
  }
});