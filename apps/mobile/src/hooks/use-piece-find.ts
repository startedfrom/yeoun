import { useQuery } from '@tanstack/react-query';
import type { PieceFindNextResponse } from '@gamdojang/domain';

import { getPieceFindNext } from '../lib/api';
import { useSessionStore } from '../store/session-store';

export const PIECE_FIND_QUERY_KEY = ['piece-find', 'next'] as const;

export function usePieceFindNext() {
  const isHydrated = useSessionStore((s) => s.isHydrated);
  const sessionToken = useSessionStore((s) => s.sessionToken);

  return useQuery<PieceFindNextResponse>({
    queryKey: PIECE_FIND_QUERY_KEY,
    queryFn: getPieceFindNext,
    staleTime: 0,
    enabled: isHydrated && !!sessionToken
  });
}
