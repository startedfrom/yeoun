# 여운 공통 기준

## 목적

- 이 문서는 여운 모노레포 전반에서 공통으로 유지해야 하는 용어, enum, API prefix, 응답 형식, 권한 규칙의 기준을 정리한다.
- 도메인 기능 구현 전에 프론트엔드와 백엔드가 같은 기준으로 작업하기 위한 문서다.

## 용어 기준

- 서비스명: `여운`
- 반응 시스템: `여운`
- 평균 점수 표기: `평균 감도`
- 프로필: `무드카드`
- 탐색: `산책`
- DM: `편지함`
- 휘발성 게시물: `찰나`
- 저장 목록: `보관함`

## 금지 용어

- `좋아요`
- `별점`
- `스토리`
- 사용자 노출 문구에서의 `DM`

## API prefix

- 기본 prefix: `/api/v1`
- 모바일 앱이 사용하는 기본 API base URL은 `EXPO_PUBLIC_API_BASE_URL`로 관리한다.
- 서버 라우트 등록 prefix는 `API_PREFIX` 환경변수로 관리한다.

## 공통 enum 기준

- `app_env`
  - `development`
  - `test`
  - `production`
- `post_type`
  - `regular`
  - `chalna`
- `post_visibility`
  - `public`
  - `followers_only`
  - `private`
- `user_status`
  - `active`
  - `suspended`
  - `deleted`
- `follow_status`
  - `pending`
  - `accepted`
- `report_status`
  - `submitted`
  - `reviewing`
  - `resolved`
  - `dismissed`
- `notification_type`
  - `post_reaction`
  - `post_comment`
  - `comment_reply`
  - `follow`
  - `message_request`
  - `message_received`
  - `chalna_reaction`

## 여운 반응 기준

- `1`: `슬쩍`
- `2`: `콕`
- `3`: `꾹`
- `4`: `폭닥`
- `5`: `젤리`

## 평균 감도 라벨 매핑

- `4.50 ~ 5.00`: `젤리`
- `4.00 ~ 4.49`: `폭닥`
- `3.00 ~ 3.99`: `꾹`
- `2.00 ~ 2.99`: `콕`
- `1.00 ~ 1.99`: `슬쩍`

## 성공 응답 형식

```json
{
  "success": true,
  "data": {},
  "meta": {
    "request_id": "..."
  }
}
```

## 에러 응답 형식

```json
{
  "success": false,
  "error": {
    "code": "POST_NOT_FOUND",
    "message": "게시물을 찾을 수 없습니다."
  }
}
```

## 에러 코드 기준

- `SNAKE_CASE` 사용
- 클라이언트가 분기할 수 있는 안정적인 문자열 사용
- 메시지는 사용자 친화적인 한국어 문장 사용

## 권한 규칙 기준

- 게시물 조회
  - `public`: 누구나 조회 가능
  - `followers_only`: 팔로워만 조회 가능
  - `private`: 작성자만 조회 가능
- 댓글 작성
  - 작성자 `comment_permission` 정책을 따른다.
- 편지함 시작
  - 상대 `message_permission` 정책을 따른다.
  - 차단 관계면 불가
  - 조건 미충족 시 요청 기반 흐름으로 전환
- 찰나 조회
  - 공개 범위 정책을 따르되 만료 후 조회 불가

## 환경변수 구조

- 루트 `env.example`을 기준 파일로 사용한다.
- 실제 로컬 실행은 루트 `.env` 또는 앱별 `.env`를 사용한다.
- `apps/api`는 `src/env.ts`에서 값을 로드하고 검증한다.
- `apps/mobile`은 `app.config.ts`에서 public env를 로드하고 `src/config/env.ts`에서 runtime 접근 기준을 유지한다.

## 실행 기준

- 전체 개발 실행(API+모바일): `corepack pnpm dev`
- 모바일 앱 실행: `corepack pnpm dev:mobile`
- 서버 실행: `corepack pnpm dev:api`
- 관리자만: `corepack pnpm dev:admin`
- API+관리자(로컬 콘솔): `corepack pnpm dev:admin-console`
- 전체 검증: `corepack pnpm check`
- 포맷: `corepack pnpm format` / `corepack pnpm format:check`
