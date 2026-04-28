import { describe, expect, it } from 'vitest';

import { formatAverageMood, getPawLabelFromAverage, getPawScoreFromAverage } from './reactions';

describe('여운 반응 규칙', () => {
  it('평균 점수 구간에 맞는 대표 라벨을 계산한다', () => {
    expect(getPawLabelFromAverage(4.72)).toBe('젤리');
    expect(getPawLabelFromAverage(4.1)).toBe('폭닥');
    expect(getPawLabelFromAverage(3.5)).toBe('꾹');
    expect(getPawLabelFromAverage(2.4)).toBe('콕');
    expect(getPawLabelFromAverage(1.3)).toBe('슬쩍');
  });

  it('평균 감도 표기를 문서 용어대로 만든다', () => {
    expect(formatAverageMood(4.72, 2)).toBe('4.72');
    expect(formatAverageMood(4.72, 1)).toBe('4.7');
  });

  it('평균 점수 구간에 맞는 대표 발 점수를 계산한다', () => {
    expect(getPawScoreFromAverage(4.72)).toBe(5);
    expect(getPawScoreFromAverage(4.1)).toBe(4);
    expect(getPawScoreFromAverage(3.5)).toBe(3);
    expect(getPawScoreFromAverage(2.4)).toBe(2);
    expect(getPawScoreFromAverage(1.3)).toBe(1);
    expect(getPawScoreFromAverage(0)).toBe(1);
  });
});
