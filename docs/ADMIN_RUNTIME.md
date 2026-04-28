# Admin 콘솔 · 로컬 실행 및 배포 메모

운영자가 실제로 맞닥뜨리는 설정만 짧게 정리합니다.

## Prisma 클라이언트

- **산출 경로**: `apps/api/src/generated/prisma` (`schema.prisma`의 `generator output`).
- **저장소**: 해당 디렉터리는 `.gitignore`에 포함. 클론 후 **`pnpm install`(또는 `apps/api`의 `postinstall`에서 `prisma generate`)** 으로 생성해야 `tsc`·런타임이 동작합니다.
- **시드**: `apps/api/prisma/seed.ts`는 generated 클라이언트를 import합니다. `pnpm --filter @gamdojang/api exec prisma db seed`.

## 로컬 개발 순서

1. PostgreSQL 가동, `DATABASE_URL` 설정(기본값: `postgresql://postgres:postgres@localhost:5432/gamdojang`).
2. `cd apps/api && pnpm exec prisma db push && pnpm exec prisma db seed`
3. **권장(한 번에)**: 저장소 루트에서 `pnpm run dev:admin-console` — **4000·5173 LISTEN 을 비운 뒤** API와 Admin을 **병렬로** 띄웁니다 (`EADDRINUSE` / `strictPort` 충돌 예방).
4. 수동 실행 시: API `cd apps/api && pnpm run dev` → `http://127.0.0.1:4000` · Admin `cd apps/admin && pnpm run dev` → **`http://127.0.0.1:5173` 고정** (`vite`: `host: 127.0.0.1` + `strictPort: true`). 5173 점유 시 Vite는 **즉시 실패** → `pnpm run free:5173` 후 재시작.
5. 포트만 비울 때: `pnpm run free:api4000` / `pnpm run free:5173` (둘 다 같은 `scripts/free-api-port.sh` 사용)
6. 시드 운영 계정:
   - `ops@gamdojang.local` / `0000` — **admin** (전체 권한)
   - `mod@gamdojang.local` / `0000` — **moderator** (조회·신고 처리·`reports:write`만; `posts:write` / `users:write` / `letters:write` / `hashtags:write` 없음)

## Admin API 환경 변수

| 변수 | 설명 |
|------|------|
| `ADMIN_RATE_LIMIT_MAX` | 관리자 라우트 전용 분당 요청 상한(숫자). 전역 100/min과 별도로 더 타이트하게 적용. |
| `ADMIN_IP_ALLOWLIST` | 쉼표로 IPv4/IPv6 목록. **비우면 비활성**(내부망·개발 편의). 설정 시 목록에 없는 클라이언트 IP는 **403**. |
| `TRUST_PROXY` | `1`이면 리버스 프록시 뒤에서 `X-Forwarded-For` 등을 반영해 IP 판별. allowlist 사용 시 배포에서 맞게 설정할 것. |
| `CORS_ORIGIN` | Admin Vite 출처 포함. **`http://127.0.0.1:5173`** 를 쓰면 API CORS에도 동일 출처를 넣어야 합니다(로컬 기본 env에 맞춰 조정). |

## 백엔드 권한(RBAC)

- JWT + `role` 이 **admin 또는 moderator** 인 계정만 `/admin/*` 진입(권한 집합은 역할별로 다름).
- 각 GET/PUT은 **`requireAdminPermission('<scope>:read|write')`** 로 스코프 검사.
- `GET /admin/posts` 만 예외로 **`posts:read` 또는 `chalna:read`** 중 하나면 목록 조회 가능(찰나 화면과 일반 게시물 화면 분리). 변경·숨김 등 `POST /admin/actions` 는 액션별로 `posts:write` 등 별도 스코프가 필요합니다.
- `POST /admin/actions`는 액션 종류별로 `posts:write`, `users:write`, `reports:write`, `letters:write` 등 **복수 스코프(AND)** 를 요구할 수 있음(예: 신고 번들로 게시물 숨김 → `reports:write` + `posts:write`).
- **`admin`**: `ADMIN_FULL_PERMISSIONS`. **`moderator`**: `MODERATOR_PERMISSIONS`(시드 `mod@gamdojang.local`). 그 외 역할은 `/admin/*` 403.
- `POST /admin/actions` 허용 조합·권한은 `apps/api/src/lib/admin-action-matrix.ts` 단일 매트릭스이며, `pnpm test`(api)로 키 완전성을 검사합니다.

## 신고 대상 `message` 타입

- `Message`와 `MessageRequest`는 스키마상 직접 연결되지 않음. 신고 대상이 메시지일 때 **편지 요청 상세로의 UUID 딥링크는 제공하지 않고**, 운영 뷰는 편지 목록(`/letters`) 수준으로 연결합니다.

## 배포 시 체크

- 빌드 단계에서 **`prisma generate`가 TypeScript 빌드보다 앞서** 실행되는지 CI에서 확인.
- 프로덕션에서 `ADMIN_IP_ALLOWLIST`를 켤 경우 **`TRUST_PROXY=1`** 과 프록시 헤더 설정이 일치하는지 반드시 검증.

## 런타임 복구 체크리스트 (짧게)

