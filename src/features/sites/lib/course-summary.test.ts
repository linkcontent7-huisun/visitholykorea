import { describe, expect, it } from 'vitest';
import { plainCourseSummary } from './course-summary';

describe('걷기 코스 설명 (점검 B, 2026-11-22)', () => {
  it('<br> 은 줄바꿈으로, 다른 꼬리표는 지운다', () => {
    expect(plainCourseSummary('- 바다를 메운 땅<br>- 주변 경관<br />- <b>끝</b>')).toBe(
      '- 바다를 메운 땅\n- 주변 경관\n- 끝',
    );
  });
});
