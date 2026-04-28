import { PrismaClient } from '../src/generated/prisma/index.js';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import bcrypt from 'bcryptjs';

const rootEnvPath = resolve(process.cwd(), '../../.env');
const localEnvPath = resolve(process.cwd(), '.env');
if (existsSync(rootEnvPath)) loadDotenv({ path: rootEnvPath });
else if (existsSync(localEnvPath)) loadDotenv({ path: localEnvPath });

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/gamdojang';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 시드 시작...');

  // ─── Cleanup ──────────────────────────────────────────────
  await prisma.adminActionLog.deleteMany();
  await prisma.paymentRefund.deleteMany();
  await prisma.paymentOrder.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationSetting.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.messageRequest.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.pawReaction.deleteMany();
  await prisma.postMoodTag.deleteMany();
  await prisma.postImage.deleteMany();
  await prisma.post.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.block.deleteMany();
  await prisma.userInterestMoodTag.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.moodTag.deleteMany();

  console.log('  ✓ 기존 데이터 초기화 완료');

  // ─── Mood Tags ────────────────────────────────────────────
  /** 구 시드 무드 인덱스(0~7) → 신규 12종 인덱스 */
  const mapLegacyMoodTagIdx = (i: number): number => {
    const table = [0, 1, 5, 11, 3, 6, 10, 7];
    return table[i] ?? i;
  };

  const moodTagData: {
    name: string;
    slug: string;
    displayOrder: number;
    editorialSlot?: string | null;
  }[] = [
    { name: '데일리룩', slug: 'daily-look', displayOrder: 0, editorialSlot: 'today' },
    { name: '오늘의코디', slug: 'today-coordi', displayOrder: 1, editorialSlot: 'rising' },
    { name: '오오티디', slug: 'ootd-ko', displayOrder: 2, editorialSlot: 'minor' },
    { name: 'ootd', slug: 'ootd', displayOrder: 3 },
    { name: '여자코디', slug: 'womens-coordi', displayOrder: 4 },
    { name: '빈티지룩', slug: 'vintage-look', displayOrder: 5 },
    { name: '감성코디', slug: 'mood-coordi', displayOrder: 6 },
    { name: '꾸안꾸룩', slug: 'effortless-chic', displayOrder: 7 },
    { name: '캐주얼룩', slug: 'casual-look', displayOrder: 8 },
    { name: '레이어드룩', slug: 'layered-look', displayOrder: 9 },
    { name: '니트코디', slug: 'knit-coordi', displayOrder: 10 },
    { name: '가을코디', slug: 'fall-coordi', displayOrder: 11 },
  ];

  const moodTags = await Promise.all(
    moodTagData.map((t) =>
      prisma.moodTag.create({
        data: {
          name: t.name,
          slug: t.slug,
          displayOrder: t.displayOrder,
          ...(t.editorialSlot ? { editorialSlot: t.editorialSlot } : {})
        }
      })
    )
  );

  console.log(`  ✓ 무드 태그 ${moodTags.length}개 생성`);

  // ─── Users ────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('0000', 10);

  const userData = [
    {
      email: 'cloud@test.com',
      nickname: '도장꾹꾹',
      bio: '코디 감도 80, 스니커·플리 취향 20. 여운으로 기록해요.',
      profileImageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80',
      moodTagIndex: 0,
    },
    {
      email: 'mint@test.com',
      nickname: '젤리하늘',
      bio: '청량한 실루엣이랑 레이어링만 골라 담아요.',
      profileImageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=240&q=80',
      moodTagIndex: 1,
    },
    {
      email: 'film@test.com',
      nickname: '새벽롤',
      bio: '필름 감도로 코트 끝선이랑 주름까지 남겨요.',
      profileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
      moodTagIndex: 4,
    },
    {
      email: 'dawn@test.com',
      nickname: '안개산책',
      bio: '새벽 촬영으로 실루엣 정리하는 스트릿 쪽이에요.',
      profileImageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80',
      moodTagIndex: 3,
    },
    {
      email: 'cozy@test.com',
      nickname: '크림조명',
      bio: '니트 질감이랑 조명 톤 맞춘 룩만 모아요.',
      profileImageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=240&q=80',
      moodTagIndex: 6,
    },
    {
      email: 'vintage@test.com',
      nickname: '골목보관함',
      bio: '빈티지 패턴·소재 감도 편집샵 위주로 걸어요.',
      profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80',
      moodTagIndex: 2,
    },
  ];

  const users = await Promise.all(
    userData.map((u) =>
      prisma.user.create({
        data: {
          email: u.email,
          passwordHash,
          status: 'active',
          emailVerified: true,
          profile: {
            create: {
              nickname: u.nickname,
              bio: u.bio,
              profileImageUrl: u.profileImageUrl,
              representativeMoodTagId: moodTags[mapLegacyMoodTagIdx(u.moodTagIndex)].id,
              postsCount: 0,
              followersCount: 0,
              followingCount: 0,
              receivedReactionsCount: 0,
            },
          },
        },
        include: { profile: true },
      })
    )
  );

  console.log(`  ✓ 사용자 ${users.length}명 생성`);

  // ─── Interest Mood Tags ───────────────────────────────────
  const interestLinks = [
    { userIdx: 0, tagIdxs: [0, 3, 4] },
    { userIdx: 1, tagIdxs: [1, 4] },
    { userIdx: 2, tagIdxs: [4, 2] },
    { userIdx: 3, tagIdxs: [3, 7] },
    { userIdx: 4, tagIdxs: [6, 0] },
    { userIdx: 5, tagIdxs: [2, 5] },
  ];

  await prisma.userInterestMoodTag.createMany({
    data: interestLinks.flatMap((l) =>
      l.tagIdxs.map((ti) => ({
        userId: users[l.userIdx].id,
        moodTagId: moodTags[mapLegacyMoodTagIdx(ti)].id,
      }))
    ),
  });

  console.log('  ✓ 관심 무드 태그 연결 완료');

  // ─── Follows ──────────────────────────────────────────────
  const followPairs = [
    [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
    [1, 0], [1, 2], [1, 4],
    [2, 0], [2, 1], [2, 3],
    [3, 0], [3, 2], [3, 5],
    [4, 0], [4, 1], [4, 5],
    [5, 0], [5, 2], [5, 4],
  ];

  await prisma.follow.createMany({
    data: followPairs.map(([a, b]) => ({
      followerUserId: users[a].id,
      followeeUserId: users[b].id,
      status: 'accepted' as const,
    })),
  });

  // Update follower/following counts
  for (const user of users) {
    const followersCount = followPairs.filter(([, b]) => b === userData.indexOf(userData.find((_, i) => users[i].id === user.id)!)).length;
    const followingCount = followPairs.filter(([a]) => a === users.indexOf(user)).length;
    await prisma.userProfile.update({
      where: { userId: user.id },
      data: { followersCount, followingCount },
    });
  }

  console.log('  ✓ 팔로우 관계 생성 완료');

  // ─── Regular Posts ────────────────────────────────────────
  /** 일반 게시물 40개: 패션·룩 컷 위주(Unsplash). 풍경 단독 컷 없음. */
  const postData = [
    {
      userIdx: 0,
      caption: '성수 편집샵 앞 옐로 풀룩. 컷이 말랑하게 떨어져서 감도만 남겼어요.',
      locationText: '성수',
      tagIdxs: [0, 4],
      images: [
        { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 1,
      caption: '데님 위에만 얹은 레드 포인트. 실루엣이 청량하게 잡힌 날이에요.',
      locationText: '한남',
      tagIdxs: [1, 2],
      images: [
        { url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4a?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 2,
      caption: '횡단보도에서 잡은 스트릿 컷. 코트 끝선이 필름처럼 느껴졌어요.',
      locationText: '압구정',
      tagIdxs: [4, 3],
      images: [
        { url: 'https://images.unsplash.com/photo-1509631179647-b017882f9a43?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
        { url: 'https://images.unsplash.com/photo-1496747611176-843222ebc102?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 720 },
      ],
    },
    {
      userIdx: 3,
      caption: '한남 루프탑 바람 맞춰 입은 롱코트. 새벽 무드로 실루엣만 정리했어요.',
      locationText: '한남',
      tagIdxs: [3, 1],
      images: [
        { url: 'https://images.unsplash.com/photo-1503341450723-e9b137aff6c9?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 4,
      caption: '편집숍 돌다가 걸린 쇼핑 백이랑 부츠 컷. 니트 질감이 포근하게 올라왔어요.',
      locationText: '성수',
      tagIdxs: [6, 0],
      images: [
        { url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 720 },
      ],
    },
    {
      userIdx: 5,
      caption: '빈티지 재킷 어깨선이랑 스커트 밸런스. 이태원 골목 편집 감도예요.',
      locationText: '이태원',
      tagIdxs: [2, 5],
      images: [
        { url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 720 },
        { url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 720 },
      ],
    },
    {
      userIdx: 0,
      caption: '네온 아래서만 살아나는 재킷 질감. 야간 스트릿 룩 여운.',
      locationText: '홍대',
      tagIdxs: [0, 3],
      images: [
        { url: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 1,
      caption: '화이트 터틀넥 클로즈업. 피부톤이랑 소재 무드만 남기고 싶었어요.',
      tagIdxs: [1, 6],
      images: [
        { url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 3,
      caption: '요즘 루프에 도는 스니커만 모아둔 취향 샷. 감도는 오렌지 배경에 박았어요.',
      tagIdxs: [1, 4],
      images: [
        { url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 720 },
      ],
    },
    {
      userIdx: 5,
      caption: '플레이리스트 돌릴 때 책상 무드. 패션은 아니지만 제 취향 20%예요.',
      locationText: '집',
      tagIdxs: [7, 1],
      images: [
        { url: 'https://images.unsplash.com/photo-1493225457124-a210ec0ccc0b?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 720 },
      ],
    },
    {
      userIdx: 2,
      caption: '모노톤 슬랙스와 루즈 셔츠. 출근길에 입고 싶은 실루엣만 남겼어요.',
      locationText: '강남',
      tagIdxs: [1, 3],
      images: [
        { url: 'https://images.unsplash.com/photo-1495121605193-b116b5b09adf?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 4,
      caption: '오버핏 블레이저 어깨선. 회색 톤으로만 정리한 미니멀 룩.',
      tagIdxs: [0, 6],
      images: [
        { url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 0,
      caption: '레더 재킷과 와이드 데님. 야간 조명만 받은 스트릿 감도.',
      tagIdxs: [3, 4],
      images: [
        { url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 3,
      caption: '크롭 탑과 카고 팬츠. 편집샵 앞에서만 잡힌 힙한 실루엣.',
      tagIdxs: [2, 4],
      images: [
        { url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4a?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 1,
      caption: '베이지 트렌치 안쪽 니트 레이어. 바람 부는 날 무드만.',
      tagIdxs: [3, 6],
      images: [
        { url: 'https://images.unsplash.com/photo-1503341450723-e9b137aff6c9?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 5,
      caption: '청키 스니커와 롱삭스 조합. 바닥 컷으로만 남긴 취향.',
      tagIdxs: [1, 4],
      images: [
        { url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 720 },
      ],
    },
    {
      userIdx: 2,
      caption: '실크 셔츠 단추 라인 클로즈업. 광택만 모아둔 룩.',
      tagIdxs: [6, 1],
      images: [
        { url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 720 },
      ],
    },
    {
      userIdx: 4,
      caption: '패딩 집업과 트랙팬츠. 주말 산책용 캐주얼 감도.',
      tagIdxs: [5, 2],
      images: [
        { url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 720 },
      ],
    },
    {
      userIdx: 0,
      caption: '체크 스커트와 니삭스. 교복 느낌 살린 톤다운된 코디.',
      tagIdxs: [2, 0],
      images: [
        { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 3,
      caption: '메탈릭 액세서리만 모은 손 컷. 룩의 10% 포인트.',
      tagIdxs: [4, 0],
      images: [
        { url: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 1,
      caption: '블랙 미니 원피스에 실버 체인. 클럽 앞에서만 찍은 밤 룩.',
      locationText: '이태원',
      tagIdxs: [0, 3],
      images: [
        { url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 5,
      caption: '코듀로이 팬츠랑 울 베스트. 가을빛만 담은 레이어링.',
      tagIdxs: [2, 6],
      images: [
        { url: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 2,
      caption: '스트라이프 셔츠에 와이드 슬랙스. 사무실 창가 무드 한 컷.',
      locationText: '여의도',
      tagIdxs: [1, 7],
      images: [
        { url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 0,
      caption: '캔버스 토트랑 린넨 팬츠. 산책 코디의 80%는 소재예요.',
      tagIdxs: [7, 4],
      images: [
        { url: 'https://images.unsplash.com/photo-1509631179647-b017882f9a43?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
        { url: 'https://images.unsplash.com/photo-1490481658971-ab17de4a43a3?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 720 },
      ],
    },
    {
      userIdx: 4,
      caption: '메리제인에 양말 룩. 편집샵 거울 앞에서만 남긴 각도.',
      tagIdxs: [1, 5],
      images: [
        { url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 3,
      caption: '그레이 후디에 쇼트 팬츠. 공항 픽업 룩으로도 쓰고 싶은 조합.',
      tagIdxs: [5, 1],
      images: [
        { url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 5,
      caption: '플리츠 스커트랑 니트 베스트. 도서관 계단 무드.',
      tagIdxs: [6, 3],
      images: [
        { url: 'https://images.unsplash.com/photo-1581044777550-4cfa61207b88?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 1,
      caption: '올 블랙에 실루엣만 살린 날. 그림자랑 합쳐진 스트릿 컷.',
      locationText: '홍대',
      tagIdxs: [3, 4],
      images: [
        { url: 'https://images.unsplash.com/photo-1550614000-4b9519e02d4a?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 0,
      caption: '파스텔 니트랑 진청 데님. 봄 햇살에만 어울리는 톤.',
      tagIdxs: [0, 1],
      images: [
        { url: 'https://images.unsplash.com/photo-1469334034218-1beafadeec6a?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 2,
      caption: '트렌치 안에 후드 집업. 레이어 실루엣만 보이게 잘랐어요.',
      tagIdxs: [4, 2],
      images: [
        { url: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 4,
      caption: '새틴 스커트와 가죽 벨트. 조명 하나만 받은 무드 샷.',
      tagIdxs: [0, 6],
      images: [
        { url: 'https://images.unsplash.com/photo-1566174053879-6b3c88a3e65f?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 3,
      caption: '카우보이 부츠에 미디 스커트. 빈티지 마켓에서 고른 조합.',
      locationText: '용산',
      tagIdxs: [2, 4],
      images: [
        { url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 5,
      caption: '아노락 재킷과 조거. 비 오는 날 산책 룩.',
      tagIdxs: [5, 7],
      images: [
        { url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 1,
      caption: '화이트 셔츠에 골드 귀걸이만. 미니멀 룩의 여백.',
      tagIdxs: [7, 0],
      images: [
        { url: 'https://images.unsplash.com/photo-1521572163474-686440f14e66?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 0,
      caption: '체크 재킷과 와이드 슬랙스. 지하철 플랫폼에서 잡은 컷.',
      tagIdxs: [3, 2],
      images: [
        { url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 2,
      caption: '크롭 가죽 재킷에 데님 미니. 야외 페스티벌 전 찍은 룩.',
      tagIdxs: [4, 1],
      images: [
        { url: 'https://images.unsplash.com/photo-1617127365659-a47cd1681d32?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 4,
      caption: '브라운 톤 온리 코디. 카페 테라스 의자 색이랑 맞췄어요.',
      tagIdxs: [6, 5],
      images: [
        { url: 'https://images.unsplash.com/photo-1572804013309-0a6b5d7b1793?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 3,
      caption: '메쉬 탑이랑 로우라이즈 진. Y2K 무드만 살짝.',
      tagIdxs: [2, 0],
      images: [
        { url: 'https://images.unsplash.com/photo-1571945153237-46f615a1161d?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 5,
      caption: '셔츠 원피스에 레인부츠. 장마철에도 실루엣은 지키고 싶어서.',
      tagIdxs: [1, 3],
      images: [
        { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
    {
      userIdx: 1,
      caption: '실버 퍼프 재킷이랑 블랙 스키니. 겨울 야경이랑 톤 맞춤.',
      tagIdxs: [4, 3],
      images: [
        { url: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=1080&q=80', w: 1080, h: 1350 },
      ],
    },
  ];

  const createdPosts = [];
  const baseDate = new Date('2026-04-15T06:00:00Z');

  for (let i = 0; i < postData.length; i++) {
    const p = postData[i];
    const createdAt = new Date(baseDate.getTime() + i * 90 * 60 * 1000);

    const post = await prisma.post.create({
      data: {
        userId: users[p.userIdx].id,
        postType: 'regular',
        caption: p.caption,
        locationText: p.locationText ?? null,
        visibility: 'public',
        status: 'active',
        createdAt,
        images: {
          create: p.images.map((img, idx) => ({
            imageUrl: img.url,
            width: img.w,
            height: img.h,
            sortOrder: idx,
          })),
        },
        moodTags: {
          create: p.tagIdxs.map((ti) => ({ moodTagId: moodTags[mapLegacyMoodTagIdx(ti)].id })),
        },
      },
    });

    createdPosts.push(post);
  }

  console.log(`  ✓ 일반 게시물 ${createdPosts.length}개 생성`);

  // ─── Chalna Posts ─────────────────────────────────────────
  const chalnaData = [
    {
      userIdx: 2,
      caption: '백스테이지 직전 찰나. 재킷만 걸친 채로 남길게요.',
      tagIdxs: [4, 3],
      imageUrl: 'https://images.unsplash.com/photo-1503341450723-e9b137aff6c9?auto=format&fit=crop&w=720&q=80',
      expiresInHours: 24,
    },
    {
      userIdx: 0,
      caption: '옐로 코트 자락이 스쳐 지나가는 찰나, 여운 받아가도 돼요.',
      tagIdxs: [0, 4],
      imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=720&q=80',
      expiresInHours: 12,
    },
    {
      userIdx: 4,
      caption: '니트 소매만 보이는 찰나. 크림 톤 포인트예요.',
      tagIdxs: [6, 0],
      imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=720&q=80',
      expiresInHours: 24,
    },
    {
      userIdx: 3,
      caption: '스니커 밑창 무드만 찰나로. 취향 20% 슬쩍 남겨요.',
      tagIdxs: [1, 4],
      imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=720&q=80',
      expiresInHours: 12,
    },
  ];

  const createdChalnas = [];

  for (const c of chalnaData) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + c.expiresInHours * 60 * 60 * 1000);

    const chalna = await prisma.post.create({
      data: {
        userId: users[c.userIdx].id,
        postType: 'chalna',
        caption: c.caption,
        visibility: 'public',
        status: 'active',
        expiresAt,
        images: {
          create: {
            imageUrl: c.imageUrl,
            width: 720,
            height: 960,
            sortOrder: 0,
          },
        },
        moodTags: {
          create: c.tagIdxs.map((ti) => ({ moodTagId: moodTags[mapLegacyMoodTagIdx(ti)].id })),
        },
      },
    });

    createdChalnas.push(chalna);
  }

  console.log(`  ✓ 찰나 게시물 ${createdChalnas.length}개 생성`);

  // ─── Paw Reactions ────────────────────────────────────────
  const getPawLabel = (avg: number) => {
    if (avg >= 4.5) return '젤리' as const;
    if (avg >= 3.5) return '폭닥' as const;
    if (avg >= 2.5) return '꾹' as const;
    if (avg >= 1.5) return '콕' as const;
    return '슬쩍' as const;
  };

  const reactionPlan: { postIdx: number; reactors: { userIdx: number; score: number }[] }[] = [
    { postIdx: 0, reactors: [{ userIdx: 1, score: 5 }, { userIdx: 2, score: 4 }, { userIdx: 3, score: 5 }, { userIdx: 4, score: 5 }, { userIdx: 5, score: 4 }] },
    { postIdx: 1, reactors: [{ userIdx: 0, score: 5 }, { userIdx: 2, score: 4 }, { userIdx: 4, score: 3 }] },
    { postIdx: 2, reactors: [{ userIdx: 0, score: 4 }, { userIdx: 1, score: 5 }, { userIdx: 3, score: 4 }, { userIdx: 5, score: 3 }] },
    { postIdx: 3, reactors: [{ userIdx: 0, score: 5 }, { userIdx: 1, score: 4 }, { userIdx: 4, score: 5 }] },
    { postIdx: 4, reactors: [{ userIdx: 0, score: 3 }, { userIdx: 2, score: 4 }, { userIdx: 3, score: 4 }] },
    { postIdx: 5, reactors: [{ userIdx: 1, score: 4 }, { userIdx: 3, score: 3 }, { userIdx: 4, score: 5 }] },
    { postIdx: 6, reactors: [{ userIdx: 1, score: 5 }, { userIdx: 2, score: 5 }, { userIdx: 3, score: 4 }, { userIdx: 5, score: 5 }] },
    { postIdx: 7, reactors: [{ userIdx: 0, score: 4 }, { userIdx: 3, score: 3 }] },
    { postIdx: 8, reactors: [{ userIdx: 0, score: 5 }, { userIdx: 2, score: 4 }] },
    { postIdx: 9, reactors: [{ userIdx: 0, score: 4 }, { userIdx: 1, score: 5 }, { userIdx: 4, score: 3 }] },
  ];

  let totalReactions = 0;
  for (const plan of reactionPlan) {
    const post = createdPosts[plan.postIdx];
    for (const r of plan.reactors) {
      await prisma.pawReaction.create({
        data: {
          postId: post.id,
          userId: users[r.userIdx].id,
          score: r.score,
        },
      });
      totalReactions++;
    }
    const sum = plan.reactors.reduce((s, r) => s + r.score, 0);
    const count = plan.reactors.length;
    const avg = Number((sum / count).toFixed(2));

    await prisma.post.update({
      where: { id: post.id },
      data: {
        reactionsCount: count,
        reactionScoreSum: sum,
        reactionScoreAvg: avg,
        topReactionLabel: getPawLabel(avg),
      },
    });
  }

  // Chalna reactions
  const chalnaReactionPlan = [
    { chalnaIdx: 0, reactors: [{ userIdx: 0, score: 5 }, { userIdx: 1, score: 5 }, { userIdx: 3, score: 4 }] },
    { chalnaIdx: 1, reactors: [{ userIdx: 1, score: 4 }, { userIdx: 2, score: 5 }, { userIdx: 5, score: 4 }] },
    { chalnaIdx: 2, reactors: [{ userIdx: 0, score: 4 }, { userIdx: 3, score: 3 }] },
    { chalnaIdx: 3, reactors: [{ userIdx: 0, score: 5 }, { userIdx: 2, score: 5 }, { userIdx: 4, score: 4 }] },
  ];

  for (const plan of chalnaReactionPlan) {
    const chalna = createdChalnas[plan.chalnaIdx];
    for (const r of plan.reactors) {
      await prisma.pawReaction.create({
        data: {
          postId: chalna.id,
          userId: users[r.userIdx].id,
          score: r.score,
        },
      });
      totalReactions++;
    }
    const sum = plan.reactors.reduce((s, r) => s + r.score, 0);
    const count = plan.reactors.length;
    const avg = Number((sum / count).toFixed(2));

    await prisma.post.update({
      where: { id: chalna.id },
      data: {
        reactionsCount: count,
        reactionScoreSum: sum,
        reactionScoreAvg: avg,
        topReactionLabel: getPawLabel(avg),
      },
    });
  }

  console.log(`  ✓ 여운 반응 ${totalReactions}개 생성`);

  // Update user received reactions & average paw score
  for (const user of users) {
    const stats = await prisma.pawReaction.aggregate({
      where: { post: { userId: user.id } },
      _count: true,
      _avg: { score: true },
    });
    await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        receivedReactionsCount: stats._count,
        averagePawScore: stats._avg.score ? Number(stats._avg.score.toFixed(2)) : 0,
      },
    });
  }

  // Update user post counts
  for (const user of users) {
    const count = await prisma.post.count({ where: { userId: user.id, status: 'active' } });
    await prisma.userProfile.update({
      where: { userId: user.id },
      data: { postsCount: count },
    });
  }

  // ─── Comments ─────────────────────────────────────────────
  const commentData = [
    { postIdx: 0, userIdx: 1, content: '옐로 톤이 몽글몽글해서 폭닥 여운 남기고 갈게요.' },
    { postIdx: 0, userIdx: 2, content: '풀룩 밸런스 미쳤다… 무드카드에 고정할래요.' },
    { postIdx: 0, userIdx: 4, content: '성수 편집샵 라인이랑 찰떡이에요. 산책 탭에서 또 보고 싶어요!' },
    { postIdx: 1, userIdx: 0, content: '데님+레드 조합 젤리 각이에요.' },
    { postIdx: 1, userIdx: 3, content: '실루엣 청량함이 편지함에 담기고 싶은 느낌.' },
    { postIdx: 2, userIdx: 0, content: '횡단보도 컷 필름 감도… 여운 박고 싶어요.' },
    { postIdx: 2, userIdx: 3, content: '두 번째 컷도 스트릿 밸런스 좋아요.' },
    { postIdx: 3, userIdx: 1, content: '롱코트 실루엣 저랑 취향 겹쳐요.' },
    { postIdx: 3, userIdx: 5, content: '루프탑 바람 맞춘 핏이 너무 예뻐요.' },
    { postIdx: 4, userIdx: 0, content: '쇼핑 백이랑 부츠 컬러 조합 포근해요.' },
    { postIdx: 5, userIdx: 3, content: '빈티지 재킷 어깨선 무드 최고예요.' },
    { postIdx: 6, userIdx: 2, content: '네온 아래 재킷 질감, 젤리 여운 각이에요.' },
    { postIdx: 6, userIdx: 5, content: '야간 스트릿 룩으로 무드카드 채우고 싶어요.' },
    { postIdx: 7, userIdx: 2, content: '터틀넥 소재 클로즈업 청량이랑 포근 둘 다 있어요.' },
    { postIdx: 8, userIdx: 4, content: '스니커 취향 샷이라 말랑하게 읽혀요.' },
    { postIdx: 9, userIdx: 1, content: '데스크 무드도 여운 받아도 될 듯. 취향 20% 좋아요.' },
  ];

  const createdComments = [];
  for (let i = 0; i < commentData.length; i++) {
    const c = commentData[i];
    const comment = await prisma.comment.create({
      data: {
        postId: createdPosts[c.postIdx].id,
        userId: users[c.userIdx].id,
        content: c.content,
        createdAt: new Date(baseDate.getTime() + (i + 10) * 30 * 60 * 1000),
      },
    });
    createdComments.push(comment);
  }

  // Replies
  const replyData = [
    { parentIdx: 0, userIdx: 0, content: '폭닥 여운 고마워요. 오늘 코디 무드카드가 말랑해졌어요.' },
    { parentIdx: 3, userIdx: 1, content: '맞아요, 레드만 살짝 올린 날이에요. 핏 체크해줘서 고마워요!' },
    { parentIdx: 5, userIdx: 2, content: '압구정 횡단보도 각이 진짜 잘 나와요.' },
    { parentIdx: 7, userIdx: 3, content: '루프탑에서만 나오는 주름이라 애착 있어요. 다음엔 산책 탭에서 봐요.' },
  ];

  for (const r of replyData) {
    await prisma.comment.create({
      data: {
        postId: createdComments[r.parentIdx].postId,
        userId: users[r.userIdx].id,
        parentCommentId: createdComments[r.parentIdx].id,
        content: r.content,
      },
    });
  }

  // Update comment counts
  for (const post of createdPosts) {
    const count = await prisma.comment.count({ where: { postId: post.id } });
    await prisma.post.update({
      where: { id: post.id },
      data: { commentsCount: count },
    });
  }

  console.log(`  ✓ 댓글 ${commentData.length + replyData.length}개 생성`);

  // ─── Bookmarks ────────────────────────────────────────────
  const bookmarkPairs = [
    [0, 1], [0, 2], [0, 5],
    [1, 0], [1, 3],
    [2, 0], [2, 6],
    [3, 4], [3, 8],
    [4, 0], [4, 7],
    [5, 2], [5, 9],
  ];

  await prisma.bookmark.createMany({
    data: bookmarkPairs.map(([uIdx, pIdx]) => ({
      userId: users[uIdx].id,
      postId: createdPosts[pIdx].id,
    })),
  });

  // Update bookmark counts
  for (const post of createdPosts) {
    const count = await prisma.bookmark.count({ where: { postId: post.id } });
    await prisma.post.update({
      where: { id: post.id },
      data: { bookmarksCount: count },
    });
  }

  console.log(`  ✓ 북마크 ${bookmarkPairs.length}개 생성`);

  // ─── Conversations & Messages ─────────────────────────────
  const convData = [
    {
      members: [0, 2],
      messages: [
        { senderIdx: 2, content: '편지 드려요. 성수 옐로 풀룩, 어느 편집샵 앞 각인지 알려주실 수 있을까요?' },
        { senderIdx: 0, content: '성수역 3번 쪽 골목이에요! 여운 남겨줘서 고마워요.' },
        { senderIdx: 2, content: '저도 그 라인 자주 가요. 다음엔 같이 스트릿 찰나 찍어요.' },
        { senderIdx: 0, content: '좋아요. 홍대 야간 룩으로 맞춰볼까요?' },
      ],
    },
    {
      members: [0, 1],
      messages: [
        { senderIdx: 1, content: '데님 레이어링 무드 진짜 청량했어요. 무드카드 잘 봤어요.' },
        { senderIdx: 0, content: '덕분에 젤리 여운도 받았어요. 코디 말랑한 하루였어요.' },
        { senderIdx: 1, content: '다음엔 압구정 횡단보도 감도 같이 찍어요!' },
      ],
    },
    {
      members: [3, 5],
      messages: [
        { senderIdx: 5, content: '루프탑 롱코트 핏, 새벽 무드가 너무 잘 담겼어요.' },
        { senderIdx: 3, content: '바람 맞춰 입는 게 제일 정리돼요. 안개산책 별명이 이유 있죠.' },
        { senderIdx: 5, content: '저는 이태원 빈티지 편집 감도 자주 모아요. 나중에 산책 탭에서 봐요.' },
      ],
    },
  ];

  for (const conv of convData) {
    const conversation = await prisma.conversation.create({
      data: {
        conversationType: 'direct',
        members: {
          create: conv.members.map((mIdx) => ({ userId: users[mIdx].id })),
        },
      },
    });

    let lastMsgTime = new Date(baseDate);
    for (let i = 0; i < conv.messages.length; i++) {
      const m = conv.messages[i];
      lastMsgTime = new Date(lastMsgTime.getTime() + (15 + i * 10) * 60 * 1000);
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderUserId: users[m.senderIdx].id,
          messageType: 'text',
          content: m.content,
          createdAt: lastMsgTime,
        },
      });
    }

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: lastMsgTime },
    });
  }

  console.log('  ✓ 대화 및 메시지 생성 완료');

  // ─── Message Requests ─────────────────────────────────────
  await prisma.messageRequest.createMany({
    data: [
      {
        fromUserId: users[4].id,
        toUserId: users[0].id,
        initialMessage: '도장꾹꾹님 옐로 풀룩 감도가 말랑해서 편지 남겨요. 크림조명이에요!',
        status: 'pending',
      },
      {
        fromUserId: users[5].id,
        toUserId: users[1].id,
        initialMessage: '젤리하늘님, 데님 레이어링 취향이 비슷한 것 같아 인사해요.',
        status: 'pending',
      },
    ],
  });

  console.log('  ✓ 편지 요청 생성 완료');

  // ─── Reports (운영 콘솔 QA용) ─────────────────────────────
  await prisma.report.createMany({
    data: [
      {
        reporterUserId: users[1].id,
        targetType: 'post',
        targetId: createdPosts[0].id,
        reasonCode: 'spam',
        detailText: '테스트: 스팸 의심',
        status: 'submitted',
      },
      {
        reporterUserId: users[2].id,
        targetType: 'user',
        targetId: users[5].id,
        reasonCode: 'harassment',
        status: 'reviewing',
      },
      {
        reporterUserId: users[0].id,
        targetType: 'post',
        targetId: createdPosts[3].id,
        reasonCode: 'appearance_shaming',
        status: 'submitted',
      },
    ],
  });
  console.log('  ✓ 신고 샘플 생성 완료');

  // ─── Notifications ────────────────────────────────────────
  const notificationData = [
    { userIdx: 0, type: 'post_reaction' as const, actorIdx: 1, postIdx: 0, title: '누군가 젤리까지 찍고 갔어요', body: '젤리하늘님이 무드카드에 여운을 남겼어요.' },
    { userIdx: 0, type: 'post_reaction' as const, actorIdx: 2, postIdx: 0, title: '여운이 도착했어요', body: '새벽롤님이 무드카드에 여운을 남겼어요.' },
    { userIdx: 0, type: 'post_comment' as const, actorIdx: 1, postIdx: 0, title: '새 댓글이 달렸어요', body: '젤리하늘님이 댓글을 남겼어요: "무드가 말랑해서 폭닥..."' },
    { userIdx: 0, type: 'follow' as const, actorIdx: 4, postIdx: null, title: '새 팔로워가 생겼어요', body: '크림조명님이 팔로우했어요.' },
    { userIdx: 0, type: 'message_request' as const, actorIdx: 4, postIdx: null, title: '편지함에 요청이 도착했어요', body: '크림조명님이 편지를 보냈어요.' },
    { userIdx: 0, type: 'chalna_reaction' as const, actorIdx: 1, postIdx: null, title: '찰나에 여운이!', body: '젤리하늘님이 찰나에 여운을 남겼어요.' },
    { userIdx: 1, type: 'post_reaction' as const, actorIdx: 0, postIdx: 1, title: '여운이 도착했어요', body: '도장꾹꾹님이 무드카드에 젤리를 남겼어요.' },
    { userIdx: 1, type: 'follow' as const, actorIdx: 4, postIdx: null, title: '새 팔로워가 생겼어요', body: '크림조명님이 팔로우했어요.' },
    { userIdx: 2, type: 'post_comment' as const, actorIdx: 0, postIdx: 2, title: '새 댓글이 달렸어요', body: '도장꾹꾹님이 댓글을 남겼어요: "횡단보도 컷 필름 감도…"' },
    { userIdx: 3, type: 'post_reaction' as const, actorIdx: 0, postIdx: 3, title: '여운이 도착했어요', body: '도장꾹꾹님이 젤리를 남겼어요.' },
    { userIdx: 5, type: 'message_request' as const, actorIdx: 3, postIdx: null, title: '편지함에 요청이 도착했어요', body: '안개산책님이 편지를 보냈어요.' },
  ];

  for (let i = 0; i < notificationData.length; i++) {
    const n = notificationData[i];
    await prisma.notification.create({
      data: {
        userId: users[n.userIdx].id,
        notificationType: n.type,
        actorUserId: users[n.actorIdx].id,
        postId: n.postIdx !== null ? createdPosts[n.postIdx].id : null,
        title: n.title,
        body: n.body,
        isRead: i > 3,
        createdAt: new Date(baseDate.getTime() + i * 45 * 60 * 1000),
      },
    });
  }

  console.log(`  ✓ 알림 ${notificationData.length}개 생성`);

  // ─── Notification Settings ────────────────────────────────
  for (const user of users) {
    await prisma.notificationSetting.create({
      data: { userId: user.id },
    });
  }

  console.log('  ✓ 알림 설정 초기화 완료');

  // ─── 샘플 결제 주문 (PaymentOrder 도메인 초안) ─────────────
  await prisma.paymentOrder.create({
    data: {
      userId: users[0].id,
      provider: 'piece_find_simulated',
      externalRef: 'seed-order-1',
      amountMinor: 9900,
      currency: 'KRW',
      status: 'captured',
      note: '시드용 결제 주문 초안',
    },
  });
  console.log('  ✓ 샘플 결제 주문 1건');

  // ─── 모더레이터(부분 권한) 시드 ─────────────────────────────
  await prisma.user.create({
    data: {
      email: 'mod@gamdojang.local',
      passwordHash,
      status: 'active',
      role: 'moderator',
      emailVerified: true,
      profile: {
        create: {
          nickname: '내부모더레이터',
          bio: '신고·목록 조회 위주. 게시물/유저/편지 강제 변경 없음',
        },
      },
    },
  });
  console.log('  ✓ 모더레이터(moderator) 계정 생성');

  // ─── Admin ops 계정 ───────────────────────────────────────
  await prisma.user.create({
    data: {
      email: 'ops@gamdojang.local',
      passwordHash,
      status: 'active',
      role: 'admin',
      emailVerified: true,
      profile: {
        create: {
          nickname: '내부OPS콘솔',
          bio: '웹 운영 콘솔 전용 시드 계정',
        },
      },
    },
  });
  console.log('  ✓ 운영자(admin) 계정 생성');

  // ─── Summary ──────────────────────────────────────────────
  console.log('\n🎉 시드 완료!');
  console.log('───────────────────────────────────');
  console.log('  테스트 계정 (비밀번호: 0000)');
  console.log('───────────────────────────────────');
  for (const u of userData) {
    console.log(`  📧 ${u.email}  →  ${u.nickname}`);
  }
  console.log('  📧 mod@gamdojang.local  →  내부모더레이터 (role=moderator, 비번 0000)');
  console.log('  📧 ops@gamdojang.local  →  내부OPS콘솔 (role=admin, 비번 0000)');
  console.log('───────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ 시드 실패:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
