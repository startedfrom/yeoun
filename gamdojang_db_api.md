# 여운 DB / API 명세서

## 문서 목적

이 문서는 여운 앱의 MVP 개발을 위해 필요한 데이터 모델, API 구조, 권한 정책, 알림 흐름, 찰나 만료 처리, 운영용 고려사항을 정리한 백엔드/프론트 공용 기준 문서다.

---

# 1. 제품 요약

## 1.1 서비스 개요

여운은 사용자가 사진을 업로드하고, 다른 사용자가 사진의 외모가 아니라 **무드와 분위기**에 반응하는 파스텔 픽셀 감성 커뮤니티 앱이다.

핵심 기능:

- 일반 게시물
- 찰나(12시간 / 24시간 후 사라지는 휘발성 게시물)
- 여운(고양이 발바닥 1~5단 반응)
- 평균 감도 계산
- 댓글
- 저장(보관함)
- 산책(탐색)
- 편지함(DM)
- 알림
- 신고/차단

## 1.2 기술 방향

- 앱 클라이언트: iOS / Android 또는 크로스플랫폼
- 서버: REST API 우선
- 인증: JWT 기반 Access / Refresh Token
- 이미지 저장: Object Storage(S3 계열 권장)
- 실시간: DM/알림 일부는 WebSocket 또는 push 연동 고려
- 배치/스케줄: 찰나 만료, 알림 정리, 통계 갱신

---

# 2. 핵심 도메인 모델

## 2.1 주요 엔티티 목록

- User
- UserProfile
- MoodTag
- Post
- PostImage
- EphemeralPost (찰나는 Post.type 으로 통합 가능)
- PawReaction
- Comment
- CommentLike(optional, MVP 제외 가능)
- Bookmark
- Follow
- Conversation
- ConversationMember
- Message
- Notification
- Report
- Block
- SearchHistory
- DeviceToken
- AdminActionLog

권장 방향:

- **일반 게시물과 찰나는 Post 테이블 하나로 관리**하고 `post_type` 과 `expires_at` 으로 구분
- 여운 반응은 `PawReaction` 단일 테이블로 관리

---

# 3. DB 스키마 초안

## 3.1 users

계정의 인증 정보 및 기본 상태를 저장한다.

### fields

- `id` UUID PK
- `email` VARCHAR(255) UNIQUE NULLABLE
- `password_hash` VARCHAR(255) NULLABLE
- `social_provider` VARCHAR(50) NULLABLE
- `social_provider_user_id` VARCHAR(255) NULLABLE
- `status` VARCHAR(30) NOT NULL DEFAULT 'active'
  - active
  - suspended
  - deleted
- `role` VARCHAR(20) NOT NULL DEFAULT 'user'
  - user
  - admin
- `email_verified` BOOLEAN NOT NULL DEFAULT false
- `last_login_at` TIMESTAMP NULL
- `created_at` TIMESTAMP NOT NULL
- `updated_at` TIMESTAMP NOT NULL
- `deleted_at` TIMESTAMP NULL

### indexes

- unique(email)
- index(status)
- index(created_at)

---

## 3.2 user_profiles

앱 내 사용자 공개 정보와 설정을 저장한다.

### fields

- `id` UUID PK
- `user_id` UUID UNIQUE FK -> users.id
- `nickname` VARCHAR(30) UNIQUE NOT NULL
- `profile_image_url` TEXT NULL
- `bio` VARCHAR(160) NULL
- `representative_mood_tag_id` UUID NULL FK -> mood_tags.id
- `account_visibility` VARCHAR(20) NOT NULL DEFAULT 'public'
  - public
  - private
- `message_permission` VARCHAR(30) NOT NULL DEFAULT 'following_only'
  - everyone
  - followers_only
  - following_only
  - nobody
- `comment_permission` VARCHAR(30) NOT NULL DEFAULT 'everyone'
- `is_searchable` BOOLEAN NOT NULL DEFAULT true
- `created_at` TIMESTAMP NOT NULL
- `updated_at` TIMESTAMP NOT NULL

