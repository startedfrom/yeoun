import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getExplore } from '../lib/api';

/** `mixEpoch`>0 이면 `/explore?mix=` 로 다른 조합 30장(당겨서 새로고침) */
export function useExplore(sort: 'popular' | 'latest', moodTagId?: string, mixEpoch = 0) {
  return useQuery({
    queryKey: ['explore', sort, moodTagId, mixEpoch],
    queryFn: () => getExplore(sort, moodTagId, mixEpoch > 0 ? mixEpoch : undefined),
    placeholderData: keepPreviousData
  });
}
