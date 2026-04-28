import { useQuery } from '@tanstack/react-query';
import { getMoodTags } from '../lib/api';

export function useMoodTags() {
  return useQuery({
    queryKey: ['mood-tags'],
    queryFn: getMoodTags
  });
}