### derived / cached counters

아래 값은 별도 컬럼 캐시 또는 집계 테이블로 관리 가능

- `posts_count`
- `followers_count`
- `following_count`
- `received_reactions_count`
- `average_paw_score`

---

## 3.3 mood_tags

무드 태그 사전 테이블.

### fields

- `id` UUID PK
- `name` VARCHAR(40) UNIQUE NOT NULL
- `slug` VARCHAR(60) UNIQUE NOT NULL
- `display_order` INT NOT NULL DEFAULT 0
- `is_active` BOOLEAN NOT NULL DEFAULT true
- `created_at` TIMESTAMP NOT NULL
- `updated_at` TIMESTAMP NOT NULL

### examples

- 몽환
- 청량
- 빈티지
- 러블리
- 새벽
- 필름
- 무심

---

## 3.4 user_interest_mood_tags

회원가입 시 선택하는 관심 무드 태그 연결 테이블.

### fields

- `id` UUID PK
- `user_id` UUID FK -> users.id
- `mood_tag_id` UUID FK -> mood_tags.id
- `created_at` TIMESTAMP NOT NULL

### constraints

- unique(user_id, mood_tag_id)

---

## 3.5 posts

일반 게시물과 찰나를 함께 관리하는 핵심 테이블.

### fields

- `id` UUID PK
- `user_id` UUID FK -> users.id
- `post_type` VARCHAR(20) NOT NULL
  - regular
  - chalna
- `caption` TEXT NULL
- `location_text` VARCHAR(120) NULL
- `visibility` VARCHAR(20) NOT NULL DEFAULT 'public'
  - public
  - followers_only
  - private
- `comment_enabled` BOOLEAN NOT NULL DEFAULT true
- `status` VARCHAR(20) NOT NULL DEFAULT 'active'
  - active
  - hidden
  - deleted
  - expired
- `expires_at` TIMESTAMP NULL
- `comments_count` INT NOT NULL DEFAULT 0
- `bookmarks_count` INT NOT NULL DEFAULT 0
- `reactions_count` INT NOT NULL DEFAULT 0
- `reaction_score_sum` INT NOT NULL DEFAULT 0
- `reaction_score_avg` DECIMAL(4,2) NOT NULL DEFAULT 0.00
- `top_reaction_label` VARCHAR(20) NULL
  - 슬쩍 / 콕 / 꾹 / 폭닥 / 젤리
- `created_at` TIMESTAMP NOT NULL
- `updated_at` TIMESTAMP NOT NULL
- `deleted_at` TIMESTAMP NULL

### notes

- 찰나는 `post_type='chalna'` 이고 `expires_at` 필수
- 평균 감도는 저장형 캐시 컬럼으로 관리 권장
- 대표 반응은 평균 구간으로 계산한 라벨을 캐싱

### indexes

- index(user_id, created_at desc)
- index(post_type, created_at desc)
- index(status, created_at desc)
- index(expires_at)
- index(reaction_score_avg desc)

---

## 3.6 post_images

게시물 이미지.

### fields

- `id` UUID PK
- `post_id` UUID FK -> posts.id
- `image_url` TEXT NOT NULL
- `width` INT NULL
- `height` INT NULL
- `sort_order` INT NOT NULL DEFAULT 0
- `created_at` TIMESTAMP NOT NULL

### constraints

- regular: 1~4장
- chalna: 1장만 허용

---

## 3.7 post_mood_tags

게시물과 무드 태그 연결.

### fields

- `id` UUID PK
- `post_id` UUID FK -> posts.id
- `mood_tag_id` UUID FK -> mood_tags.id
- `created_at` TIMESTAMP NOT NULL

### constraints

- unique(post_id, mood_tag_id)

---

## 3.8 paw_reactions

여운 반응 테이블.

### meaning

- 1 = 슬쩍
- 2 = 콕
- 3 = 꾹
- 4 = 폭닥
- 5 = 젤리

### fields

- `id` UUID PK
- `post_id` UUID FK -> posts.id
- `user_id` UUID FK -> users.id
- `score` SMALLINT NOT NULL
- `created_at` TIMESTAMP NOT NULL
- `updated_at` TIMESTAMP NOT NULL