| 증상 | 할 일 |
|------|--------|
| API 터미널에 `EADDRINUSE` … **4000** | `pnpm run free:api4000` → API dev **한 개만** 다시 실행. |
| Vite가 **5173 strictPort** 로 바로 종료 | `pnpm run free:5173` → Admin dev 다시 실행. |
| 브라우저는 뜨는데 로그인/세션만 실패 | 터미널에서 `curl -sS http://127.0.0.1:4000/health` → 실패면 API 없음. `curl …5173/api/v1/health` 로 프록시 확인. |
| 하얀 화면·무응답 | F12 콘솔 확인. API/프록시 불일치면 **ErrorBoundary** 문구 또는 로그인 폼에 **한글 네트워크 에러**가 나와야 함. |

- Cursor **background shell**에 남은 `dev` 가 흔한 원인입니다.

## 흰 화면 / `EADDRINUSE` (로컬)

- Admin(Vite)은 `/api`를 **127.0.0.1:4000** 으로 프록시합니다. API가 안 떠 있으면 로그인·세션 확인이 실패합니다.
- 터미널에 **`Error: listen EADDRINUSE ... 4000`** 이면 **이미 다른 노드 프로세스가 4000을 쓰는 것**입니다. `pnpm run free:api4000` 후 API dev를 **한 개만** 다시 실행하세요.
- 여러 개의 API dev를 동시에 띄우지 마세요.

## API 연결 확인 (터미널)

- API 직접: `curl -sS http://127.0.0.1:4000/health`
- Admin이 떠 있을 때(프록시 경유): `curl -sS http://127.0.0.1:5173/api/v1/health` — 위와 같은 JSON이면 **프록시 → API** 정상. (Vite는 `127.0.0.1`에 바인딩.)

## RBAC 스모크 스크립트

- **실행**: API가 **이미 4000에서 떠 있는 상태**에서, `cd apps/api && pnpm run smoke:admin-rbac`
- **다른 베이스 URL**: `SMOKE_API_BASE=http://127.0.0.1:4000/api/v1 pnpm run smoke:admin-rbac`
- 스크립트는 시드된 **신고·게시물** 행이 있을 것을 가정합니다. 빈 DB면 실패합니다.

## 수동 브라우저 QA 체크리스트 (로컬, ~5–10분)

**전제**: `http://127.0.0.1:5173` + API 4000 정상(`curl …/health` 통과). 계정: `ops@gamdojang.local` / `0000`.

1. **로그인 페이지**: `/login` 열림, 폼 표시.
2. **로그인 성공**: 제출 후 `/` 로 이동·사이드바에 닉네임.
3. **대시보드**: 숫자 카드가 로드(에러 박스 없음).
4. **신고**: `/reports` 테이블·행에 운영 뷰/링크 표시.
5. **게시물**: `/posts` 목록·행 클릭 시 우측 패널·(가능하면) 플래그 버튼 동작.
6. **편지 요청**: `/letters` 목록·(pending 있으면) 수락/거절 버튼 노출 여부.
7. **결제·권한**: `/payments` 에 시드 주문·유료 편지 테이블 구역.
8. **무드 태그**: `/hashtags` 한 행 값 수정 후 **저장** → 새로고침 후 반영.
9. **감사 로그**: `/audit` 최근 행에 위 저장/조치 로그가 쌓이는지.
10. **모더레이션 한 번**: 신고 행에서 **검토** 또는 **해결** 등 한 액션 → 확인 후 감사 로그 확인.
11. **(선택) 권한 민감**: 시크릿 창에서 `mod@gamdojang.local` 로그인 → 편지 **수락** 버튼 없음·신고 **검토** 가능 등 기대와 맞는지.

**이 문서/CI 자동화로는 위 클릭 플로우를 대체하지 않습니다.** 터미널 대체 검증은 아래 `curl`·`smoke:admin-rbac` 뿐입니다.

## 브라우저 QA (자동화 한계)

- CI·에이전트는 **실제 브라우저 클릭 QA를 수행하지 않습니다.**
- 터미널: `curl`·`pnpm run smoke:admin-rbac`(API 직접)·위 **수동 체크리스트**.
- API 다운/JSON 오류 시 **ErrorBoundary·로그인 한글 메시지**로 완전 무응답을 줄였습니다.

## CI와 `smoke:admin-rbac`

- **현재 CI(`ci.yml`)에는 Postgres·시드가 없습니다.** 스모크는 로그인·DB 행을 가정하므로 **validate 잡에 넣지 않았습니다.**
- 넣으려면 최소한 `services: postgres` + `DATABASE_URL` + `db push` + `db seed` + 스모크 순이 필요합니다. **별도 workflow/job**으로 추가하는 편이 안전합니다.

## 모더레이터(`moderator`)와 consumer 로그인 (정책 미정)

- 현재 **동일 JWT**로 consumer 앱 로그인 API에도 붙을 수 있습니다. **콘솔 전용 계정**으로 둘지, consumer에서 `moderator` 를 막을지는 **제품 결정**이 필요합니다.
- 급한 임시 차단은 모바일/웹 UX·기존 시드 계정과 충돌할 수 있어 **이 문서에만 트레이드오프를 남기고**, 코드로 무리하게 막지 않았습니다.
