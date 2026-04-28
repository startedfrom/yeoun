# 여운 배포 체크리스트 및 운영 가이드

본 문서는 여운 앱의 배포 전 점검해야 할 핵심 사용자 플로우, 백그라운드 작업(Cron/Job), 에러 로깅 방법, 그리고 EAS(Expo Application Services) 빌드 및 배포 과정을 정리한 문서입니다.

## 1. 핵심 사용자 플로우 (End-to-End Test)

앱 출시 및 주요 업데이트 전, 아래의 핵심 사용자 경험(UX)이 정상 작동하는지 확인해야 합니다.

### A. 인증 및 온보딩
- [ ] **회원가입**: 이메일 중복 확인, 비밀번호 검증, 닉네임 설정이 정상 동작하는가?
- [ ] **관심 무드 태그 선택**: 온보딩 단계에서 무드 태그를 1개 이상 선택 후 완료 버튼이 활성화되는가?
- [ ] **로그인/로그아웃**: 로그인 후 Secure Store에 토큰이 정상 저장되며, 로그아웃 시 토큰이 삭제되고 홈 화면으로 이동하는가?
- [ ] **자동 로그인(Token Refresh)**: 앱 재실행 시 Refresh Token을 이용해 로그인 상태가 유지되는가?

### B. 콘텐츠(게시물/찰나) 및 소셜 인터랙션
- [ ] **게시물 업로드**: 사진(최대 4장) 첨부, 캡션 작성(비속어 필터 적용 확인), 무드 태그 추가 후 정상 등록되는가?
- [ ] **찰나 업로드**: 1장의 사진, 12h/24h 만료 시간 설정 후 찰나 스트립에 노출되는가?
- [ ] **여운 반응**: 홈 피드에서 5단계 감도 반응 시, 중복 반영 없이 정상적으로 점수와 라벨이 업데이트되는가? (Optimistic UI 작동 여부)
- [ ] **댓글**: 게시물 상세에서 댓글을 남길 수 있으며, 비속어 필터가 동작하여 경고 모달이 노출되는가?

### C. 커뮤니티 및 안전 정책 (Moderation)
- [ ] **프로필 조회 및 권한**: 비공개 계정의 경우 팔로워가 아닌 유저가 게시물과 프로필 상세에 접근할 수 없는가?
- [ ] **신고 기능**: 홈 피드(FeedCard) 우측 상단 옵션 메뉴를 통해 게시물을 '외모 평가/비하', '욕설' 등의 사유로 신고할 수 있는가?
  - *참고: 카피는 항상 "외모 평가, 비하 등은 제재 대상입니다"로 명시하여 얼평 앱으로 변질되는 것을 방지합니다.*
- [ ] **차단 기능**: 특정 유저를 차단하면 피드 및 검색에서 해당 유저의 콘텐츠가 보이지 않는가?
- [ ] **DM 및 메시지 요청**: 상대방의 메시지 수신 권한(everyone, following_only 등)에 따라 즉시 대화방이 생성되거나 메시지 요청으로 전환되는가?

---

## 2. Cron & Background Jobs (백엔드)

여운 백엔드는 일정 주기로 처리해야 할 작업들이 존재합니다.

- [ ] **찰나(Chalna) 만료 처리**:
  - `expires_at`이 지난 찰나 게시물을 `expired` 또는 `hidden` 상태로 변경하는 Worker/Cron (매 5분 실행)
- [ ] **만료된 메시지 요청 삭제**:
  - 30일 이상 대기 중인 `pending` 상태의 메시지 요청을 삭제 혹은 `expired` 처리.
- [ ] **소프트 삭제된 데이터 영구 삭제(Hard Delete)**:
  - `deleted_at`이 찍힌 지 30일이 지난 User, Post, Comment 데이터를 삭제하는 배치 작업 (매일 자정 실행)

**구현 제안**:
Node.js 백엔드 내에서 `node-cron` 패키지를 활용하거나, 서버리스 환경이라면 Vercel Cron, AWS EventBridge 등을 이용해 API 엔드포인트(`/api/cron/jobs`)를 호출하도록 구성.

---

## 3. 에러 로깅 및 모니터링 (Error Logging)

운영 환경(Production)에서 발생하는 버그와 예외를 추적하기 위해 로깅 시스템이 필수입니다.

### 백엔드 (API 서버)
- [ ] **Sentry / Datadog**: Fastify의 `setErrorHandler`를 통해 예외 발생 시 (500번대 에러) Sentry로 자동 전송.
- [ ] **Pino 로거**: Fastify 기본 로거인 pino를 활성화(logger: true)하여 콘솔에 남기고, PM2나 CloudWatch를 통해 영구 저장.

### 프론트엔드 (Mobile App)
- [ ] **Sentry for React Native** (`@sentry/react-native`): 네이티브 크래시(Native Crash) 및 자바스크립트 에러 발생 시 로그 수집.
- [ ] **ErrorBoundary**: React 트리 최상단에 ErrorBoundary를 두어, 컴포넌트 렌더링 실패 시 흰 화면이 아닌 '에러 안내 페이지'를 표시하고 로그를 전송.

---

## 4. EAS 빌드 및 배포 체크리스트 (React Native + Expo)

Expo Application Services(EAS)를 통해 iOS와 Android 앱을 빌드하고 배포합니다.

### A. 환경 설정 및 초기화
- [ ] `eas.json` 프로필 설정 (`development`, `preview`, `production`)
- [ ] 환경변수(Env) 등록: EAS 대시보드(Secrets)에 `EXPO_PUBLIC_API_BASE_URL` 등(루트 `env.example` 참고) 운영 API 베이스 URL 등록 여부 확인.
- [ ] `app.json` 점검: `version`, `ios.buildNumber`, `android.versionCode` 증가.

### B. 빌드 (Build)
- [ ] **Test/Preview 빌드**: QA 테스터에게 배포할 내부용 빌드
  ```bash
  eas build --profile preview --platform all
  ```
- [ ] **Production 빌드**: 스토어 제출용 빌드
  ```bash
  eas build --profile production --platform all
  ```

### C. 제출 (Submit)
- [ ] App Store Connect (iOS) / Google Play Console (Android) 계정 및 인증서 연결 확인
- [ ] 스토어 자동 제출
  ```bash
  eas submit -p all --latest
  ```

### D. OTA 업데이트 (EAS Update)
네이티브 코드 변경이 없는 UI, 비즈니스 로직 수정 시 심사 없이 업데이트 배포.
- [ ] 업데이트 채널 설정 확인
- [ ] 배포 명령어:
  ```bash
  eas update --branch production --message "신고 모달 카피 수정 및 버그 픽스"
  ```

---

## 요약
이번 MVP에서는 **사용자 보호 및 커뮤니티 정화(신고, 필터, 차단)** 기능이 모두 적용되었습니다. 외모 평가/비하 앱으로 인식되지 않도록 UI 카피를 방어적으로 작성하였으며, Fastify에 **Rate Limiting**을 적용하여 악의적인 API 호출을 방지하도록 설정하였습니다. 이 문서를 기준으로 다음 QA 세션을 진행하시기 바랍니다.