### constraints

- unique(post_id, user_id)
- score in (1,2,3,4,5)

### notes

반응 변경 허용 시 같은 row update.
반응 생성/변경 시 posts 집계 컬럼 재계산 필요.

---

## 3.9 comments

댓글 및 대댓글.

### fields

- `id` UUID PK
- `post_id` UUID FK -> posts.id
- `user_id` UUID FK -> users.id
- `parent_comment_id` UUID NULL FK -> comments.id
- `content` VARCHAR(500) NOT NULL
- `status` VARCHAR(20) NOT NULL DEFAULT 'active'
  - active
  - hidden
  - deleted
- `created_at` TIMESTAMP NOT NULL
- `updated_at` TIMESTAMP NOT NULL
- `deleted_at` TIMESTAMP NULL

### indexes

- index(post_id, created_at asc)
- index(parent_comment_id)
- index(user_id)

---

## 3.10 bookmarks

저장(보관함).

### fields

- `id` UUID PK
- `user_id` UUID FK -> users.id
- `post_id` UUID FK -> posts.id
- `created_at` TIMESTAMP NOT NULL

### constraints

- unique(user_id, post_id)

---

## 3.11 follows

팔로우 관계.

### fields

- `id` UUID PK
- `follower_user_id` UUID FK -> users.id
- `followee_user_id` UUID FK -> users.id
- `status` VARCHAR(20) NOT NULL DEFAULT 'accepted'
  - pending
  - accepted
- `created_at` TIMESTAMP NOT NULL
- `updated_at` TIMESTAMP NOT NULL

### constraints

- unique(follower_user_id, followee_user_id)
- follower_user_id != followee_user_id

### notes

비공개 계정이면 pending 사용
공개 계정이면 accepted 즉시 처리

---

## 3.12 blocks

차단 관계.

### fields

- `id` UUID PK
- `blocker_user_id` UUID FK -> users.id
- `blocked_user_id` UUID FK -> users.id
- `created_at` TIMESTAMP NOT NULL

### constraints

- unique(blocker_user_id, blocked_user_id)

### effects

- 서로 피드/프로필/댓글/메시지 비노출
- 검색 결과 제외

---

## 3.13 conversations

DM 대화방 메타 정보.

### fields

- `id` UUID PK
- `conversation_type` VARCHAR(20) NOT NULL DEFAULT 'direct'
- `created_at` TIMESTAMP NOT NULL
- `updated_at` TIMESTAMP NOT NULL
- `last_message_at` TIMESTAMP NULL

---

## 3.14 conversation_members

대화 참여자.

### fields

- `id` UUID PK
- `conversation_id` UUID FK -> conversations.id
- `user_id` UUID FK -> users.id
- `last_read_message_id` UUID NULL
- `joined_at` TIMESTAMP NOT NULL

### constraints

- unique(conversation_id, user_id)

---

## 3.15 messages

DM 메시지.

### fields

- `id` UUID PK
- `conversation_id` UUID FK -> conversations.id
- `sender_user_id` UUID FK -> users.id
- `message_type` VARCHAR(20) NOT NULL DEFAULT 'text'
  - text
  - image
  - post_share
- `content` TEXT NULL
- `shared_post_id` UUID NULL FK -> posts.id
- `status` VARCHAR(20) NOT NULL DEFAULT 'sent'
- `created_at` TIMESTAMP NOT NULL
- `updated_at` TIMESTAMP NOT NULL
- `deleted_at` TIMESTAMP NULL

---

## 3.16 message_requests

메시지 요청함. 대화 시작 승인 흐름을 분리하고 싶을 때 사용.

### fields

- `id` UUID PK
- `from_user_id` UUID FK -> users.id
- `to_user_id` UUID FK -> users.id
- `initial_message` VARCHAR(300) NULL
- `status` VARCHAR(20) NOT NULL DEFAULT 'pending'
  - pending
  - accepted
  - rejected
  - expired
