import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateCommentRequest, UpdateCommentRequest } from '@gamdojang/domain';
import { createComment, deleteComment, getComments, updateComment } from '../lib/api';

export function useComments(postId: string) {
  return useInfiniteQuery({
    queryKey: ['comments', postId],
    queryFn: ({ pageParam }) => getComments(postId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor || undefined,
    enabled: !!postId
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: CreateCommentRequest }) =>
      createComment(postId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
    }
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: UpdateCommentRequest }) =>
      updateComment(commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    }
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
    }
  });
}
