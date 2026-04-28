import { useQuery } from '@tanstack/react-query';
import { getProfile } from '../lib/api';

export function useProfile(userId: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId),
    enabled: !!userId
  });
}