- `created_at` TIMESTAMP NOT NULL
- `updated_at` TIMESTAMP NOT NULL

### constraints

- unique(from_user_id, to_user_id, status) partial index 고려

---

## 3.17 notifications

인앱 알림.

### fields

- `id` UUID PK
- `user_id` UUID FK -> users.id
- `notification_type` VARCHAR(40) NOT NULL
  - post_reaction
  - post_comment
  - comment_reply
  - follow
  - message_request
  - message_received
  - chalna_reaction
  - chalna_view(optional)
- `actor_user_id` UUID NULL FK -> users.id
- `post_id` UUID NULL FK -> posts.id
- `comment_id` UUID NULL FK -> comments.id
- `conversation_id` UUID NULL FK -> conversations.id
- `title` VARCHAR(120) NOT NULL
- `body` VARCHAR(300) NOT NULL
- `is_read` BOOLEAN NOT NULL DEFAULT false
- `created_at` TIMESTAMP NOT NULL

### indexes

- index(user_id, is_read, created_at desc)

---

## 3.18 notification_settings

알림 설정.

### fields

- `id` UUID PK
- `user_id` UUID UNIQUE FK -> users.id
- `push_post_reaction` BOOLEAN NOT NULL DEFAULT true
- `push_post_comment` BOOLEAN NOT NULL DEFAULT true
- `push_comment_reply` BOOLEAN NOT NULL DEFAULT true
- `push_follow` BOOLEAN NOT NULL DEFAULT true
- `push_message_request` BOOLEAN NOT NULL DEFAULT true
- `push_message_received` BOOLEAN NOT NULL DEFAULT true
- `push_chalna_reaction` BOOLEAN NOT NULL DEFAULT true
- `created_at` TIMESTAMP NOT NULL
- `updated_at` TIMESTAMP NOT NULL

---

## 3.19 device_tokens

푸시 발송용 디바이스 토큰.

### fields

- `id` UUID PK
- `user_id` UUID FK -> users.id
- `platform` VARCHAR(20) NOT NULL
  - ios
  - android
- `device_token` TEXT NOT NULL
- `is_active` BOOLEAN NOT NULL DEFAULT true
- `created_at` TIMESTAMP NOT NULL
- `updated_at` TIMESTAMP NOT NULL

---

## 3.20 reports

신고.

### fields

- `id` UUID PK
- `reporter_user_id` UUID FK -> users.id
- `target_type` VARCHAR(20) NOT NULL
  - post
  - comment
  - user
  - message
- `target_id` UUID NOT NULL
- `reason_code` VARCHAR(30) NOT NULL
  - abuse
  - harassment
  - sexual
  - appearance_shaming
  - spam
  - impersonation
  - copyright
  - underage
  - other
- `detail_text` VARCHAR(500) NULL
- `status` VARCHAR(20) NOT NULL DEFAULT 'submitted'
  - submitted
  - reviewing
  - resolved
  - dismissed
- `created_at` TIMESTAMP NOT NULL
- `updated_at` TIMESTAMP NOT NULL

---

## 3.21 search_histories

최근 검색어.

### fields

- `id` UUID PK
- `user_id` UUID FK -> users.id
- `keyword` VARCHAR(100) NOT NULL
- `created_at` TIMESTAMP NOT NULL

---

## 3.22 admin_action_logs

운영자 조치 로그.

### fields

- `id` UUID PK
- `admin_user_id` UUID FK -> users.id
- `action_type` VARCHAR(50) NOT NULL
- `target_type` VARCHAR(20) NOT NULL
- `target_id` UUID NOT NULL
- `note` VARCHAR(500) NULL
- `created_at` TIMESTAMP NOT NULL

---

# 4. 관계 요약

## 4.1 관계 다이어그램 개념

- User 1 : 1 UserProfile
- User 1 : N Post
- Post 1 : N PostImage
- Post N : N MoodTag
- Post 1 : N PawReaction
- Post 1 : N Comment
- User 1 : N PawReaction
- User N : N User (Follow)
- User N : N User (Block)
- User N : N Conversation (through ConversationMember)
- Conversation 1 : N Message
- User 1 : N Notification
- User 1 : N Bookmark

