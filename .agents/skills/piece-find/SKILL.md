---
name: piece-find
description: >-
  Implements the 산책-tab "조각찾기" fashion A/B taste mode: two fashion posts,
  여운 reaction on one side auto-advances, optional paid 편지 only before
  reacting, server-side exclusions and pair diversity. Use when implementing
  piece-find, taste fragments, 조각찾기, 산책 two-up choice, or related API/UI.
version: 1.0.0
user-invocable: true
argument-hint: "[scope e.g. api | mobile | full-stack]"
---

# piece-find (조각찾기) 구현 스킬

## When to use

- 산책 탭에 **조각찾기** 진입점·세션 화면을 **코드로** 추가할 때.
- **다음 쌍 API**, 제외 로직, 유료 편지(반응 전만), 반응 소스 구분을 구현할 때.
- 기존 **여운(발바닥)** 컴포넌트·반응 API와 연동할 때.

## Before coding

1. UI 품질·금지 패턴은 **`/impeccable`**(또는 프로젝트의 design skills)과 정렬. 프로젝트 루트에 **`.impeccable.md`의 Design Context**가 있으면 그 톤·색·타이포를 우선한다.
2. 상세 제품 규칙·엣지 케이스는 **[reference.md](reference.md)** 를 연다.

## Non-negotiables (reject weak clones)

- **한 번에 두 장**, **한쪽 여운 = 즉시 다음 쌍**. “다음” 확인 버튼으로 느리게 만들지 말 것.
- **스와이프 낙하/하트/X/슈퍼라이크/매칭 카피** 전면 금지.
- **편지는 여운 확정 전에만** 활성. 확정 후에는 비활성 + 짧은 이유(중복 설명 없이).
- 이미 반응한 포스트·편지 보낸 포스트·차단·신고·본인·비패션 포스트는 **서버에서** 후보에서 제거.

## Implementation order (권장)

1. **데이터 모델·쿼리**: 반응에 `source` 필드(또는 동등 구분), 조각찾기 편지/페어 노출 로그, 소진 집합 조회를 가능하게 한다.
2. **GET next pair** (또는 동등 RPC): 제외 집합 적용 → 후보 2개 반환 + `sessionId`/`pairId` + 클라 표시용 메타만(과다 PII 금지).
3. **POST react**: `postId` + `pairId` + `reactionType`; 성공 시 **즉시** 다음 쌍 prefetch 가능. 네트워크 실패 시 **자동 전환 금지**, 동일 쌍 유지·재시도.
4. **Paid letter**: 반응 전 가드 하드체크; 결제 idempotency; 실패/환불 경로.
5. **Mobile 산책**: 상단·눈에 띄는 **모드 전환형 CTA**(피드 한 줄에 묻히지 않게).
6. **조각찾기 화면**: 탑바(뒤로·제목·⋯), 2-up 레이아웃, 카드별 여운 영역, 보조 **스킵(쌍 교체)**, 신고/차단 진입.
7. **카피·모션**: “조각 +1” 류 **수집 톤**; 모션은 가볍게(스탬프 찍힘 → 전환).

## UX copy defaults (한국어, 예시 — 제품 확정 시 교체)

- 진입 부제: *두 룩 중 더 끌리는 쪽에 여운을 남겨보세요.*
- 편지 잠금: *룩을 고른 뒤에는 편지를 보낼 수 없어요.*
- 풀 소진: *오늘 모을 조각이 여기까지예요.*

## Done checklist

- [ ] 반응 1탭으로 확정 + 성공 시에만 다음 쌍 전환.
- [ ] 편지는 반응 전에만 + 페이월이 숨지 않음.
- [ ] 서버 제외: 본인·차단·신고·기반응·편지 발송·비패션.
- [ ] 페어/작가/태그 다양성 최소 규칙 적용.
- [ ] 빈 풀·네트워크·결제 중단·편지 실패 상태 각각 처리.
- [ ] 데이팅 연상 UI/카피 자가 점검 통과.

## Further detail

- [reference.md](reference.md) — 제외 목록, 상태, 페어 정책, 개인화 시그널.
