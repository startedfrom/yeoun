import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateMessageRequest, CreateMessageRequestRequest } from '@gamdojang/domain';
import {
  acceptMessageRequest,
  createMessage,
  createMessageRequest,
  getConversations,
  getMessageRequests,
  getMessages,
  rejectMessageRequest
} from '../lib/api';

// Poll every 10 seconds for conversations list
export function useConversations() {
  return useInfiniteQuery({
    queryKey: ['conversations'],
    queryFn: ({ pageParam }) => getConversations(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor || undefined,
    refetchInterval: 10000 
  });
}

// Poll every 3 seconds for active chat room
export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) => getMessages(conversationId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor || undefined,
    refetchInterval: 3000,
    enabled: !!conversationId
  });
}

export function useCreateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, data }: { conversationId: string; data: CreateMessageRequest }) =>
      createMessage(conversationId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });
}

export function useMessageRequests() {
  return useInfiniteQuery({
    queryKey: ['messageRequests'],
    queryFn: ({ pageParam }) => getMessageRequests(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor || undefined
  });
}

export function useCreateMessageRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetUserId, data }: { targetUserId: string; data: CreateMessageRequestRequest }) =>
      createMessageRequest(targetUserId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messageRequests'] });
    }
  });
}

export function useAcceptMessageRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => acceptMessageRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageRequests'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });
}

export function useRejectMessageRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => rejectMessageRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageRequests'] });
    }
  });
}