---

# 5. 캐시 / 집계 전략

## 5.1 posts 집계 컬럼

피드 성능을 위해 posts 에 다음 캐시 컬럼 유지 권장.

- `comments_count`
- `bookmarks_count`
- `reactions_count`
- `reaction_score_sum`
- `reaction_score_avg`
- `top_reaction_label`

## 5.2 reaction 대표 라벨 계산 규칙

- 4.50 ~ 5.00 => 젤리
- 4.00 ~ 4.49 => 폭닥
- 3.00 ~ 3.99 => 꾹
- 2.00 ~ 2.99 => 콕
- 1.00 ~ 1.99 => 슬쩍

## 5.3 user_profiles 캐시 컬럼

프로필 성능을 위해 아래 수치 캐시 고려.

- `posts_count`
- `followers_count`
- `following_count`
- `received_reactions_count`
- `average_paw_score`

---

# 6. 인증 / 권한 정책

## 6.1 인증

- Access Token: 짧은 만료 시간
- Refresh Token: 재발급용
- 인증 방식: Bearer Token

## 6.2 권한 기본 규칙

### 게시물 조회

- public: 누구나
- followers_only: 팔로워만
- private: 작성자만

### 댓글 작성

- 작성자 계정의 comment_permission 정책 따름

### DM 시작

- 상대의 message_permission 정책 따름
- 차단 관계면 불가
- 비공개/요청제면 message_request 생성

### 찰나 조회

- 공개 범위와 동일하되 만료 후 조회 불가

---

# 7. API 설계 원칙

## 7.1 공통 원칙

- REST 스타일 우선
- 응답 구조 통일
- 페이지네이션 기본 제공
- 클라이언트 친화적인 DTO 응답
- 서버에서 대표 반응 라벨과 평균 감도 계산 결과를 함께 반환

## 7.2 공통 응답 예시

```json
{
  "success": true,
  "data": {},
  "meta": {
    "request_id": "..."
  }
}
```

에러 예시:

```json
{
  "success": false,
  "error": {
    "code": "POST_NOT_FOUND",
    "message": "게시물을 찾을 수 없습니다."
  }
}
```

---

# 8. API 상세 명세

## 8.1 Auth API

### POST /api/v1/auth/signup

회원가입

#### request

```json
{
  "email": "user@example.com",
  "password": "password123!",
  "nickname": "말랑구름",
  "bio": "사진보다 감도",
  "interest_mood_tag_ids": ["uuid1", "uuid2"]
}
```

### POST /api/v1/auth/login

로그인

### POST /api/v1/auth/social-login

소셜 로그인

### POST /api/v1/auth/refresh

토큰 재발급

### POST /api/v1/auth/logout

로그아웃

---

## 8.2 User / Profile API

### GET /api/v1/me

내 정보 조회

### PATCH /api/v1/me

내 프로필 수정

### GET /api/v1/users/{userId}

타 사용자 프로필 조회

### GET /api/v1/users/{userId}/posts

사용자 일반 게시물 목록

### GET /api/v1/users/{userId}/chalna/active

현재 활성 찰나 조회

### POST /api/v1/users/{userId}/follow

팔로우 요청/수행

### DELETE /api/v1/users/{userId}/follow

언팔로우

### POST /api/v1/users/{userId}/block

차단

### DELETE /api/v1/users/{userId}/block

차단 해제

---

## 8.3 Mood Tag API

### GET /api/v1/mood-tags

무드 태그 목록 조회

### GET /api/v1/mood-tags/{tagId}/posts

특정 무드 태그 게시물 목록

---

## 8.4 Post API

### POST /api/v1/posts

일반 게시물 생성

#### request

```json
{
  "post_type": "regular",
  "caption": "오늘 날씨랑 잘 맞는 색감",
  "location_text": "성수",
  "visibility": "public",
  "comment_enabled": true,
  "mood_tag_ids": ["uuid1", "uuid2"],
  "images": [
    { "image_url": "https://.../1.jpg", "sort_order": 0 },
    { "image_url": "https://.../2.jpg", "sort_order": 1 }
  ]
}
```

