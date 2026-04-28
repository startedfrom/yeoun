# 여운 (gamdojang) 모노레포

pnpm 워크스페이스 기반 모바일·API·관리자 앱과 공유 패키지를 한 저장소에서 관리합니다.

## 구성

| 경로 | 패키지 | 설명 |
|------|--------|------|
| `apps/api` | `@gamdojang/api` | Fastify API, Prisma, PostgreSQL |
| `apps/mobile` | `@gamdojang/mobile` | Expo(React Native) 앱 |
| `apps/admin` | `@gamdojang/admin` | Vite + React 관리자 UI |
| `packages/domain` | `@gamdojang/domain` | 도메인 공유 코드 |
| `packages/ui` | `@gamdojang/ui` | UI 공유 컴포넌트 |
| `packages/config` | `@gamdojang/config` | 공통 설정 |

## 사전 요구 사항

- Node.js (프로젝트는 TypeScript 5.9, `@types/node` 25 기준으로 개발됨)
- [Corepack](https://nodejs.org/api/corepack.html)으로 pnpm 사용: 저장소는 `packageManager` 필드로 **pnpm 10.11.1**을 고정함

## 설치

저장소 루트에서:

```bash
corepack enable
pnpm install
```

루트 `package.json`의 `scripts`는 `pnpm`으로 워크스페이스 필터를 호출합니다. 저장소 루트에서 `pnpm <script>`로 실행하면 됩니다.

## 환경 변수

로컬 예시는 `env.example`을 복사해 `.env` 등으로 맞추면 됨. API 포트, DB URL, 모바일의 `EXPO_PUBLIC_API_BASE_URL` 등이 정리되어 있음.

## 자주 쓰는 스크립트 (루트)

| 명령 | 설명 |
|------|------|
| `pnpm dev` | API + 모바일 동시 개발 |
| `pnpm dev:api` | API만 |
| `pnpm dev:mobile` | 모바일만 |
| `pnpm dev:admin` | 관리자만 |
| `pnpm dev:admin-console` | API + 관리자 (포트 4000·5173 정리 스크립트 포함) |
| `pnpm lint` | 워크스페이스 전체 lint |
| `pnpm typecheck` | 워크스페이스 전체 타입 검사 |
| `pnpm test` | 워크스페이스 전체 테스트 |
| `pnpm build` | 워크스페이스 전체 빌드 |
| `pnpm check` | lint → test → typecheck → build 순 검증 |
| `pnpm format` | Prettier로 전체 포맷 |
| `pnpm format:check` | Prettier 검사만 |
| `pnpm free:api4000` | 로컬 4000 포트 점유 프로세스 정리 (`scripts/free-api-port.sh`) |
| `pnpm free:5173` | 로컬 5173 포트 점유 프로세스 정리 |

개별 앱에서만 실행하려면 `pnpm --filter @gamdojang/api dev` 형태로 필터 사용.

## 문서

- [docs/README.md](docs/README.md): 운영·기획·규약 문서 목차
- [docs/conventions.md](docs/conventions.md): API prefix, enum, 용어 등 공통 기준
- [docs/ADMIN_RUNTIME.md](docs/ADMIN_RUNTIME.md): Admin 콘솔 로컬 실행, Prisma, RBAC, 포트 정리
- [docs/deploy_checklist.md](docs/deploy_checklist.md): 배포 전 체크리스트
- 루트의 `gamdojang_*.md`: IA, DB/API, 디자인 시스템, Codex용 프롬프트 등 참고 자료

## 에이전트 스킬

Cursor/Claude용 작업 가이드는 `.agents/skills/` 아래 SKILL 문서를 참고하면 됨.
