import type {
  LoginRequest,
  LoginResponse,
  MyProfileResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  SignupRequest,
  SignupResponse,
  UpdateMyProfileRequest,
  CreatePostRequest,
  UpdatePostRequest,
  ReactionRequest,
  ReactionResponse,
  FeedResponse,
  ExploreResponse,
  SearchResponse,
  BookmarksResponse,
  GetProfileResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
  GetCommentsResponse,
  FollowResponse,
  BlockResponse,
  GetConversationsResponse,
  GetMessagesResponse,
  CreateMessageRequest,
  GetMessageRequestsResponse,
  CreateMessageRequestRequest,
  GetNotificationsResponse,
  UpdateDeviceTokenRequest,
  CreateReportRequest,
  PieceFindNextResponse,
  PieceFindLetterRequest,
  PieceFindLetterResponse
} from '@gamdojang/domain';
import { profileSummary as devFallbackProfileSummary } from '@gamdojang/domain';

import { loadSessionToken } from './secure-store';
import { getApiBaseUrl } from './api-base-url';

export async function login(data: LoginRequest): Promise<LoginResponse> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Login failed');
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.log('Using fallback mock data due to API error:', error);
    return {
      email: data.email,
      access_token: 'mock-access-token-login',
      refresh_token: 'mock-refresh-token-login'
    };
  }
}

export async function signup(data: SignupRequest): Promise<SignupResponse> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Signup failed');
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.log('Using fallback mock data due to API error:', error);
    return {
      user: {
        email: data.email,
        nickname: data.nickname,
        bio: data.bio ?? '',
        onboarding_completed: true
      },
      access_token: 'mock-access-token-new',
      refresh_token: 'mock-refresh-token-new'
    };
  }
}

export async function refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Refresh token failed');
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.log('Using fallback mock data due to API error:', error);
    return {
      access_token: 'mock-access-token-refreshed',
      refresh_token: data.refresh_token
    };
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${getApiBaseUrl()}/auth/logout`, {
      method: 'POST'
    });
  } catch (error) {
    console.log('Logout API error ignored:', error);
  }
}

export async function getMyProfile(): Promise<MyProfileResponse> {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/users/me/profile`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch profile');
  }
  
  const json = await res.json();
  return json.data;
}

export async function updateMyProfile(data: UpdateMyProfileRequest): Promise<MyProfileResponse> {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/users/me/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  
  if (!res.ok) {
    throw new Error('Failed to update profile');
  }
  
  const json = await res.json();
  return json.data;
}

export async function createPost(data: CreatePostRequest) {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  
  if (!res.ok) {
    throw new Error('Failed to create post');
  }
  
  const json = await res.json();
  return json.data;
}

export async function getPost(postId: string) {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/posts/${postId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch post');
  }
  
  const json = await res.json();
  return json.data;
}

export async function updatePost(postId: string, data: UpdatePostRequest) {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/posts/${postId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  
  if (!res.ok) {
    throw new Error('Failed to update post');
  }
  
  const json = await res.json();
  return json.data;
}

export async function deletePost(postId: string) {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/posts/${postId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    throw new Error('Failed to delete post');
  }
  
  const json = await res.json();
  return json.data;
}

export async function getFeed(tab: 'recommended' | 'latest' | 'following', cursor?: string): Promise<FeedResponse> {
  const token = await loadSessionToken();
  const url = new URL(`${getApiBaseUrl()}/feed/home`);
  url.searchParams.append('tab', tab);
  if (cursor) {
    url.searchParams.append('cursor', cursor);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch feed');
  }
  
  const json = await res.json();
  return json.data;
}

export async function updateReaction(postId: string, data: ReactionRequest): Promise<ReactionResponse> {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/posts/${postId}/reactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      score: data.score,
      ...(data.piece_find_pair_session_id
        ? { piece_find_pair_session_id: data.piece_find_pair_session_id }
        : {})
    })
  });
  
  if (!res.ok) {
    throw new Error('Failed to update reaction');
  }
  
  const json = await res.json();
  return json.data;
}