### POST /api/v1/chalna

찰나 생성

#### request

```json
{
  "post_type": "chalna",
  "caption": "지금 공기 너무 좋다",
  "visibility": "public",
  "mood_tag_ids": ["uuid1"],
  "expires_in_hours": 24,
  "images": [{ "image_url": "https://.../1.jpg", "sort_order": 0 }]
}
```

### GET /api/v1/posts/{postId}

게시물 상세 조회

### PATCH /api/v1/posts/{postId}

게시물 수정

### DELETE /api/v1/posts/{postId}

게시물 삭제

### GET /api/v1/feed/home

홈 피드 조회

query params 예시:

- `tab=recommended|latest|following`
- `cursor=...`
- `limit=20`

### GET /api/v1/feed/chalna

홈 상단 찰나 목록 조회

### GET /api/v1/explore

산책 화면 조회

query params 예시:

- `sort=popular|latest`
- `mood_tag_id=...`
- `cursor=...`

### GET /api/v1/search

검색

query params 예시:

- `q=몽환`
- `type=all|users|posts|tags`

---

## 8.5 Paw Reaction API

### POST /api/v1/posts/{postId}/reactions

여운 생성/변경

#### request

```json
{
  "score": 5
}
```

#### response example

```json
{
  "success": true,
  "data": {
    "my_reaction": 5,
    "reaction_summary": {
      "average_score": 4.72,
      "top_label": "젤리",
      "reactions_count": 128
    }
  }
}
```

### DELETE /api/v1/posts/{postId}/reactions

내 여운 제거

정책 선택 필요:

- 제거 허용
- 또는 변경만 허용

MVP 추천:

- 제거보다 변경 중심

---

## 8.6 Comment API

### GET /api/v1/posts/{postId}/comments

댓글 목록

### POST /api/v1/posts/{postId}/comments

댓글 작성

#### request

```json
{
  "content": "색감 너무 좋다",
  "parent_comment_id": null
}
```

### PATCH /api/v1/comments/{commentId}

댓글 수정

### DELETE /api/v1/comments/{commentId}

댓글 삭제

---

## 8.7 Bookmark API

### POST /api/v1/posts/{postId}/bookmark

저장

### DELETE /api/v1/posts/{postId}/bookmark

저장 취소

### GET /api/v1/me/bookmarks

보관함 조회

---

## 8.8 DM API

### GET /api/v1/conversations

대화방 목록

### POST /api/v1/message-requests

메시지 요청 생성

#### request

```json
{
  "to_user_id": "uuid",
  "initial_message": "무드가 좋아서 쪽지 드려요"
}
```

### GET /api/v1/message-requests

메시지 요청 목록

### POST /api/v1/message-requests/{requestId}/accept

요청 수락

### POST /api/v1/message-requests/{requestId}/reject

요청 거절

### GET /api/v1/conversations/{conversationId}/messages

메시지 목록

### POST /api/v1/conversations/{conversationId}/messages

메시지 전송

#### request

```json
{
  "message_type": "text",
  "content": "사진 무드 너무 좋았어요"
}
```

---

## 8.9 Notification API

### GET /api/v1/notifications

알림 목록 조회

### POST /api/v1/notifications/{notificationId}/read

알림 1건 읽음 처리

### POST /api/v1/notifications/read-all

전체 읽음 처리

### GET /api/v1/me/notification-settings

알림 설정 조회

### PATCH /api/v1/me/notification-settings

알림 설정 수정

### POST /api/v1/me/device-tokens

디바이스 토큰 등록

---

## 8.10 Report API

### POST /api/v1/reports

신고 생성

#### request

```json
{
  "target_type": "post",
  "target_id": "uuid",
  "reason_code": "appearance_shaming",
  "detail_text": "외모 비하 댓글이 이어지고 있습니다"
}
```

---

# 9. 피드 응답 DTO 권장 구조

## 9.1 Home Feed Item

