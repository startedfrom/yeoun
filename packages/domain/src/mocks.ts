import { getPawLabelFromAverage } from './reactions';
import type {
  ChalnaCardModel,
  ConversationPreview,
  MoodTag,
  NotificationItem,
  PostCardModel,
  PostDetailModel,
  ProfileSummary,
  UserSummary
} from './models';

export const moodTags: MoodTag[] = [
  { id: 'tag-daily-look', name: '데일리룩', slug: 'daily-look', accentColor: '#B995FF' },
  { id: 'tag-today-coordi', name: '오늘의코디', slug: 'today-coordi', accentColor: '#8DC8FF' },
  { id: 'tag-ootd-ko', name: '오오티디', slug: 'ootd-ko', accentColor: '#FFE9A8' },
  { id: 'tag-ootd', name: 'ootd', slug: 'ootd', accentColor: '#FFBEDB' },
  { id: 'tag-womens-coordi', name: '여자코디', slug: 'womens-coordi', accentColor: '#BDF5DA' },
  { id: 'tag-vintage-look', name: '빈티지룩', slug: 'vintage-look', accentColor: '#FFC9A8' },
  { id: 'tag-mood-coordi', name: '감성코디', slug: 'mood-coordi', accentColor: '#FFD6B0' },
  { id: 'tag-effortless-chic', name: '꾸안꾸룩', slug: 'effortless-chic', accentColor: '#C4D4F5' },
  { id: 'tag-casual-look', name: '캐주얼룩', slug: 'casual-look', accentColor: '#E8B4D4' },
  { id: 'tag-layered-look', name: '레이어드룩', slug: 'layered-look', accentColor: '#A8D5E2' },
  { id: 'tag-knit-coordi', name: '니트코디', slug: 'knit-coordi', accentColor: '#D4A574' },
  { id: 'tag-fall-coordi', name: '가을코디', slug: 'fall-coordi', accentColor: '#C17B5B' }
];

const users: UserSummary[] = [
  {
    userId: 'user-stamp',
    nickname: '도장꾹꾹',
    profileImageUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80',
    representativeMoodTag: moodTags[0]
  },
  {
    userId: 'user-jellysky',
    nickname: '젤리하늘',
    profileImageUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=240&q=80',
    representativeMoodTag: moodTags[1]
  },
  {
    userId: 'user-dawnroll',
    nickname: '새벽롤',
    profileImageUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
    representativeMoodTag: moodTags[3]
  }
];

function buildReactionSummary(
  averageScore: number,
  reactionsCount: number,
  myScore?: 1 | 2 | 3 | 4 | 5
) {
  return {
    averageScore,
    topLabel: getPawLabelFromAverage(averageScore),
    reactionsCount,
    myScore
  };
}

/** 피드 더미: 패션·코디 중심(풍경 컷 없음). 취향 비중은 찰나·피드 카피로만 살짝 섞음. */
export const homeFeed: PostCardModel[] = [
  {
    postId: 'post-look-yellow-seongsu',
    postType: 'regular',
    author: users[0],
    images: [
      {
        imageUrl:
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1080&q=80',
        width: 1080,
        height: 1350
      }
    ],
    caption: '성수 편집샵 앞에서 맞춘 옐로 풀룩. 컷이 말랑하게 떨어져서 감도만 남겼어요.',
    locationText: '성수',
    moodTags: [moodTags[0], moodTags[3]],
    reactionSummary: buildReactionSummary(4.6, 156, 4),
    commentsCount: 11,
    bookmarked: true,
    createdAt: '2026-04-16T11:10:00Z',
    visibility: 'public'
  },
  {
    postId: 'post-fit-denim-layer',
    postType: 'regular',
    author: users[1],
    images: [
      {
        imageUrl:
          'https://images.unsplash.com/photo-1539109136881-3be0616acf4a?auto=format&fit=crop&w=1080&q=80',
        width: 1080,
        height: 1350
      }
    ],
    caption: '데님 위에만 얹은 레드 포인트. 실루엣이 청량하게 잡혀서 오늘 코디 무드 찍었어요.',
    locationText: '한남',
    moodTags: [moodTags[1], moodTags[5]],
    reactionSummary: buildReactionSummary(4.4, 94, 5),
    commentsCount: 7,
    bookmarked: false,
    createdAt: '2026-04-16T09:40:00Z',
    visibility: 'public'
  }
];

