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

  it('영어 번역이 없는 원고는 영어 모드에서 번역 본문 챕터로 폴백한다', () => {
    const result = buildChapters(basic, script, 'en');
    expect(result.map((c) => c.id)).toEqual(['intro', 'history', 'outro']);
    expect(result[0]?.title).toBe('Welcome');
  });

  it('영어 번역이 전부 있는 원고는 영어 모드에서도 포인트 투어로 나온다', () => {
    const enScript: DocentScript = {
      ...script,
      intro: { narration: '여는 말입니다', narrationEn: 'Welcome to this shrine.' },
      points: [
        {
          seq: 1,
          title: '순교자 기념상',
          titleEn: 'Martyrs Memorial Statue',
          location: '입구 왼쪽',
          locationEn: 'Left of the entrance',
          narration: '설명',
          narrationEn: 'An English narration.',
          lookFor: '십자가',
          lookForEn: 'The cross',
          forEveryone: null,
        },
      ],
      outro: { narration: '맺음말입니다', narrationEn: 'Thank you for visiting.' },
    };
    const result = buildChapters(basic, enScript, 'en');
    expect(result.map((c) => c.id)).toEqual(['intro', 'point-1', 'outro']);
    expect(result[0]?.narration).toBe('Welcome to this shrine.');
    expect(result[1]?.title).toBe('Martyrs Memorial Statue');
    expect(result[1]?.location).toBe('Left of the entrance');
  });

  it('포인트 하나라도 영어가 빠지면 통째로 폴백한다 — 반쪽 영어 투어는 안 낸다', () => {
    const partial: DocentScript = {
      ...script,
      intro: { narration: '여는 말입니다', narrationEn: 'Welcome.' },
      outro: { narration: '맺음말입니다', narrationEn: 'Farewell.' },
      // points 의 narrationEn 이 없다
    };
    const result = buildChapters(basic, partial, 'en');
    expect(result.map((c) => c.id)).toEqual(['intro', 'history', 'outro']);
  });

  it('스페인어 번역이 전부 있는 원고는 스페인어 포인트 투어로 나온다', () => {
    const esScript: DocentScript = {
      ...script,
      intro: { narration: '여는 말입니다', narrationEs: 'Bienvenido a este santuario.' },
      points: [
        {
          seq: 1,
          title: '순교자 기념상',
          titleEs: 'Estatua conmemorativa de los mártires',
          location: '입구 왼쪽',
          locationEs: 'A la izquierda de la entrada',
          narration: '설명',
          narrationEs: 'Una narración en español.',
          lookFor: '십자가',
          lookForEs: 'La cruz',
          forEveryone: null,
        },
      ],
      outro: { narration: '맺음말입니다', narrationEs: 'Gracias por su visita.' },
    };
    const result = buildChapters(basic, esScript, 'es');
    expect(result.map((c) => c.id)).toEqual(['intro', 'point-1', 'outro']);
    expect(result[0]?.title).toBe('Bienvenida');
    expect(result[1]?.title).toBe('Estatua conmemorativa de los mártires');
    expect(result[1]?.location).toBe('A la izquierda de la entrada');
    expect(result[2]?.narration).toBe('Gracias por su visita.');
  });

  it('스페인어가 빠진 원고는 스페인어 모드에서 영어 원고로 내려간다 — 한국어가 아니다', () => {
    const enOnly: DocentScript = {
      ...script,
      intro: { narration: '여는 말입니다', narrationEn: 'Welcome to this shrine.' },
      points: [
        {
          seq: 1,
          title: '순교자 기념상',
          titleEn: 'Martyrs Memorial Statue',
          location: '입구 왼쪽',
          locationEn: 'Left of the entrance',
          narration: '설명',
          narrationEn: 'An English narration.',
          lookFor: '십자가',
          lookForEn: 'The cross',
          forEveryone: null,
        },
      ],
      outro: { narration: '맺음말입니다', narrationEn: 'Thank you for visiting.' },
    };
    const result = buildChapters(basic, enOnly, 'es');
    expect(result.map((c) => c.id)).toEqual(['intro', 'point-1', 'outro']);
    expect(result[0]?.narration).toBe('Welcome to this shrine.');
  });

  it('포인트 하나라도 스페인어가 빠지면 스페인어 투어를 내지 않는다', () => {
    const partialEs: DocentScript = {
      ...script,
      intro: { narration: '여는 말입니다', narrationEs: 'Bienvenido.' },
      outro: { narration: '맺음말입니다', narrationEs: 'Gracias.' },
      // points 의 narrationEs 가 없다
    };
    const result = buildChapters(basic, partialEs, 'es');
    expect(result.map((c) => c.id)).toEqual(['intro', 'history', 'outro']);
    expect(result[0]?.title).toBe('Welcome');
  });
});
