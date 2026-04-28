export type MoodTag = {
  id: string;
  name: string;
  slug: string;
  accentColor: string;
};

export type PawScore = 1 | 2 | 3 | 4 | 5;

export type PawLabel = '슬쩍' | '콕' | '꾹' | '폭닥' | '젤리';

export type ReactionSummary = {
  averageScore: number;
  topLabel: PawLabel;
  reactionsCount: number;
  myScore?: PawScore;
};

export type UserSummary = {
  userId: string;
  nickname: string;
  profileImageUrl: string;
  representativeMoodTag?: MoodTag;
};

export type PostType = 'regular' | 'chalna';

export type FeedTab = 'recommended' | 'latest' | 'following';

export type PostVisibility = 'public' | 'followers_only' | 'private';

export type PostCardModel = {
  postId: string;
  postType: PostType;
  author: UserSummary;
  images: {
    imageUrl: string;
    width: number;
    height: number;
  }[];
  caption: string;
  locationText?: string;
  moodTags: MoodTag[];
  reactionSummary: ReactionSummary;
  commentsCount: number;
  bookmarked: boolean;
  createdAt: string;
  visibility: PostVisibility;
  expiresAt?: string;
  remainingSeconds?: number;
};

export type ChalnaCardModel = {
  postId: string;
  postType: 'chalna';
  author: UserSummary;
  thumbnailImageUrl: string;
  caption: string;
  moodTags: MoodTag[];
  expiresAt: string;
  remainingSeconds: number;
  hasUnread: boolean;
  reactionSummary: ReactionSummary;
};

export type CommentModel = {
  id: string;
  user: UserSummary;
  content: string;
  createdAt: string;
};

export type PostDetailModel = PostCardModel & {
  participationCount: number;
  comments: CommentModel[];
};

export type ProfileSummary = {
  user: UserSummary;
  bio: string;
  averagePawScore: number;
  followersCount: number;
  followingCount: number;
  receivedReactionsCount: number;
  representativeMoodTags: MoodTag[];
  currentChalna?: ChalnaCardModel;
  posts: PostCardModel[];
  isFollowing?: boolean;
  isBlockedByMe?: boolean;
};

export type NotificationType =
  | 'post_reaction'
  | 'post_comment'
  | 'follow'
  | 'chalna_reaction'
  | 'message_request'
  | 'message_received';

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
};

export type ConversationPreview = {
  id: string;
  partner: UserSummary;
  preview: string;
  updatedAt: string;
  unreadCount: number;
};

export type MessageModel = {
  id: string;
  conversationId: string;
  sender: UserSummary;
  messageType: 'text' | 'image' | 'post_share';
  content?: string;
  sharedPost?: PostCardModel;
  createdAt: string;
};

export type MessageRequestModel = {
  id: string;
  fromUser: UserSummary;
  initialMessage?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
};