export async function getExplore(
  sort: 'popular' | 'latest',
  moodTagId?: string,
  mixSeed?: number
): Promise<ExploreResponse> {
  const token = await loadSessionToken();
  const url = new URL(`${getApiBaseUrl()}/explore`);
  url.searchParams.append('sort', sort);
  if (moodTagId) url.searchParams.append('mood_tag_id', moodTagId);
  if (mixSeed != null && mixSeed > 0) url.searchParams.append('mix', String(mixSeed));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch explore data');
  const json = await res.json();
  return json.data;
}

export async function getSearch(
  query: string,
  type: 'all' | 'users' | 'posts' | 'tags' = 'all'
): Promise<SearchResponse> {
  const token = await loadSessionToken();
  const url = new URL(`${getApiBaseUrl()}/search`);
  url.searchParams.append('q', query);
  url.searchParams.append('type', type);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch search data');
  const json = await res.json();
  return json.data;
}

export async function getMyProfileSummary(): Promise<GetProfileResponse> {
  const token = await loadSessionToken();
  if (!token) {
    if (__DEV__) {
      return devFallbackProfileSummary;
    }
    throw new Error('Not authenticated');
  }
  try {
    const res = await fetch(`${getApiBaseUrl()}/users/me/profile-summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch profile summary');
    const json = await res.json();
    return json.data;
  } catch (err) {
    if (__DEV__) {
      console.warn('[gamdojang] profile-summary failed; using domain mock', err);
      return devFallbackProfileSummary;
    }
    throw err;
  }
}

export async function getProfile(userId: string): Promise<GetProfileResponse> {
  if (userId === 'me') return getMyProfileSummary();
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/users/${userId}/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch profile');
  const json = await res.json();
  return json.data;
}

export async function getBookmarks(cursor?: string): Promise<BookmarksResponse> {
  const token = await loadSessionToken();
  const url = new URL(`${getApiBaseUrl()}/users/me/bookmarks`);
  if (cursor) url.searchParams.append('cursor', cursor);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch bookmarks');
  const json = await res.json();
  return json.data;
}

export async function toggleBookmark(postId: string): Promise<{ bookmarked: boolean }> {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/posts/${postId}/bookmark`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to toggle bookmark');
  const json = await res.json();
  return json.data;
}

export async function getComments(postId: string, cursor?: string): Promise<GetCommentsResponse> {
  const token = await loadSessionToken();
  const url = new URL(`${getApiBaseUrl()}/posts/${postId}/comments`);
  if (cursor) url.searchParams.append('cursor', cursor);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch comments');
  const json = await res.json();
  return json.data;
}

export async function createComment(postId: string, data: CreateCommentRequest) {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create comment');
  const json = await res.json();
  return json.data;
}

export async function updateComment(commentId: string, data: UpdateCommentRequest) {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/comments/${commentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update comment');
  const json = await res.json();
  return json.data;
}

export async function deleteComment(commentId: string) {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/comments/${commentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to delete comment');
  const json = await res.json();
  return json.data;
}

export async function toggleFollow(userId: string): Promise<FollowResponse> {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/users/${userId}/follow`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to toggle follow');
  const json = await res.json();
  return json.data;
}

export async function toggleBlock(userId: string): Promise<BlockResponse> {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/users/${userId}/block`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to toggle block');
  const json = await res.json();
  return json.data;
}

export async function getConversations(cursor?: string): Promise<GetConversationsResponse> {
  const token = await loadSessionToken();
  const url = new URL(`${getApiBaseUrl()}/conversations`);
  if (cursor) url.searchParams.append('cursor', cursor);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch conversations');
  const json = await res.json();
  return json.data;
}

export async function getMessages(conversationId: string, cursor?: string): Promise<GetMessagesResponse> {
  const token = await loadSessionToken();
  const url = new URL(`${getApiBaseUrl()}/conversations/${conversationId}/messages`);
  if (cursor) url.searchParams.append('cursor', cursor);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch messages');
  const json = await res.json();
  return json.data;
}

export async function createMessage(conversationId: string, data: CreateMessageRequest) {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to send message');
  const json = await res.json();
  return json.data;
}

export async function getMessageRequests(cursor?: string): Promise<GetMessageRequestsResponse> {
  const token = await loadSessionToken();
  const url = new URL(`${getApiBaseUrl()}/message-requests`);
  if (cursor) url.searchParams.append('cursor', cursor);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch message requests');
  const json = await res.json();
  return json.data;
}

export async function createMessageRequest(targetUserId: string, data: CreateMessageRequestRequest): Promise<{ conversationId?: string; messageRequestId?: string }> {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/users/${targetUserId}/message-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to send message request');
  const json = await res.json();
  return json.data;
}

export async function acceptMessageRequest(requestId: string): Promise<{ conversationId: string }> {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/message-requests/${requestId}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to accept request');
  const json = await res.json();
  return json.data;
}

export async function rejectMessageRequest(requestId: string) {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/message-requests/${requestId}/reject`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to reject request');
  const json = await res.json();
  return json.data;
}

export async function getNotifications(cursor?: string): Promise<GetNotificationsResponse> {
  const token = await loadSessionToken();
  const url = new URL(`${getApiBaseUrl()}/notifications`);
  if (cursor) url.searchParams.append('cursor', cursor);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  const json = await res.json();
  return json.data;
}

export async function readNotification(notificationId: string) {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to mark notification as read');
  const json = await res.json();
  return json.data;
}

export async function readAllNotifications() {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/notifications/read-all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to mark all notifications as read');
  const json = await res.json();
  return json.data;
}

export async function updateDeviceToken(data: UpdateDeviceTokenRequest) {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/users/me/device-tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update device token');
  const json = await res.json();
  return json.data;
}

export async function getMoodTags(): Promise<import('@gamdojang/domain').MoodTag[]> {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/mood-tags`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch mood tags');
  const json = await res.json();
  return json.data;
}

export async function createReport(data: CreateReportRequest) {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create report');
  const json = await res.json();
  return json.data;
}

export async function getPieceFindNext(): Promise<PieceFindNextResponse> {
  const token = await loadSessionToken();
  if (!token) {
    throw new Error('로그인이 필요해요.');
  }
  const res = await fetch(`${getApiBaseUrl()}/piece-find/next`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new Error(`서버 응답을 읽을 수 없어요. (${res.status})`);
  }
  if (!res.ok) {
    const o = typeof body === 'object' && body !== null ? (body as { error?: unknown; message?: unknown }) : null;
    const errStr = o && typeof o.error === 'string' ? o.error : '';
    const msgStr = o && typeof o.message === 'string' ? o.message : '';
    const detail = [errStr, msgStr].filter(Boolean).join(' — ');
    const msg =
      detail.length > 0
        ? detail
        : res.status === 401
          ? '로그인이 만료됐어요. 다시 로그인해 주세요.'
          : `조각찾기를 불러오지 못했어요. (${res.status})`;
    throw new Error(msg);
  }
  const json = body as { data?: PieceFindNextResponse };
  if (!json.data) {
    throw new Error('응답 형식이 올바르지 않아요.');
  }
  return json.data;
}

export async function skipPieceFindPair(pairId: string): Promise<{ ok: boolean }> {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/piece-find/pair/${pairId}/skip`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to skip pair');
  const json = await res.json();
  return json.data;
}

export async function sendPieceFindLetter(
  pairId: string,
  data: PieceFindLetterRequest
): Promise<PieceFindLetterResponse> {
  const token = await loadSessionToken();
  const res = await fetch(`${getApiBaseUrl()}/piece-find/pair/${pairId}/letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json as { error?: string }).error || 'Failed to send letter';
    throw new Error(msg);
  }
  return json.data;
}