```json
{
  "post_id": "uuid",
  "post_type": "regular",
  "author": {
    "user_id": "uuid",
    "nickname": "말랑구름",
    "profile_image_url": "https://...",
    "representative_mood_tag": {
      "id": "uuid",
      "name": "몽환"
    }
  },
  "images": [
    {
      "image_url": "https://...",
      "width": 1080,
      "height": 1350
    }
  ],
  "caption": "노을빛이 너무 예뻐서 올려봐요",
  "mood_tags": [
    { "id": "uuid1", "name": "몽환" },
    { "id": "uuid2", "name": "새벽" }
  ],
  "reaction_summary": {
    "average_score": 4.72,
    "top_label": "젤리",
    "reactions_count": 128,
    "my_score": 4
  },
  "comments_count": 12,
  "bookmarked": true,
  "created_at": "2026-04-15T12:30:00Z"
}
```

## 9.2 Chalna Item

```json
{
  "post_id": "uuid",
  "post_type": "chalna",
  "author": {
    "user_id": "uuid",
    "nickname": "말랑구름",
    "profile_image_url": "https://..."
  },
  "thumbnail_image_url": "https://...",
  "expires_at": "2026-04-16T03:00:00Z",
  "remaining_seconds": 18000,
  "has_unread": true
}
```

---

# 10. 서비스 로직 상세

## 10.1 여운 반응 처리 로직

1. 사용자가 게시물에 score(1~5) 전송
2. 기존 반응 존재 여부 확인
3. 없으면 insert, 있으면 update
4. posts.reactions_count / reaction_score_sum / reaction_score_avg 갱신
5. 평균 구간에 맞춰 top_reaction_label 갱신
6. 게시물 작성자에게 알림 생성
7. 푸시 허용 시 푸시 발송

## 10.2 평균 감도 라벨 계산 함수

```text
if avg >= 4.50 => 젤리
else if avg >= 4.00 => 폭닥
else if avg >= 3.00 => 꾹
else if avg >= 2.00 => 콕
else => 슬쩍
```

## 10.3 찰나 만료 처리

- 찰나는 생성 시 `expires_at = created_at + 12h 또는 24h`
- 조회 API에서 `status='active' AND expires_at > now()` 조건 사용
- 배치 작업으로 만료 건 status='expired' 처리
- 만료 후 상세 조회 불가 또는 만료 안내 반환

## 10.4 DM 시작 정책

권장 기본값:

- `message_permission = following_only`
- 서로 차단 관계 아니어야 함
- 조건 미충족 시 message_request 생성

---

# 11. 알림 이벤트 정의

## 11.1 인앱 + 푸시 공통 이벤트

- 게시물에 여운 반응
- 게시물 댓글
- 대댓글
- 팔로우
- 메시지 요청
- 메시지 수신
- 찰나 반응

## 11.2 푸시 메시지 예시

- 누군가 젤리까지 찍고 갔어요
- 새 댓글이 도착했어요
- 찰나에 반응이 남겨졌어요
- 새 편지가 도착했어요

## 11.3 알림 중복 방지

권장:

- 같은 actor, 같은 target, 짧은 시간 내 다수 발생 시 묶기
  예: “5명이 젤리까지 찍고 갔어요”

---

# 12. 검색 / 산책 추천 로직 초안

## 12.1 검색 대상

- 사용자 닉네임
- 무드 태그
- 게시물 caption

## 12.2 산책 정렬 기준

- 인기순: 최근 반응 수, 평균 감도, 저장 수 혼합
- 최신순: 생성일
- 태그 기반: 선택 태그와 매칭

## 12.3 추천 피드 초안

MVP는 단순하게 시작.

- 내가 선택한 관심 무드 태그와 일치
- 내가 저장한 게시물 태그와 유사
- 내가 자주 반응한 작성자와 유사 사용자
- 팔로우 중인 유저와 비슷한 태그 성향

---

# 13. 관리자 API / 운영 기능 초안

## 13.1 Admin Reports

- GET /api/v1/admin/reports
- PATCH /api/v1/admin/reports/{reportId}

