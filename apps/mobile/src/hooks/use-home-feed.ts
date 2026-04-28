import { useInfiniteQuery } from '@tanstack/react-query';
import { getFeed } from '../lib/api';

export function useHomeFeed(tab: 'recommended' | 'latest' | 'following') {
  return useInfiniteQuery({
    queryKey: ['feed', tab],
    queryFn: ({ pageParam }) => getFeed(tab, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor || undefined
  });
}
