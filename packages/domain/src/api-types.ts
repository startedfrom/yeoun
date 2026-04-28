export type LoginRequest = {
  email: string;
  password: string;
};

export type SignupRequest = {
  email: string;
  password: string;
  nickname: string;
  bio?: string;
  interest_mood_tag_ids: string[];
};

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
};

export type LoginResponse = AuthTokens & {
  email: string;
};

export type SignupResponse = AuthTokens & {
  user: {
    email: string;
    nickname: string;
    bio: string;
    onboarding_completed: boolean;
  };
};

export type RefreshTokenRequest = {
  refresh_token: string;
};

export type RefreshTokenResponse = AuthTokens;

export type AccountVisibility = 'public' | 'private';
export type MessagePermission = 'everyone' | 'followers_only' | 'following_only' | 'nobody';

export type MyProfileResponse = {
  id: string;
  nickname: string;
  profileImageUrl: string | null;
  bio: string | null;
  representativeMoodTagId: string | null;
  accountVisibility: AccountVisibility;
  messagePermission: MessagePermission;
  commentPermission: string;
  isSearchable: boolean;
};

export type UpdateMyProfileRequest = Partial<Omit<MyProfileResponse, 'id'>>;

export type CreatePostImageInput = {
  imageUrl: string;
  width: number;
  height: number;
};

export type CreatePostRequest = {
  postType: 'regular' | 'chalna';
  images: CreatePostImageInput[];
  caption: string;
  visibility: 'public' | 'followers_only' | 'private';
  moodTagIds: string[];
  expiresInHours?: 1 | 2 | 3 | 6;
};

export type UpdatePostRequest = {
  caption?: string;
  visibility?: 'public' | 'followers_only' | 'private';
  moodTagIds?: string[];
};

export type ReactionRequest = {
  score: 1 | 2 | 3 | 4 | 5;
  /** 조각찾기 세션에서 여운을 남길 때 필수(서버가 쌍·순서를 검증) */
  piece_find_pair_session_id?: string;
};

export type ReactionResponse = {
  my_reaction: 1 | 2 | 3 | 4 | 5;
  reaction_summary: {
    average_score: number;
    top_label: '슬쩍' | '콕' | '꾹' | '폭닥' | '젤리';
    reactions_count: number;
  };
};

import type {
  PostCardModel,
  ChalnaCardModel,
  MoodTag,
  UserSummary,
  ProfileSummary,
  CommentModel,
  ConversationPreview,
  MessageModel,
  MessageRequestModel,
  NotificationItem
} from './models';

export type PieceFindEmptyReason = 'insufficient_catalog' | 'pool_exhausted';

export type PieceFindNextResponse = {
  pair_id: string | null;
  expires_at: string | null;
  left: PostCardModel | null;
  right: PostCardModel | null;
  letter_eligible: boolean;
  simulated_payments_enabled: boolean;
  /** `pair_id`가 null일 때만: DB에 룩이 거의 없음 vs 이미 반응·조각 제외로 소진 */
  empty_reason?: PieceFindEmptyReason | null;
};

export type PieceFindLetterRequest = {
  post_id: string;
  initial_message: string;
  payment_simulation_ack?: boolean;
};

export type PieceFindLetterResponse = {
  ok: boolean;
  piece_find_paid_letter_id: string;
  message_request_id: string | null;
};

export type FeedResponse = {
  tab: 'recommended' | 'latest' | 'following';
  items: PostCardModel[];
  chalna: ChalnaCardModel[];
  next_cursor: string | null;
};

export type ExploreResponse = {
  sort: 'popular' | 'latest';
  popular_tags: MoodTag[];
  recommended_users: UserSummary[];
  items: PostCardModel[];
};

export type SearchResponse = {
  users: UserSummary[];
  tags: MoodTag[];
  /** 캡션·장소 텍스트 기준 룩 검색 (`GET /search?type=` 에 맞춤) */
  posts: PostCardModel[];
};

export type BookmarksResponse = {
  items: PostCardModel[];
  next_cursor: string | null;
};

export type GetProfileResponse = ProfileSummary;

export type CreateCommentRequest = {
  content: string;
  parentCommentId?: string;
};

export type UpdateCommentRequest = {
  content: string;
};

export type GetCommentsResponse = {
  items: CommentModel[];
  next_cursor: string | null;
};

export type FollowResponse = {
  isFollowing: boolean;
};

export type BlockResponse = {
  isBlocked: boolean;
};

export type GetConversationsResponse = {
  items: ConversationPreview[];
  next_cursor: string | null;
};

export type GetMessagesResponse = {
  items: MessageModel[];
  next_cursor: string | null;
};

export type CreateMessageRequest = {
  content?: string;
  sharedPostId?: string;
  messageType?: 'text' | 'image' | 'post_share';
};

export type GetMessageRequestsResponse = {
  items: MessageRequestModel[];
  next_cursor: string | null;
};

export type CreateMessageRequestRequest = {
  initialMessage?: string;
};

export type GetNotificationsResponse = {
  items: NotificationItem[];
  next_cursor: string | null;
  unreadCount: number;
};

export type UpdateDeviceTokenRequest = {
  deviceToken: string;
  platform: 'ios' | 'android';
};

export type ReadNotificationRequest = {
  notificationId: string;
};

export type ReportTargetType = 'post' | 'comment' | 'user' | 'message';
export type ReportReasonCode = 'abuse' | 'harassment' | 'sexual' | 'appearance_shaming' | 'spam' | 'impersonation' | 'copyright' | 'underage' | 'other';

export type CreateReportRequest = {
  targetType: ReportTargetType;
  targetId: string;
  reasonCode: ReportReasonCode;
  detailText?: string;
};

export type AdminActionRequest = {
  actionType: 'hide_post' | 'suspend_user' | 'dismiss_report';
  targetType: 'post' | 'user' | 'report';
  targetId: string;
  note?: string;
};


