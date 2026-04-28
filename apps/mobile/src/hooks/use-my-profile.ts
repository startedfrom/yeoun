import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyProfile, updateMyProfile } from '../lib/api';
import { UpdateMyProfileRequest } from '@gamdojang/domain';

export function useMyProfile() {
  return useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateMyProfileRequest) => updateMyProfile(data),
    onSuccess: (newProfile) => {
      queryClient.setQueryData(['my-profile'], newProfile);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });
}
