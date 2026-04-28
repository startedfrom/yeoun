import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Image,
  Pressable
} from 'react-native';
import { useState, useMemo, useCallback } from 'react';
import {
  AppHeader,
  FeedCard,
  Screen,
  SectionTitle,
  colors,
  spacing,
  radii,
  typography,
  shadows,
  Button,
  safeHapticImpact
} from '@gamdojang/ui';
import { ImpactFeedbackStyle } from 'expo-haptics';
import type { PostCardModel, PostType, PostVisibility, PawScore, MoodTag } from '@gamdojang/domain';

import { useDeletePost, usePost } from '../../src/hooks/use-posts';
import { useUpdateReaction } from '../../src/hooks/use-reactions';
import { useComments, useCreateComment, useDeleteComment } from '../../src/hooks/use-comments';
import { useProfile } from '../../src/hooks/use-profile';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function PostDetailRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: post, isLoading } = usePost(id || '');
  const { data: commentsData } = useComments(id || '');
  const { data: currentUser } = useProfile('me');

  const { mutateAsync: deletePost } = useDeletePost();
  const { mutate: updateReaction } = useUpdateReaction();
  const { mutate: createComment, isPending: isCreatingComment } = useCreateComment();
  const { mutate: deleteComment } = useDeleteComment();

  const [reactionOverride, setReactionOverride] = useState<PawScore | null>(null);
  const [commentText, setCommentText] = useState('');

  const mappedPost = useMemo(() => {
    if (!post) return null;
    
    const base: PostCardModel = {
      postId: post.id,
      postType: post.postType as PostType,
      author: {
        userId: post.user.id,
        nickname: post.user.profile?.nickname || 'Unknown',
        profileImageUrl: post.user.profile?.profileImageUrl || 'https://via.placeholder.com/150',
      },
      images: post.images,
      caption: post.caption,
      moodTags: post.moodTags?.map((mt: { moodTag: MoodTag }) => mt.moodTag) || [],
      reactionSummary: {
        averageScore: Number(post.reactionScoreAvg) || 0,
        topLabel: post.topReactionLabel || '슬쩍',
        reactionsCount: post.reactionsCount || 0,
        myScore: undefined
      },
      commentsCount: post.commentsCount || 0,
      bookmarked: false,
      createdAt: post.createdAt,
      visibility: post.visibility as PostVisibility
    };

    if (reactionOverride) {
      base.reactionSummary.myScore = reactionOverride;
    }
    
    return base;
  }, [post, reactionOverride]);

  const onPressMoodTagWalk = useCallback(
    (tag: MoodTag) => {
      router.push(`/(tabs)/walk?moodTagId=${encodeURIComponent(tag.id)}`);
    },
    [router]
  );

  if (isLoading) {
    return (
      <Screen header={<AppHeader title="" onBack={() => router.back()} />}>
        <ActivityIndicator size="large" color={colors.lavender500} style={{ marginTop: 100 }} />
      </Screen>
    );
  }

  if (!mappedPost) {
    return (
      <Screen header={<AppHeader title="" onBack={() => router.back()} />}>
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>게시물을 찾을 수 없어요.</Text>
        </View>
      </Screen>
    );
  }

  const handleDelete = () => {
    Alert.alert('삭제 확인', '정말로 게시물을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(post.id);
            Alert.alert('삭제 완료', '게시물이 삭제되었습니다.');
            router.replace('/(tabs)');
          } catch {
            Alert.alert('삭제 실패', '게시물 삭제에 실패했습니다.');
          }
        }
      }
    ]);
  };

  const handleReactionChange = (score: PawScore) => {
    setReactionOverride(score);
    updateReaction({ postId: mappedPost.postId, data: { score } });
  };

  const handleCommentSubmit = () => {
    if (!commentText.trim()) return;
    createComment(
      { postId: mappedPost.postId, data: { content: commentText.trim() } },
      { onSuccess: () => setCommentText('') }
    );
  };

  const commentSubmitDisabled = isCreatingComment || !commentText.trim();

  const handleCommentSubmitPress = () => {
    if (commentSubmitDisabled) return;
    safeHapticImpact(ImpactFeedbackStyle.Light);
    handleCommentSubmit();
  };

  const comments = commentsData?.pages.flatMap((p) => p.items) || [];

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.white }}
    >
      <Screen
        header={
          <>
            <Stack.Screen options={{ title: `${mappedPost.author.nickname}님의 무드` }} />
            <AppHeader title={`${mappedPost.author.nickname}님의 무드`} onBack={() => router.back()} />
          </>
        }
      >
        <FeedCard
          post={mappedPost}
          onChangeReaction={handleReactionChange}
          onPressProfile={() => router.push(`/profile/${mappedPost.author.userId}`)}
          onPressMoodTagWalk={onPressMoodTagWalk}
        />
        
        {/* Edit/Delete Actions for Author */}
        {currentUser?.user.userId === post.userId && (
          <View style={styles.actions}>
            <Button
              variant="secondary"
              shape="pixel"
              onPress={() => router.push(`/post/edit/${post.id}`)}
            >
              수정하기
            </Button>
            <Button variant="secondary" shape="pixel" onPress={handleDelete}>
              삭제하기
            </Button>
          </View>
        )}

        <View style={styles.commentsSection}>
          <Text style={styles.commentTitle}>댓글 {comments.length}</Text>
          
          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <Image source={{ uri: comment.user.profileImageUrl || 'https://via.placeholder.com/150' }} style={styles.commentAvatar} />
              <View style={styles.commentContentWrapper}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{comment.user.nickname}</Text>
                  <Text style={styles.commentTime}>
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ko })}
                  </Text>
                  {(currentUser?.user.userId === comment.user.userId || currentUser?.user.userId === post.userId) && (
                    <Text 
                      style={styles.commentDelete} 
                      onPress={() => {
                        Alert.alert('삭제 확인', '댓글을 삭제하시겠습니까?', [
                          { text: '취소', style: 'cancel' },
                          { text: '삭제', style: 'destructive', onPress: () => deleteComment(comment.id) }
                        ]);
                      }}
                    >
                      삭제
                    </Text>
                  )}
                </View>
                <Text style={styles.commentBody}>{comment.content}</Text>
              </View>
            </View>
          ))}

          {comments.length === 0 && (
            <Text style={styles.noCommentsText}>아직 댓글이 없어요. 따뜻한 말을 남겨볼까요?</Text>
          )}
        </View>
      </Screen>

      {/* Sticky Comment Input Area at Bottom */}
      <View style={styles.inputArea}>
        <Image source={{ uri: currentUser?.user.profile?.profileImageUrl || 'https://via.placeholder.com/150' }} style={styles.inputAvatar} />
        <View style={styles.composerPill}>
          <TextInput
            style={styles.commentInput}
            placeholder="따뜻한 댓글을 남겨주세요..."
            placeholderTextColor={colors.warmGray400}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            textAlignVertical={Platform.OS === 'android' ? 'center' : undefined}
            underlineColorAndroid="transparent"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: commentSubmitDisabled }}
            accessibilityLabel="댓글 등록"
            disabled={commentSubmitDisabled}
            onPress={handleCommentSubmitPress}
            style={({ pressed }) => [
              styles.commentSubmit,
              commentSubmitDisabled && styles.commentSubmitDisabled,
              pressed && !commentSubmitDisabled && styles.commentSubmitPressed
            ]}
          >
            <Text style={[styles.commentSubmitLabel, commentSubmitDisabled && styles.commentSubmitLabelDisabled]}>
              등록
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 100
  },
  empty: {
    ...typography.bodyL,
    color: colors.warmGray500
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg
  },
  commentsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 100, // Extra padding for sticky input
    backgroundColor: colors.cream50,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl
  },
  commentTitle: {
    ...typography.headingM,
    color: colors.ink900,
    marginBottom: spacing.xl
  },
  commentItem: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
    alignItems: 'flex-start'
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.warmGray100
  },
  commentContentWrapper: {
    flex: 1,
    gap: 4
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  commentAuthor: {
    ...typography.bodyM,
    color: colors.ink900,
    fontWeight: 'bold'
  },
  commentTime: {
    ...typography.caption,
    color: colors.warmGray400
  },
  commentDelete: {
    ...typography.caption,
    color: colors.pink500,
    marginLeft: 'auto'
  },
  commentBody: {
    ...typography.bodyM,
    color: colors.ink700,
    lineHeight: 22
  },
  noCommentsText: {
    ...typography.bodyM,
    color: colors.warmGray400,
    textAlign: 'center',
    marginTop: spacing.xl
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl, // For home indicator
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.warmGray100,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0
  },
  inputAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.warmGray100
  },
  composerPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.cream50
  },
  commentInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 36,
    maxHeight: 100,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    paddingHorizontal: 0,
    color: colors.ink900,
    backgroundColor: 'transparent',
    ...typography.bodyM
  },
  commentSubmit: {
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 36,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.lavender400,
    ...shadows.none
  },
  commentSubmitPressed: {
    opacity: 0.9
  },
  commentSubmitDisabled: {
    backgroundColor: '#E8E8E8',
    ...shadows.none
  },
  commentSubmitLabel: {
    ...typography.bodyM,
    fontWeight: '500',
    color: colors.white
  },
  commentSubmitLabelDisabled: {
    color: '#999999'
  }
});