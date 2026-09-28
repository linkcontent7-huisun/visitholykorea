import { describe, expect, it } from 'vitest';
import { COURSE_OFFICIAL_LINKS, NATIONWIDE_TRAILS } from './official-trails';

// 링크 목록은 손으로 옮긴 자료라 오타 한 글자가 곧 깨진 단추다 — 모양만이라도 지킨다.
describe('순례길 공식 링크', () => {
  const all = [...Object.values(COURSE_OFFICIAL_LINKS), ...NATIONWIDE_TRAILS];

  it('모든 링크가 http(s) 절대 주소다', () => {
    for (const l of all) expect(l.url).toMatch(/^https?:\/\/[^\s]+$/);
  });

  it('전국 목록에 같은 주소가 두 번 없다', () => {
    const urls = NATIONWIDE_TRAILS.map((t) => t.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('전국 목록은 한국어·영어 이름과 운영 주체를 모두 가진다', () => {
    for (const t of NATIONWIDE_TRAILS) {
      expect(t.name.trim()).not.toBe('');
      expect(t.nameEn.trim()).not.toBe('');
      expect(t.owner.trim()).not.toBe('');
    }
  });
});
