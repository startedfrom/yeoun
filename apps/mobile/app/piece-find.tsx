import type { PostCardModel, PawScore } from '@gamdojang/domain';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationFeedbackType } from 'expo-haptics';

import {
  AppHeader,
  PawReactionSelector,
  Screen,
  colors,
  spacing,
  typography,
  safeHapticNotification
} from '@gamdojang/ui';

import { PIECE_FIND_QUERY_KEY, usePieceFindNext } from '../src/hooks/use-piece-find';
import { createReport, sendPieceFindLetter, toggleBlock, updateReaction } from '../src/lib/api';
import { useSessionStore } from '../src/store/session-store';

type Side = 'left' | 'right';

function postSummary(post: PostCardModel) {
  return post.reactionSummary;
}

export default function PieceFindScreen() {
  const router = useRouter();
  const exitToWalkTab = useCallback(() => {
    router.replace('/(tabs)/walk');
  }, [router]);
  const queryClient = useQueryClient();
  const isHydrated = useSessionStore((s) => s.isHydrated);
  const sessionToken = useSessionStore((s) => s.sessionToken);
  const { data, isLoading, isFetching, error, refetch, isPending } = usePieceFindNext();

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: PIECE_FIND_QUERY_KEY });
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        exitToWalkTab();
        return true;
      });
      return () => sub.remove();
    }, [queryClient, exitToWalkTab])
  );

  const [letterOpen, setLetterOpen] = useState(false);
  const [letterTarget, setLetterTarget] = useState<Side>('left');
  const [letterText, setLetterText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pairId = data?.pair_id ?? null;
  const left = data?.left ?? null;
  const right = data?.right ?? null;
  const canSimulatePay = data?.simulated_payments_enabled ?? false;
  const emptyReason = data?.empty_reason ?? null;

  const hasPair = Boolean(pairId && left && right);
  /** 포커스 시 invalidate로 `isFetching`만 켜지면 기존 조건이 스피너를 숨기고 빈 row만 그릴 수 있음 */
  const showSpinner =
    !error && (((isLoading || isPending) && !data) || (isFetching && !hasPair));
  const showEmpty = !error && !hasPair && !showSpinner;

  const letterMutation = useMutation({
    mutationFn: async () => {
      if (!pairId) throw new Error('no pair');
      const post = letterTarget === 'left' ? left : right;
      if (!post) throw new Error('no post');
      return sendPieceFindLetter(pairId, {
        post_id: post.postId,
        initial_message: letterText.trim(),
        payment_simulation_ack: canSimulatePay ? true : undefined
      });
    },
    onSuccess: () => {
      setLetterOpen(false);
      setLetterText('');
      queryClient.invalidateQueries({ queryKey: PIECE_FIND_QUERY_KEY });
      Alert.alert('전달됐어요', '편지가 상대 편지함으로 갔어요.');
    }
  });

  const onReact = useCallback(
    async (side: Side, score: PawScore) => {
      if (!pairId || submitting) return;
      const post = side === 'left' ? left : right;
      if (!post) return;
      setSubmitting(true);
      try {
        await updateReaction(post.postId, {
          score,
          piece_find_pair_session_id: pairId
        });
        await queryClient.invalidateQueries({ queryKey: PIECE_FIND_QUERY_KEY });
        await queryClient.invalidateQueries({ queryKey: ['feed'] });
        await queryClient.invalidateQueries({ queryKey: ['profile', post.author.userId] });
        await queryClient.invalidateQueries({ queryKey: ['my-profile'] });
        safeHapticNotification(NotificationFeedbackType.Success);
      } catch (e) {
        safeHapticNotification(NotificationFeedbackType.Error);
        Alert.alert(
          '여운을 남기지 못했어요',
          e instanceof Error ? e.message : '네트워크를 확인한 뒤 다시 시도해 주세요.'
        );
      } finally {
        setSubmitting(false);
      }
    },
    [pairId, left, right, submitting, queryClient]
  );

  if (!isHydrated) {
    return (
      <Screen scroll={false} header={<AppHeader title="취향 조각" onBack={exitToWalkTab} />}>
        <View style={styles.hydrateSpinnerWrap}>
          <ActivityIndicator size="large" color={colors.lavender500} />
        </View>
      </Screen>
    );
  }

  if (!sessionToken) {
    return <Redirect href="/splash" />;
  }

  const openLetter = () => {
    if (!pairId || !left || !right) return;
    setLetterTarget('left');
    setLetterText('');
    setLetterOpen(true);
  };

  const confirmSendLetter = () => {
    if (!letterText.trim()) {
      Alert.alert('편지 내용을 입력해 주세요');
      return;
    }
    if (!canSimulatePay) {
      Alert.alert('결제 준비 중', '지금 환경에서는 유료 편지 결제가 비활성화되어 있어요.');
      return;
    }
    Alert.alert('유료 편지 (개발 시뮬)', '실제 결제는 발생하지 않고, 편지만 전달돼요. 진행할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '보내기',
        onPress: () => letterMutation.mutate()
      }
    ]);
  };

  const onReport = (side: Side) => {
    const post = side === 'left' ? left : right;
    if (!post) return;
    Alert.alert('이 룩 신고', '신고 사유를 골라주세요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '스팸',
        onPress: () =>
          createReport({ targetType: 'post', targetId: post.postId, reasonCode: 'spam' }).then(() =>
            Alert.alert('접수되었어요')
          )
      },
      {
        text: '기타',
        onPress: () =>
          createReport({ targetType: 'post', targetId: post.postId, reasonCode: 'other' }).then(() =>
            Alert.alert('접수되었어요')
          )
      }
    ]);
  };

  const onBlock = (side: Side) => {
    const post = side === 'left' ? left : right;
    if (!post) return;
    Alert.alert('차단', `${post.author.nickname}님을 차단할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '차단',
        style: 'destructive',
        onPress: () =>
          toggleBlock(post.author.userId).then(() => {
            queryClient.invalidateQueries({ queryKey: PIECE_FIND_QUERY_KEY });
            Alert.alert('차단했어요');
          })
      }
    ]);
  };

  return (
    <Screen scroll={false} header={<AppHeader title="취향 조각" onBack={exitToWalkTab} />}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.lead}>두 룩 중 더 끌리는 쪽에 여운을 남겨보세요.</Text>
        <Text style={styles.hint}>TIP: 더 마음 가는 쪽을 선택하면 돼요.</Text>

        {showSpinner ? (
          <ActivityIndicator size="large" color={colors.lavender500} style={{ marginTop: spacing.xxxl }} />
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>불러오지 못했어요.</Text>
            {__DEV__ ? (
              <Text style={styles.errorDetail} selectable>
                {error instanceof Error ? error.message : String(error)}
              </Text>
            ) : null}
            <Pressable style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : showEmpty ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>
              {emptyReason === 'pool_exhausted'
                ? '비교할 새 룩이 잠시 부족해요.'
                : '지금은 모을 조각이 부족해요.'}
            </Text>
            <Text style={styles.hint}>
              {emptyReason === 'pool_exhausted'
                ? '피드·산책에서 이미 여운을 남긴 글은 여기서 다시 나오지 않아요. 새 글이 쌓이면 돌아오거나, 산책 탭을 둘러보세요.'
                : '산책 탭에서 해시태그를 둘러보거나, 나중에 다시 와 주세요.'}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.row}>
              {left && (
                <PieceColumn
                  label="이 룩"
                  stripAlign="leading"
                  post={left}
                  disabled={submitting}
                  onReact={(score) => onReact('left', score)}
                  onReport={() => onReport('left')}
                  onBlock={() => onBlock('left')}
                />
              )}
              {right && (
                <PieceColumn
                  label="저 룩"
                  stripAlign="trailing"
                  post={right}
                  disabled={submitting}
                  onReact={(score) => onReact('right', score)}
                  onReport={() => onReport('right')}
                  onBlock={() => onBlock('right')}
                />
              )}
            </View>

            {pairId && left && right && (
              <Pressable
                style={[styles.letterBtn, (!canSimulatePay || submitting) && styles.letterBtnDisabled]}
                onPress={openLetter}
                disabled={!canSimulatePay || submitting}
              >
                <Text style={styles.letterBtnText}>편지 보내기</Text>
              </Pressable>
            )}
            {!canSimulatePay && pairId ? (
              <Text style={styles.paywallNote}>이 서버에서는 유료 편지 시뮬레이션이 꺼져 있어요.</Text>
            ) : null}
          </>
        )}
      </ScrollView>

      <Modal visible={letterOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>조각찾기 편지</Text>
            <Text style={styles.modalSub}>룩을 고르기 전에만 보낼 수 있어요.</Text>
            <View style={styles.sidePick}>
              <Pressable
                style={[styles.sideBtn, letterTarget === 'left' && styles.sideBtnOn]}
                onPress={() => setLetterTarget('left')}
              >
                <Text style={styles.sideBtnText}>이 룩에게</Text>
              </Pressable>
              <Pressable
                style={[styles.sideBtn, letterTarget === 'right' && styles.sideBtnOn]}
                onPress={() => setLetterTarget('right')}
              >
                <Text style={styles.sideBtnText}>저 룩에게</Text>
              </Pressable>
            </View>
            <TextInput
              style={styles.letterInput}
              placeholder="조용히 한 줄 남겨보세요…"
              placeholderTextColor={colors.ink500}
              value={letterText}
              onChangeText={setLetterText}
              multiline
              maxLength={300}
            />
            {letterMutation.isError ? (
              <Text style={styles.errorInline}>
                {letterMutation.error instanceof Error ? letterMutation.error.message : '전송 실패'}
              </Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setLetterOpen(false)}>
                <Text style={styles.modalCancelText}>닫기</Text>
              </Pressable>
              <Pressable style={styles.modalSend} onPress={confirmSendLetter}>
                <Text style={styles.modalSendText}>보내기</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function PieceColumn({
  label,
  stripAlign,
  post,
  disabled,
  onReact,
  onReport,
  onBlock
}: {
  label: string;
  stripAlign: 'leading' | 'trailing';
  post: PostCardModel;
  disabled: boolean;
  onReact: (score: PawScore) => void;
  onReport: () => void;
  onBlock: () => void;
}) {
  const tagLine = post.moodTags
    .slice(0, 2)
    .map((t) => `#${t.name}`)
    .join(' ');

  return (
    <View style={styles.col}>
      <Text style={styles.colLabel}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} 사진, 최고 여운으로 남기기`}
        disabled={disabled}
        onPress={() => onReact(5)}
        style={styles.frame}
      >
        <Image source={{ uri: post.images[0]?.imageUrl }} style={styles.image} resizeMode="cover" />
      </Pressable>
      <Text style={styles.tagLine} numberOfLines={2}>
        {tagLine}
      </Text>
      <View style={styles.pawWrap} pointerEvents={disabled ? 'none' : 'auto'}>
        <PawReactionSelector
          stripAlign={stripAlign}
          summary={postSummary(post)}
          onChange={onReact}
        />
      </View>
      <View style={styles.miniActions}>
        <Pressable onPress={onReport} hitSlop={8}>
          <Text style={styles.miniLink}>신고</Text>
        </Pressable>
        <Text style={styles.miniDot}> · </Text>
        <Pressable onPress={onBlock} hitSlop={8}>
          <Text style={styles.miniLink}>차단</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1
  },
  hydrateSpinnerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxxl
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.md
  },
  lead: {
    ...typography.bodyM,
    fontFamily: 'DungGeunMo',
    color: colors.ink900,
    marginTop: spacing.sm
  },
  hint: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.ink500
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    alignItems: 'flex-start'
  },
  col: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm
  },
  colLabel: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.ink700,
    textAlign: 'center'
  },
  frame: {
    borderWidth: 2,
    borderColor: colors.lavender400,
    borderBottomWidth: 4,
    backgroundColor: colors.white,
    padding: 4
  },
  image: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.ink100
  },
  tagLine: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.ink700,
    minHeight: 32
  },
  pawWrap: {
    opacity: 1,
    width: '100%',
    alignSelf: 'stretch'
  },
  miniActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  miniLink: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.lavender500
  },
  miniDot: {
    ...typography.caption,
    color: colors.ink500
  },
  letterBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: colors.lavender400,
    borderBottomWidth: 4,
    backgroundColor: colors.white,
    alignItems: 'center'
  },
  letterBtnDisabled: {
    opacity: 0.45
  },
  letterBtnText: {
    ...typography.bodyM,
    fontFamily: 'DungGeunMo',
    color: colors.lavender500
  },
  paywallNote: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.ink500,
    textAlign: 'center'
  },
  centerBox: {
    marginTop: spacing.xxxl,
    gap: spacing.md,
    alignItems: 'center'
  },
  errorText: {
    ...typography.bodyL,
    fontFamily: 'DungGeunMo',
    color: colors.ink900,
    textAlign: 'center'
  },
  errorDetail: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.ink500,
    textAlign: 'center',
    paddingHorizontal: spacing.md
  },
  errorInline: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: '#b42318',
    marginTop: spacing.sm
  },
  retryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderColor: colors.lavender400
  },
  retryText: {
    fontFamily: 'DungGeunMo',
    color: colors.ink900
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 20, 0.45)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderTopWidth: 3,
    borderColor: colors.lavender400,
    gap: spacing.md
  },
  modalTitle: {
    ...typography.headingM,
    fontFamily: 'DungGeunMo',
    color: colors.ink900
  },
  modalSub: {
    ...typography.caption,
    fontFamily: 'DungGeunMo',
    color: colors.ink500
  },
  sidePick: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  sideBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderColor: colors.warmGray200,
    alignItems: 'center'
  },
  sideBtnOn: {
    borderColor: colors.ink900,
    backgroundColor: colors.lavender100
  },
  sideBtnText: {
    fontFamily: 'DungGeunMo',
    fontSize: 12,
    color: colors.ink900
  },
  letterInput: {
    minHeight: 100,
    borderWidth: 2,
    borderColor: colors.lavender400,
    padding: spacing.md,
    fontFamily: 'DungGeunMo',
    color: colors.ink900,
    textAlignVertical: 'top'
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md
  },
  modalCancel: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md
  },
  modalCancelText: {
    fontFamily: 'DungGeunMo',
    color: colors.ink500
  },
  modalSend: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.lavender400,
    borderWidth: 2,
    borderColor: colors.ink900
  },
  modalSendText: {
    fontFamily: 'DungGeunMo',
    color: colors.ink900
  }
});
