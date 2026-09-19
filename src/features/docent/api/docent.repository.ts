/**
 * 도슨트 원고 저장소 — `docent_scripts` 표 (마이그레이션 20260917090000).
 *
 * 원고는 2026-09-18 부터 DB 가 기준이다. 저장소의 `data/docent/*.json` 은 원본 파일이자
 * DB 가 안 닿을 때의 폴백으로만 남아 있다 (`data/scripts.ts`).
 * 행(snake_case) → 도메인(camelCase) 변환은 이 파일 안에서만 한다.
 */

import { supabase } from '@/shared/api/supabase';
import type { Language } from '@/shared/i18n/dictionary';
import type { DocentScriptRow } from '@/shared/types/database';

export interface DocentPointEntry {
  seq: number;
  title: string;
  body: string;
  lookFor: string | null;
}

/** 한 언어분의 원고. 소개글은 큰따옴표 문단 배열, 지점은 seq 순. */
export interface DocentLanguageScript {
  /** 「소개글」 — 순교·신앙 역사 / 위치·지리 / 건축물 세 문단. 없으면 빈 배열. */
  intro: string[];
  /** seq 0 여는 말 · 1..n 지점 · 99 맺음말 (있는 것만). */
  points: DocentPointEntry[];
}

export type DocentSiteScripts = Partial<Record<Language, DocentLanguageScript>>;

const TABLE = 'docent_scripts';

/** 소개글 본문은 문단마다 큰따옴표로 감싸 저장돼 있다 — 화면이 따옴표를 그리므로 벗겨서 돌려준다. */
export function splitIntroParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim().replace(/^[“"]/, '').replace(/[”"]$/, '').trim())
    .filter((p) => p.length > 0);
}

export function groupRows(rows: DocentScriptRow[]): DocentSiteScripts {
  const out: DocentSiteScripts = {};
  for (const row of rows) {
    const lang = (out[row.language] ??= { intro: [], points: [] });
    if (row.kind === 'intro') {
      lang.intro = splitIntroParagraphs(row.body);
    } else {
      lang.points.push({
        seq: row.seq,
        title: row.title ?? '',
        body: row.body,
        lookFor: row.look_for,
      });
    }
  }
  for (const lang of Object.values(out)) lang.points.sort((a, b) => a.seq - b.seq);
  return out;
}

/** 이 성지의 모든 언어 원고. 언어는 화면에서 고르므로 한 번에 받아 캐시한다 (성지당 수십 행). */
export async function fetchDocentScripts(siteId: string): Promise<DocentSiteScripts> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('site_id, language, kind, seq, title, body, look_for')
    .eq('site_id', siteId)
    .order('seq', { ascending: true });
  if (error) throw new Error(`fetchDocentScripts: ${error.message}`);
  return groupRows((data ?? []) as DocentScriptRow[]);
}

/** 지점 원고(한국어)가 있는 성지 id 목록 — 목록 카드의 「오디오 도슨트」 표시용. */
export async function fetchDocentSiteIds(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('site_id')
    .eq('kind', 'point')
    .eq('language', 'ko')
    .eq('seq', 1);
  if (error) throw new Error(`fetchDocentSiteIds: ${error.message}`);
  return new Set((data ?? []).map((r) => r.site_id as string));
}