export const chalnaFeed: ChalnaCardModel[] = [
  {
    postId: 'chalna-street-cross',
    postType: 'chalna',
    author: users[2],
    thumbnailImageUrl:
      'https://images.unsplash.com/photo-1509631179647-b017882f9a43?auto=format&fit=crop&w=720&q=80',
    caption: '횡단보도에서 잡은 찰나 컷. 코트 끝이 살짝 날리던 순간만요.',
    moodTags: [moodTags[11], moodTags[3]],
    expiresAt: '2026-04-17T03:30:00Z',
    remainingSeconds: 23400,
    hasUnread: true,
    reactionSummary: buildReactionSummary(4.7, 28)
  },
  {
    postId: 'chalna-sneaker-mood',
    postType: 'chalna',
    author: users[0],
    thumbnailImageUrl:
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=720&q=80',
    caption: '요즘 신는 셀만 찰나로. 스니커 취향도 감도에 한 번 박아둘게요.',
    moodTags: [moodTags[1], moodTags[0]],
    expiresAt: '2026-04-17T16:00:00Z',
    remainingSeconds: 54000,
    hasUnread: false,
    reactionSummary: buildReactionSummary(4.2, 17)
  }
];

export const postDetails: Record<string, PostDetailModel> = {
  'post-look-yellow-seongsu': {
    ...homeFeed[0],
    participationCount: 156,
    comments: [
      {
        id: 'comment-1',
        user: users[1],
        content: '옐로 톤이 몽글몽글해서 폭닥 여운 남기고 갈게요.',
        createdAt: '2026-04-16T11:45:00Z'
      },
      {
        id: 'comment-2',
        user: users[2],
        content: '풀룩 밸런스 미쳤다… 무드카드에 고정할래요.',
        createdAt: '2026-04-16T12:02:00Z'
      }
    ]
  },
  'post-fit-denim-layer': {
    ...homeFeed[1],
    participationCount: 94,
    comments: [
      {
        id: 'comment-3',
        user: users[0],
        content: '레이어링 감도 젤리 각이에요. 산책 탭에서 또 보고 싶어요.',
        createdAt: '2026-04-16T10:15:00Z'
      }
    ]
  }
};

export const profileSummary: ProfileSummary = {
  user: users[0],
  bio: '코디 감도 80, 스니커·플레이리스트 취향 20. 여운으로 기록 중이에요.',
  averagePawScore: 4.59,
  followersCount: 328,
  followingCount: 121,
  receivedReactionsCount: 940,
  representativeMoodTags: [moodTags[0], moodTags[3], moodTags[1]],
  currentChalna: chalnaFeed[1],
  posts: homeFeed
};

export const notifications: NotificationItem[] = [
  {
    id: 'notification-1',
    type: 'post_reaction',
    title: '누군가 젤리까지 찍고 갔어요',
    body: '젤리하늘님이 옐로 풀룩 무드카드에 여운을 남겼어요.',
    createdAt: '2026-04-16T12:20:00Z',
    isRead: false
  },
  {
    id: 'notification-2',
    type: 'message_request',
    title: '편지함에 요청이 도착했어요',
    body: '새벽롤님이 코디 무드를 보고 편지를 보냈어요.',
    createdAt: '2026-04-16T08:55:00Z',
    isRead: true
  }
];

export const conversations: ConversationPreview[] = [
  {
    id: 'conversation-1',
    partner: {
      userId: 'user-dawnroll',
      nickname: '새벽롤',
      profileImageUrl: users[2].profileImageUrl,
      representativeMoodTag: moodTags[3]
    },
    preview: '성수 옐로 풀룩, 촬영 각도 편지로 물어봐도 될까요?',
    updatedAt: '방금 전',
    unreadCount: 2
  },
  {
    id: 'conversation-2',
    partner: {
      userId: 'user-jellysky',
      nickname: '젤리하늘',
      profileImageUrl: users[1].profileImageUrl,
      representativeMoodTag: moodTags[1]
    },
    preview: '데님 레이어링 무드, 제 취향이랑 겹쳐서 반가웠어요.',
    updatedAt: '1시간 전',
    unreadCount: 0
  }
];

export function getPostDetail(postId: string): PostDetailModel | undefined {
  return postDetails[postId];
}

export function getChalna(postId: string): ChalnaCardModel | undefined {
  return chalnaFeed.find((item) => item.postId === postId);
}
