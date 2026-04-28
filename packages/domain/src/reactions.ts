import type { PawLabel, PawScore } from './models';

export const PAW_LABELS: Record<PawScore, PawLabel> = {
  1: '슬쩍',
  2: '콕',
  3: '꾹',
  4: '폭닥',
  5: '젤리'
};

export const PAW_LONG_COPY: Record<PawScore, string> = {
  1: '슬쩍했어요',
  2: '콕 남겼어요',
  3: '꾹 눌렀어요',
  4: '폭닥 주고 갔어요',
  5: '젤리까지 찍고 갔어요'
};

export function getPawLabelFromAverage(averageScore: number): PawLabel {
  if (!averageScore || Number.isNaN(averageScore)) return '슬쩍';
  if (averageScore >= 4.5) {
    return '젤리';
  }

  if (averageScore >= 4) {
    return '폭닥';
  }

  if (averageScore >= 3) {
    return '꾹';
  }

  if (averageScore >= 2) {
    return '콕';
  }

  return '슬쩍';
}

/** `getPawLabelFromAverage`와 동일 구간을 대표 발 점수(1~5)로 반환 */
export function getPawScoreFromAverage(averageScore: number): PawScore {
  if (!averageScore || Number.isNaN(averageScore)) return 1;
  if (averageScore >= 4.5) return 5;
  if (averageScore >= 4) return 4;
  if (averageScore >= 3) return 3;
  if (averageScore >= 2) return 2;
  return 1;
}

export function formatAverageMood(averageScore: number, precision: 1 | 2 = 1): string {
  const score = typeof averageScore === 'number' && !Number.isNaN(averageScore) ? averageScore : 0;
  return score.toFixed(precision);
}

export function getPawLongCopy(score: PawScore): string {
  return PAW_LONG_COPY[score];
}
