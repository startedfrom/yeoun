import type { PawScore } from '@gamdojang/domain';

/**
 * 해시카드 등급 일러스트 — paw_chatgpt_source_1…5 (에셋은 보내주신 순서·파일명 그대로).
 * 등급 N단계 → `CARD_PAW_IMAGES[N]`. 홈 `paw_step_*` 과 분리.
 */
export const CARD_PAW_IMAGES: Record<PawScore, ReturnType<typeof require>> = {
  1: require('../../../assets/paw_chatgpt_source_1.png'),
  2: require('../../../assets/paw_chatgpt_source_2.png'),
  3: require('../../../assets/paw_chatgpt_source_3.png'),
  4: require('../../../assets/paw_chatgpt_source_4.png'),
  5: require('../../../assets/paw_chatgpt_source_5.png'),
};
