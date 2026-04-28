import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBookmarks, toggleBookmark } from '../lib/api';

export function useBookmarks() {
  return useInfiniteQuery({
    queryKey: ['bookmarks'],
    queryFn: ({ pageParam }) => getBookmarks(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor || undefined
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => toggleBookmark(postId),
    onSuccess: (_, postId) => {
      // Invalidate relevant queries to keep UI consistent
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['explore'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });
}
