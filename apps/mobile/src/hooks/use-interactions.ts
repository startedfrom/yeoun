import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleBlock, toggleFollow } from '../lib/api';

export function useToggleFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => toggleFollow(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['explore'] });
    }
  });
}

export function useToggleBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => toggleBlock(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['explore'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    }
  });
}
