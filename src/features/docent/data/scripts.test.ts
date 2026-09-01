import { describe, expect, it } from 'vitest';
import { indexDocentScripts } from './scripts';

const valid = {
  siteId: 'site-1',
  siteName: '절두산 순교성지',
  status: 'draft',
  intro: { narration: '여는 말' },
  points: [
    {
      seq: 1,
      title: '기념상',
      location: null,
      narration: '설명',
      lookFor: null,
      forEveryone: null,
    },
  ],
  outro: { narration: '맺음말' },
};

describe('indexDocentScripts', () => {
  it('정상 원고를 siteId 로 색인한다 — JSON 모듈의 default 감싸기도 벗긴다', () => {
    const map = indexDocentScripts({
      '/data/docent/a.json': valid,
      '/data/docent/b.json': { default: { ...valid, siteId: 'site-2' } },
    });
    expect(map.get('site-1')?.siteName).toBe('절두산 순교성지');
    expect(map.get('site-2')).toBeDefined();
  });

  it('템플릿(siteId null)과 깨진 파일은 조용히 뺀다 — 원고 하나가 앱을 죽이면 안 된다', () => {
    const map = indexDocentScripts({
      '/data/docent/_템플릿.json': { ...valid, siteId: null },
      '/data/docent/빈포인트.json': { ...valid, siteId: 'site-3', points: [] },
      '/data/docent/이상한값.json': 'not-an-object',
    });
    expect(map.size).toBe(0);
  });
});
