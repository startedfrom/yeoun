import type { PawScore } from '@gamdojang/domain';

/**
 * 홈·피드·게시글·찰나 여운 — paw_step_1…5 (흰 배경 세트).
 * 왼쪽 1(슬쩍): 보라 → 2 하늘 → 3 핑크 → 4 폭닥(진보라) → 5 젤리.
 */
export const PAW_IMAGES: Record<PawScore, ReturnType<typeof require>> = {
  1: require('../../../assets/paw_step_1.png'),
  2: require('../../../assets/paw_step_2.png'),
  3: require('../../../assets/paw_step_3.png'),
  4: require('../../../assets/paw_step_4.png'),
  5: require('../../../assets/paw_step_5.png'),
};
