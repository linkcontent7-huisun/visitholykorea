import { describe, expect, it } from 'vitest';
import { CATHOLIC_TITLE } from './course-matching';

/**
 * 코스 카드 문장은 "붐비는 관광지를 뒤로하고 조용한 성지로"다.
 * 가톨릭 시설이 "인파" 쪽에 서면 성지를 피해 성지로 가라는 말이 된다.
 */
describe('CATHOLIC_TITLE — 페어링에서 거를 관광지', () => {
  it('가톨릭 시설을 걸러낸다', () => {
    // 실제로 화면에 잘못 나갔던 값들
    for (const title of [
      '나주 순교자 기념성당',
      '남산동 가톨릭타운',
      '절두산 순교성지',
      '명동대성당',
      '성모당',
      '베네딕도 수도원',
      '천주교 서울대교구청',
      '요당리 공소',
    ]) {
      expect(CATHOLIC_TITLE.test(title), title).toBe(true);
    }
  });

  it('가톨릭이 아닌 관광지는 통과시킨다 — 사찰·향교도 정상적인 붐비는 관광지다', () => {
    for (const title of [
      '심향사(나주)',
      '통영 세병관',
      '정몽주 동상',
      '경복궁',
      '해운대해수욕장',
      '전주향교',
      '불국사',
    ]) {
      expect(CATHOLIC_TITLE.test(title), title).toBe(false);
    }
  });
});
