# 여운 웹 운영 콘솔 — Office Hours · Autoplan · 구현 요약

날짜: 2026-04-17  
저장소: gamdojang (모노레포)

**최신 런타임·RBAC·로컬 포트**: 구현 상태가 바뀌면 [ADMIN_RUNTIME.md](./ADMIN_RUNTIME.md)를 우선한다(시드 계정, `moderator`, `free:5173` 등).

---

## 1. /office-hours (압축 실행)

**모드:** 사내 운영(intrapreneurship) — “신고·조각찾기·유료 편지·패션 적합” 큐를 실제 사람이 매일 비우는 도구.

**수요 증거(사용자가 준 컨텍스트):**  
운영자가 없으면 조각찾기 품질·유료 편지 검열·신고 SLA·해시 슬롯(오늘의/급상승/마이너)이 무너진다. 이건 가설이 아니라 제품 스펙으로 박혀 있음.

**현 상태(레포 기준):**  
`UserRole.admin`, `AdminActionLog`, `POST /admin/actions` 정도만 있었고, 읽기 전용 운영 API와 데스크톱 UI가 없었다.

**가장 좁은 쐐기:**  
“읽기 많이 · 쓰기는 확인 후” 테이블 콘솔 + 조각찾기 후보 게이트를 DB 한 컬럼으로 막을 수 있게 하는 것.

**관찰(깨달음):**  
소비자 앱의 귀여움은 운영 콘솔에 독이다. 밀도·필터·감사 추적이 우선.

### 전제(승인)

1. 운영자는 `role=admin` JWT로만 접근한다(MVP). 세분 RBAC는 UI에 `permissions[]`만 깔아두고, 서버는 여전히 admin 단일 게이트.
2. “조각찾기에서 빼기”는 **전역** 제외 플래그(`Post.pieceFindGloballyExcluded`)로 구현한다. 기존 `PieceFindPostExclusion`은 유저별 스킵용이라 운영 요구와 다름.
3. “패션만”은 **후보 풀 게이트**로 먼저 녹인다(`Post.fashionEligible`). 피드까지 강제 숨김은 이번 범위 밖.
4. 해시 버킷(오늘의/급상승/마이너)은 `MoodTag.editorialSlot` 문자열로 매핑한다. 별도 테이블 없이 운영 속도 우선.

---

## 2. /autoplan (자동 판정 요약)

**CEO:** 범위는 “운영 MVP”에 맞췄다. 결제 장부·자동 모더레이션 ML·고객 지원 티켓은 다음 호수.

**Design:** 데스크톱 밀도, 사이드 패널(게시물 플래그), 빈/로딩/403 상태 명시.

**Eng:** Fastify에 읽기 라우트 다발 + 기존 트랜잭션 액션 확장. Prisma relation `PieceFindPaidLetter.messageRequest` 추가로 운영자가 편지 본문까지 읽게 함. `pickNewPieceFindPair` 등에 `pieceFindCatalogGate()` 삽입.

**DX:** `pnpm dev:admin` + Vite 프록시 `/api` → API. `CORS_ORIGIN` 쉼표 목록.

**지연(TODOS):**  
세분 역할(모더레이터 뷰어), 신고에서 원클릭 “대상 게시물 숨김”, MessageRequest 수락/거절 admin API, 결제 영수증 테이블.

---

## 3. 구현된 것 (MVP)

| 영역 | 내용 |
|------|------|
| API | `GET /admin/me`, `dashboard`, `reports`, `posts`, `users`, `message-requests`, `piece-find/pairs`, `piece-find/paid-letters`, `mood-tags`, `audit-logs`; `POST /admin/actions` 확장; `PUT /admin/mood-tags/:id` |
| DB | `Post.pieceFindGloballyExcluded`, `Post.fashionEligible`, `MoodTag.editorialSlot`; `PieceFindPaidLetter` ↔ `MessageRequest` relation |
| 조각찾기 | `pieceFindCatalogGate()`로 전역 제외·패션 비적합 후보 제외 |
| 시드 | `ops@gamdojang.local` admin, 샘플 신고, 에디토리얼 슬롯 태그 3개 |
| 웹 | `apps/admin` Vite+React: 로그인, 대시보드, 신고, 게시물(+사이드 패널 플래그), 찰나, 사용자, 편지 요청, 무드 태그, 결제 스냅샷, 조각찾기, 감사 로그 |

루트 스크립트: `pnpm dev:admin`(관리자만) · API와 함께 띄울 때는 `pnpm dev:admin-console`([ADMIN_RUNTIME.md](./ADMIN_RUNTIME.md) 참고).

---

## 4. Decision Audit Trail (autoplan 스타일)

| # | 결정 | 원칙 |
|---|------|------|
| 1 | 전역 제외를 Post boolean으로 | 명시적, 쿼리 단순 |
| 2 | 패션 게이트를 조각찾기 풀에만 연결 | 소비자 피드 리스크 분리 |
| 3 | 무드 태그에 editorial slot 문자열 | 스키마 최소, 운영 속도 |
| 4 | admin UI는 Vite 단독 앱 | 모바일 앱과 배포 분리 |

---

## 5. GSTACK REVIEW REPORT (플레이스홀더)

| Review | Trigger | Runs | Status |
|--------|-----------|------|--------|
| CEO | `/plan-ceo-review` | 0 | 인라인 요약만 |
| Eng | `/plan-eng-review` | 0 | 인라인 요약만 |
| Design | `/plan-design-review` | 0 | 인라인 요약만 |

**VERDICT:** 자동 이중 음성(Codex+서브에이전트) 파이프라인은 이 환경에서 생략. 위 요약이 곧 승인 근거.
