/**
 * DB 원고(`docent_scripts`)를 오디오 도슨트 챕터와 「소개글」로 바꾼다.
 *
 * `chapters.ts` 는 저장소 JSON(ko/en/es 접미사 필드) 기준이고, 이 파일은 언어별 행으로
 * 저장된 DB 원고 기준이다. 여섯 언어 모두 같은 규칙으로 다룬다:
 * 요청 언어에 **완전한** 투어(여는 말·지점·맺음말)가 있으면 그 언어, 없으면 영어, 영어도 없으면 한국어.
 */

import type { Language } from '@/shared/i18n/dictionary';
import type { DocentLanguageScript, DocentSiteScripts } from '../api/docent.repository';
import type { DocentChapter } from './chapters';

const FALLBACK: Language[] = ['en', 'ko'];

function isCompleteTour(script: DocentLanguageScript | undefined): script is DocentLanguageScript {
  if (!script) return false;
  const seqs = new Set(script.points.map((p) => p.seq));
  // 여는 말(0)·맺음말(99)이 있고 실제 지점이 하나 이상, 본문이 비지 않아야 한다
  return (
    seqs.has(0) &&
    seqs.has(99) &&
    script.points.some((p) => p.seq > 0 && p.seq < 99) &&
    script.points.every((p) => p.body.length > 0)
  );
}

/** 투어를 낼 언어. 없으면 null — 화면은 소개·역사 폴백(`buildChapters`)으로 간다. */
export function pickTourLanguage(
  scripts: DocentSiteScripts | undefined,
  requested: Language,
): Language | null {
  if (!scripts) return null;
  for (const lang of [requested, ...FALLBACK]) {
    if (isCompleteTour(scripts[lang])) return lang;
  }
  return null;
}

export function buildDbChapters(
  scripts: DocentSiteScripts | undefined,
  requested: Language,
): DocentChapter[] | null {
  const lang = pickTourLanguage(scripts, requested);
  if (!lang) return null;
  return scripts![lang]!.points.map((p) => ({
    id: p.seq === 0 ? 'intro' : p.seq === 99 ? 'outro' : `point-${p.seq}`,
    title: p.title,
    narration: p.body,
    location: null,
    lookFor: p.lookFor,
  }));
}

/** 「소개글」 세 문단. 요청 언어 → 영어 → 한국어 순으로 있는 것을 쓴다. 없으면 null. */
export function pickIntro(
  scripts: DocentSiteScripts | undefined,
  requested: Language,
): { language: Language; paragraphs: string[] } | null {
  if (!scripts) return null;
  for (const lang of [requested, ...FALLBACK]) {
    const intro = scripts[lang]?.intro;
    if (intro && intro.length > 0) return { language: lang, paragraphs: intro };
  }
  return null;
}
