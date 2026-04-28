import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ReactionRequest } from '@gamdojang/domain';
import { updateReaction } from '../lib/api';

export function useUpdateReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: ReactionRequest }) => updateReaction(postId, data),
    onSuccess: (data, variables) => {
      // We could update the query data optimistically, but for now we just invalidate
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['piece-find', 'next'] });
    }
  });
}