## 13.2 Admin Posts

- GET /api/v1/admin/posts
- PATCH /api/v1/admin/posts/{postId}/hide
- PATCH /api/v1/admin/posts/{postId}/restore

## 13.3 Admin Users

- GET /api/v1/admin/users
- PATCH /api/v1/admin/users/{userId}/suspend
- PATCH /api/v1/admin/users/{userId}/activate

## 13.4 Admin Tags

- GET /api/v1/admin/mood-tags
- POST /api/v1/admin/mood-tags
- PATCH /api/v1/admin/mood-tags/{tagId}

---

# 14. 상태값(enum) 권장 정리

## 14.1 user.status

- active
- suspended
- deleted

## 14.2 post.post_type

- regular
- chalna

## 14.3 post.status

- active
- hidden
- deleted
- expired

## 14.4 follow.status

- pending
- accepted

## 14.5 report.status

- submitted
- reviewing
- resolved
- dismissed

## 14.6 notification.notification_type

- post_reaction
- post_comment
- comment_reply
- follow
- message_request
- message_received
- chalna_reaction

---

# 15. 보안 / 정책 고려사항

## 15.1 필수 보안

- 이미지 업로드 mime type 검증
- JWT 서명/만료 검증
- rate limiting
- 댓글/DM 욕설 필터
- 신고 누적 자동 숨김 임계치 고려

## 15.2 개인 정보

- 이메일 등 민감 정보는 프로필 응답에 노출 금지
- DM 내용은 참여자만 접근
- 차단 관계 반영 필수

## 15.3 외모 평가 앱 오인 방지

- API 자체는 중립적이나, 운영 정책상 외모 비하 신고 코드와 moderation 흐름을 반드시 둔다
- 반응 값은 점수지만 UI 텍스트는 반응형 카피로 처리

---

# 16. 성능 고려사항

## 16.1 피드 성능

- posts 캐시 컬럼 적극 사용
- 이미지 썸네일 별도 생성
- cursor pagination 사용 권장

## 16.2 댓글 성능

- 초기에는 offset 가능
- 댓글 많은 게시물은 cursor 전환 고려

## 16.3 알림 성능

- 최신 알림 우선 조회
- 오래된 read 알림은 아카이브/삭제 정책 고려

---

# 17. MVP 범위 권장

## 17.1 MVP 포함

- 회원가입 / 로그인
- 프로필
- 일반 게시물
- 찰나
- 여운 반응
- 평균 감도 계산
- 홈 피드
- 산책
- 댓글
- 저장
- 팔로우
- DM + 메시지 요청
- 인앱 알림
- 푸시 알림
- 신고 / 차단

## 17.2 MVP 제외 가능

- 그룹 채팅
- 댓글 좋아요
- AI 무드 분석
- 고급 추천 랭킹
- 찰나 커스텀 프레임
- 고급 통계 리포트

---

# 18. Codex 작업 지시용 요약

## 목표

여운 앱 MVP 백엔드/프론트 구현을 위해 위 스키마와 API를 기준으로 실제 코드베이스 구조를 설계한다.

## Codex에게 요구할 것

1. Prisma schema 또는 SQL schema 생성
2. REST API route/controller/service 구조 설계
3. 인증 미들웨어 구현
4. posts / reactions / comments / bookmarks / follows / conversations / notifications 도메인 구현
5. 찰나 만료 처리용 cron/job 설계
6. 공통 DTO / validation / error code 체계 설계
7. 관리자용 최소 moderation API 포함

## 구현 시 주의

- 일반 게시물과 찰나는 분리 테이블이 아니라 posts 테이블 하나에서 관리하는 방향 우선
- 반응 평균/대표 라벨은 서버 계산 결과를 응답에 포함
- 홈 피드/산책 응답은 모바일 UI가 바로 쓰기 쉬운 카드 DTO 형태로 제공
- 차단/비공개/권한 정책을 모든 조회 API에 일관되게 반영
- 알림과 푸시는 분리하되 이벤트 소스는 동일하게 설계
