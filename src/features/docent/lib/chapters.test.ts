import { describe, expect, it } from 'vitest';
import { buildChapters, type DocentScript } from './chapters';

const basic = { name: '절두산 순교성지', description: '소개문', history: '역사문' };
const script: DocentScript = {
  siteId: 'id-1',
  siteName: '절두산 순교성지',
  status: 'draft',
  intro: { narration: '여는 말입니다' },
  points: [
    {
      seq: 1,
      title: '순교자 기념상',
      location: '입구 왼쪽',
      narration: '설명',
      lookFor: '십자가',
      forEveryone: null,
    },
  ],
  outro: { narration: '맺음말입니다' },
};

describe('buildChapters', () => {
  it('원고가 없으면 소개·역사·맺음말로 구성한다', () => {
    const result = buildChapters(basic, null, 'ko');
    expect(result.map((c) => c.id)).toEqual(['intro', 'history', 'outro']);
    expect(result[0]?.narration).toBe('소개문');
  });

  it('소개·역사가 둘 다 없으면 빈 배열 — 맺음말만 읽어줄 수는 없다', () => {
    expect(buildChapters({ name: 'x', description: null, history: null }, null, 'ko')).toEqual([]);
  });

  it('소개만 있으면 역사 챕터 없이 소개·맺음말로 구성한다', () => {
    const result = buildChapters({ name: 'x', description: '소개문', history: null }, null, 'ko');
    expect(result.map((c) => c.id)).toEqual(['intro', 'outro']);
  });

  it('원고가 있으면 여는 말·포인트·맺음말로 구성한다', () => {
    const result = buildChapters(basic, script, 'ko');
    expect(result.map((c) => c.id)).toEqual(['intro', 'point-1', 'outro']);
    expect(result[1]?.location).toBe('입구 왼쪽');
    expect(result[1]?.lookFor).toBe('십자가');
  });

  it('영어 모드에서는 한국어 원고 대신 번역 본문 챕터를 쓴다', () => {
    const result = buildChapters(basic, script, 'en');
    expect(result.map((c) => c.id)).toEqual(['intro', 'history', 'outro']);
    expect(result[0]?.title).toBe('Welcome');
  });
});
