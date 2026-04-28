import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getSearch } from '../lib/api';

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => getSearch(query, 'all'),
    enabled: query.length > 0,
    staleTime: 20_000,
    retry: 1,
    placeholderData: keepPreviousData
  });
}
