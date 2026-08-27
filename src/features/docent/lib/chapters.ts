/**
 * 오디오 도슨트의 챕터 구성.
 *
 * 현장조사 원고(`data/docent/*.json`)가 있는 성지는 포인트별 투어로,
 * 없는 성지(대부분)는 지금 DB 에 실제로 있는 소개·역사 텍스트로 챕터를 만든다.
 * 더미 금지 원칙 — 없는 데이터를 지어내는 대신, 있는 데이터의 모양에 맞춘다.
 */

export interface DocentPoint {
  seq: number;
  title: string;
  titleEn?: string | null;
  location: string | null;
  locationEn?: string | null;
  narration: string;
  narrationEn?: string | null;
  lookFor: string | null;
  lookForEn?: string | null;
  forEveryone: string | null;
}

export interface DocentScript {
  siteId: string;
  siteName: string;
  status: 'draft' | 'verified';
  intro: { narration: string; narrationEn?: string | null };
  points: DocentPoint[];
  outro: { narration: string; narrationEn?: string | null };
}

/**
 * 영어 포인트 투어는 전부 번역됐을 때만 낸다.
 * 챕터 중간에 갑자기 한국어가 나오는 반쪽 투어보다 소개·역사 폴백이 낫다.
 */
function hasFullEnglish(script: DocentScript): boolean {
  return Boolean(
    script.intro.narrationEn &&
      script.outro.narrationEn &&
      script.points.every((p) => p.narrationEn && p.titleEn),
  );
}

export interface DocentChapter {
  id: string;
  title: string;
  narration: string;
  location: string | null;
  lookFor: string | null;
}

/** 성지 데이터가 아니라 앱의 고정 문구다 — 원고 없는 성지의 맺음말. */
const CLOSING = {
  ko: '함께 걸어주셔서 감사합니다. 평화로운 순례 되시길 바랍니다.',
  en: 'Thank you for walking with us. May your pilgrimage be peaceful.',
} as const;

const TITLES = {
  ko: { intro: '여는 말', history: '역사', outro: '맺음말' },
  en: { intro: 'Welcome', history: 'History', outro: 'Farewell' },
} as const;

export function buildChapters(
  basic: { name: string; description: string | null; history: string | null },
  script: DocentScript | null,
  language: 'ko' | 'en',
): DocentChapter[] {
  if (script && language === 'ko') {
    return [
      { id: 'intro', title: TITLES.ko.intro, narration: script.intro.narration, location: null, lookFor: null },
      ...script.points.map((p) => ({
        id: `point-${p.seq}`,
        title: p.title,
        narration: p.narration,
        location: p.location,
        lookFor: p.lookFor,
      })),
      { id: 'outro', title: TITLES.ko.outro, narration: script.outro.narration, location: null, lookFor: null },
    ];
  }

  // 영어 모드 — 원고가 끝까지 번역된 성지만 영어 포인트 투어를 낸다.
  if (script && language === 'en' && hasFullEnglish(script)) {
    return [
      { id: 'intro', title: TITLES.en.intro, narration: script.intro.narrationEn!, location: null, lookFor: null },
      ...script.points.map((p) => ({
        id: `point-${p.seq}`,
        title: p.titleEn!,
        narration: p.narrationEn!,
        location: p.locationEn ?? null,
        lookFor: p.lookForEn ?? null,
      })),
      { id: 'outro', title: TITLES.en.outro, narration: script.outro.narrationEn!, location: null, lookFor: null },
    ];
  }

  const t = TITLES[language];
  const body: DocentChapter[] = [];
  if (basic.description) {
    body.push({ id: 'intro', title: t.intro, narration: basic.description, location: null, lookFor: null });
  }
  if (basic.history) {
    body.push({ id: 'history', title: t.history, narration: basic.history, location: null, lookFor: null });
  }
  // 본문이 하나도 없으면 맺음말만 읽어줄 수는 없다.
  if (body.length === 0) return [];
  body.push({ id: 'outro', title: t.outro, narration: CLOSING[language], location: null, lookFor: null });
  return body;
}
