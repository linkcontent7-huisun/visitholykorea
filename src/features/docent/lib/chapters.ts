import type { Language } from '@/shared/i18n/dictionary';

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
  titleEs?: string | null;
  location: string | null;
  locationEn?: string | null;
  locationEs?: string | null;
  narration: string;
  narrationEn?: string | null;
  narrationEs?: string | null;
  lookFor: string | null;
  lookForEn?: string | null;
  lookForEs?: string | null;
  forEveryone: string | null;
}

export interface DocentNarration {
  narration: string;
  narrationEn?: string | null;
  narrationEs?: string | null;
}

export interface DocentScript {
  siteId: string;
  siteName: string;
  status: 'draft' | 'verified';
  intro: DocentNarration;
  points: DocentPoint[];
  outro: DocentNarration;
}

/**
 * 원고 JSON 이 실제로 담고 있는 낭독 언어.
 * 여기 없는 언어(프랑스어 등)로 보는 사람은 영어 원고를 받는다 — 한국어보다는 읽을 수 있다.
 * 새 언어를 늘릴 때는 이 배열과 아래 `FIELD_SUFFIX`·`TITLES` 세 곳만 고치면 된다.
 */
const SCRIPT_LANGUAGES = ['ko', 'en', 'es'] as const;
type ScriptLanguage = (typeof SCRIPT_LANGUAGES)[number];

/** 원고 필드 이름의 접미사 — `narration` + `Es` = 스페인어 낭독문. 한국어가 원본이라 접미사가 없다. */
const FIELD_SUFFIX: Record<ScriptLanguage, string> = { ko: '', en: 'En', es: 'Es' };

function isScriptLanguage(language: Language): language is ScriptLanguage {
  return (SCRIPT_LANGUAGES as readonly string[]).includes(language);
}

/**
 * 원고에서 그 언어의 값을 꺼낸다. 없거나 빈 문자열이면 null.
 * 언어마다 필드 이름이 달라(`title`/`titleEn`/`titleEs`) 이름을 조립해 읽으므로
 * 타입을 한 번 벗긴다 — 대신 문자열이 아닌 값은 여기서 전부 걸러낸다.
 */
function localized(
  source: DocentNarration | DocentPoint,
  base: 'narration' | 'title' | 'location' | 'lookFor',
  language: ScriptLanguage,
): string | null {
  const value = (source as unknown as Record<string, unknown>)[`${base}${FIELD_SUFFIX[language]}`];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * 포인트 투어는 그 언어로 **끝까지** 번역됐을 때만 낸다.
 * 챕터 중간에 갑자기 다른 언어가 나오는 반쪽 투어보다 소개·역사 폴백이 낫다.
 */
function hasFullTranslation(script: DocentScript, language: ScriptLanguage): boolean {
  if (language === 'ko') return true; // 한국어는 원고 원본이라 언제나 있다
  return Boolean(
    localized(script.intro, 'narration', language) &&
      localized(script.outro, 'narration', language) &&
      script.points.every(
        (point) =>
          localized(point, 'narration', language) && localized(point, 'title', language),
      ),
  );
}

/** 요청한 언어로 낼 수 있으면 그 언어로, 아니면 영어로 내린다. */
function scriptLanguage(requested: Language, script: DocentScript | null): ScriptLanguage {
  if (requested === 'ko') return 'ko';
  if (script && isScriptLanguage(requested) && hasFullTranslation(script, requested)) {
    return requested;
  }
  return 'en';
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

const TITLES: Record<ScriptLanguage, { intro: string; history: string; outro: string }> = {
  ko: { intro: '여는 말', history: '역사', outro: '맺음말' },
  en: { intro: 'Welcome', history: 'History', outro: 'Farewell' },
  es: { intro: 'Bienvenida', history: 'Historia', outro: 'Despedida' },
};

export function buildChapters(
  basic: { name: string; description: string | null; history: string | null },
  script: DocentScript | null,
  requestedLanguage: Language,
): DocentChapter[] {
  const language = scriptLanguage(requestedLanguage, script);

  if (script && hasFullTranslation(script, language)) {
    const titles = TITLES[language];
    return [
      {
        id: 'intro',
        title: titles.intro,
        narration: localized(script.intro, 'narration', language)!,
        location: null,
        lookFor: null,
      },
      ...script.points.map((point) => ({
        id: `point-${point.seq}`,
        title: localized(point, 'title', language)!,
        narration: localized(point, 'narration', language)!,
        location: localized(point, 'location', language),
        lookFor: localized(point, 'lookFor', language),
      })),
      {
        id: 'outro',
        title: titles.outro,
        narration: localized(script.outro, 'narration', language)!,
        location: null,
        lookFor: null,
      },
    ];
  }

  // 폴백 본문은 아직 한국어·영어뿐이다 (DB 번역이 폴백 사슬로 그 언어를 이미 시도한 뒤 넘어온다).
  const fallback = language === 'ko' ? 'ko' : 'en';
  const t = TITLES[fallback];
  const body: DocentChapter[] = [];
  if (basic.description) {
    body.push({ id: 'intro', title: t.intro, narration: basic.description, location: null, lookFor: null });
  }
  if (basic.history) {
    body.push({ id: 'history', title: t.history, narration: basic.history, location: null, lookFor: null });
  }
  // 본문이 하나도 없으면 맺음말만 읽어줄 수는 없다.
  if (body.length === 0) return [];
  body.push({ id: 'outro', title: t.outro, narration: CLOSING[fallback], location: null, lookFor: null });
  return body;
}
