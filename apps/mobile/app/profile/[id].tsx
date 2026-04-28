import { chalnaSecondsRemainingFromExpiry, isChalnaLiveByExpiresAt } from '@gamdojang/domain';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AppHeader,
  Button,
  Screen,
  colors,
  radii,
  spacing,
  typography
} from '@gamdojang/ui';
import { HolographicCard } from '../../src/components/holographic-card';
import { useProfile } from '../../src/hooks/use-profile';
import { useToggleBlock, useToggleFollow } from '../../src/hooks/use-interactions';
import { useCreateMessageRequest } from '../../src/hooks/use-messages';

function normalizeRouteIdParam(raw: string | string[] | undefined): string {
  if (raw === undefined) return '';
  return Array.isArray(raw) ? (raw[0] ?? '') : raw;
}

export default function UserProfileRoute() {
  const router = useRouter();
  const { id: idParam } = useLocalSearchParams<{ id?: string | string[] }>();
  const routeId = normalizeRouteIdParam(idParam);

  /** 내 userId만 필요할 때는 `me` 요약, 화면 데이터는 항상 URL의 `routeId`로 조회해 홈→프로필 진입 시 캐시가 어긋나지 않게 함 */
  const { data: mySummary } = useProfile('me');
  const isOwnProfile = !!(mySummary && routeId && mySummary.user.userId === routeId);

  const { data: profileSummary, isLoading: profileLoading } = useProfile(routeId);
  const { mutate: toggleFollow, isPending: followPending } = useToggleFollow();
  const { mutate: toggleBlock, isPending: blockPending } = useToggleBlock();
  const { mutate: sendMessageRequest, isPending: mailPending } = useCreateMessageRequest();
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
  }, [routeId]);

  const chalnaRemainingSec = useMemo(() => {
    const currentChalna = profileSummary?.currentChalna;
    if (!currentChalna || !isChalnaLiveByExpiresAt(currentChalna.expiresAt)) return 0;
    return chalnaSecondsRemainingFromExpiry(currentChalna.expiresAt);
  }, [profileSummary?.currentChalna, chalnaWave]);

  if (profileLoading) {
    return (
      <Screen header={<AppHeader title="프로필" onBack={() => router.back()} />}>
        <ActivityIndicator size="large" color={colors.lavender500} style={{ marginTop: 100 }} />
      </Screen>
    );
  }

  if (!profileSummary) {
    return (
      <Screen header={<AppHeader title="프로필" onBack={() => router.back()} />}>
        <Text style={{ textAlign: 'center', marginTop: 100 }}>사용자를 찾을 수 없거나 차단된 계정입니다.</Text>
      </Screen>
    );
  }

  const { user, bio, averagePawScore, followersCount, receivedReactionsCount, representativeMoodTags, currentChalna, posts, isFollowing, isBlockedByMe } = profileSummary;
  const accentColor = representativeMoodTags[0]?.accentColor || colors.pink100;
  const showLiveChalna =
    currentChalna && isChalnaLiveByExpiresAt(currentChalna.expiresAt);

  const handleFollow = () => {
    toggleFollow(routeId);
  };

  const handleBlock = () => {
    Alert.alert(
      isBlockedByMe ? '차단 해제' : '사용자 차단',
      isBlockedByMe ? '이 사용자의 차단을 해제하시겠습니까?' : '이 사용자를 차단하시겠습니까? 서로의 게시물을 볼 수 없게 됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: isBlockedByMe ? '해제' : '차단',
          style: isBlockedByMe ? 'default' : 'destructive',
          onPress: () => toggleBlock(routeId),
        },
      ]
    );
  };

  const submitMail = (initialMessage?: string) => {
    sendMessageRequest(
      { targetUserId: routeId, data: initialMessage ? { initialMessage } : {} },
      {
        onSuccess: (data) => {
          if (data.conversationId) router.push(`/chat/${data.conversationId}`);
          else if (data.messageRequestId) {
            Alert.alert('보냈어요', '상대 편지함으로 조용히 전달됐어요.');
          }
        },
        onError: () => {
          Alert.alert('전송 안 됨', '편지 설정이나 네트워크를 확인한 뒤 다시 시도해 주세요.');
        }
      }
    );
  };

  const handleMail = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        '우편 보내기',
        '첫 인사를 적어도 되고, 비워도 괜찮아요.',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '보내기',
            onPress: (text?: string) => {
              const trimmed = text?.trim();
              submitMail(trimmed || undefined);
            }
          }
        ],
        'plain-text'
      );
    } else {
      // TODO(Android): iOS의 Alert.prompt와 동일한 첫 인사 입력은 RN에서 모달/별도 화면으로 구현 필요
      Alert.alert('우편 보내기', '조용히 편지를 건네요. 첫 인사는 나중에 대화에서 이어갈 수 있어요.', [
        { text: '취소', style: 'cancel' },
        { text: '보내기', onPress: () => submitMail(undefined) },
      ]);
    }
  };

  return (
    <Screen
      header={
        <AppHeader
          title={`${user.nickname}님의 무드카드`}
          onBack={() => router.back()}
        />
      }
    >
      <View style={styles.cardWrapper}>
        <HolographicCard
          accentColor={accentColor}
          averagePawScore={averagePawScore}
          user={user}
          bio={bio}
          representativeMoodTags={representativeMoodTags}
          followersCount={followersCount}
          receivedReactionsCount={receivedReactionsCount}
          style={{ marginBottom: spacing.xl }}
          onEditPress={isOwnProfile ? () => router.push('/profile/edit') : undefined}
        />
      </View>

      {mySummary && !isOwnProfile && (
        <View style={styles.actionSection}>
          {isBlockedByMe ? (
            <Button variant="secondary" shape="pixel" fullWidth disabled={blockPending} onPress={handleBlock}>
              차단 해제
            </Button>
          ) : (
            <>
              <Button
                variant={isFollowing ? 'secondary' : 'primary'}
                shape="rounded"
                fullWidth
                disabled={followPending}
                onPress={handleFollow}
              >
                {isFollowing ? '팔로잉' : '팔로우'}
              </Button>
              <View style={styles.actionRowSecond}>
                <View style={styles.actionHalf}>
                  <Button
                    variant="secondary"
                    shape="pixel"
                    fullWidth
                    disabled={mailPending}
                    onPress={handleMail}
                  >
                    우편 보내기
                  </Button>
                </View>
                <View style={styles.actionHalf}>
                  <Button variant="secondary" shape="pixel" fullWidth disabled={blockPending} onPress={handleBlock}>
                    차단
                  </Button>
                </View>
              </View>
            </>
          )}
        </View>
      )}

      {!isBlockedByMe && (
        <>
          {showLiveChalna ? (
            <Pressable 
              style={styles.currentChalna}
              onPress={() => router.push(`/chalna/${currentChalna.postId}`)}
            >
              <View style={styles.chalnaHeader}>
                <View style={styles.chalnaTitleRow}>
                  <View style={styles.chalnaLiveDot} />
                  <Text style={styles.chalnaTitle}>현재 찰나</Text>
                </View>
                <Text style={styles.chalnaTime}>
                  남은{' '}
                  {chalnaRemainingSec >= 3600
                    ? `${Math.floor(chalnaRemainingSec / 3600)}시간`
                    : chalnaRemainingSec >= 60
                      ? `${Math.floor(chalnaRemainingSec / 60)}분`
                      : `${Math.max(0, chalnaRemainingSec)}초`}
                </Text>
              </View>
              <Text style={styles.chalnaCaption} numberOfLines={2}>{currentChalna.caption}</Text>
            </Pressable>
          ) : null}

          <View style={styles.grid}>
            {posts.length === 0 ? (
              <Text style={styles.emptyText}>게시물이 없습니다.</Text>
            ) : (
              posts
                .filter(
                  (post) =>
                    post.postType !== 'chalna' ||
                    (post.expiresAt && isChalnaLiveByExpiresAt(post.expiresAt))
                )
                .map((post) => (
                <Pressable
                  key={post.postId}
                  onPress={() => router.push(`/post/${post.postId}`)}
                  style={[
                    styles.gridItem,
                    post.postType === 'chalna' && styles.gridItemChalna
                  ]}
                >
                  {post.images?.[0]?.imageUrl ? (
                    <Image source={{ uri: post.images[0].imageUrl }} style={styles.gridImage} />
                  ) : (
                    <View style={[styles.gridImage, styles.gridImagePlaceholder]} />
                  )}
                  {post.postType === 'chalna' && (
                    <View style={styles.chalnaBadge}>
                      <Text style={styles.chalnaBadgeText}>찰나</Text>
                    </View>
                  )}
                </Pressable>
              ))
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 0,
    alignItems: 'center'
  },
  actionSection: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md
  },
  actionRowSecond: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%'
  },
  actionHalf: {
    flex: 1,
    minWidth: 0
  },
  currentChalna: {
    borderRadius: radii.lg,
    backgroundColor: colors.lavender500,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginHorizontal: spacing.lg,
    borderWidth: 2,
    borderColor: colors.lavender300,
    shadowColor: colors.lavender500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  chalnaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  chalnaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  chalnaLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
    opacity: 0.9
  },
  chalnaTitle: {
    ...typography.label,
    fontFamily: 'DungGeunMo',
    color: colors.white
  },
  chalnaTime: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.lavender300
  },
  chalnaCaption: {
    ...typography.bodyM,
    fontFamily: 'DungGeunMo',
    color: colors.white
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg
  },
  gridItem: {
    width: '47%',
    marginBottom: spacing.md,
    position: 'relative'
  },
  gridItemChalna: {
    borderWidth: 2.5,
    borderColor: colors.lavender400,
    borderRadius: radii.md,
    shadowColor: colors.lavender500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4
  },
  gridImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radii.md,
    backgroundColor: colors.warmGray100
  },
  gridImagePlaceholder: {
    borderWidth: 1,
    borderColor: colors.warmGray200,
    borderStyle: 'dashed'
  },
  chalnaBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.lavender500,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.xs,
  },
  chalnaBadgeText: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.white,
    fontSize: 10
  },
  emptyText: {
    ...typography.bodyM,
    color: colors.warmGray400,
    textAlign: 'center',
    width: '100%',
    paddingVertical: spacing.xl
  }
});