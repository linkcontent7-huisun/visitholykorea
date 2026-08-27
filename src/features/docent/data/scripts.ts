/**
 * 도슨트 원고 로더.
 *
 * 원고는 DB 가 아니라 저장소의 `data/docent/*.json` 에 산다 — 현장조사 결과가
 * git 기록으로 남고, 테이블·마이그레이션 없이 빌드에 실려 온다.
 * 같은 폴더의 `_템플릿.json`(siteId: null)이 함께 잡히므로 검증으로 걸러낸다.
 */

import type { DocentScript } from '../lib/chapters';

/** 원고 하나가 깨졌다고 앱이 죽으면 안 된다 — 형식이 맞는 것만 조용히 채택한다. */
export function indexDocentScripts(modules: Record<string, unknown>): Map<string, DocentScript> {
  const map = new Map<string, DocentScript>();
  for (const raw of Object.values(modules)) {
    // Vite 의 eager glob 은 JSON 을 default 로 감싸서 줄 수도, 그대로 줄 수도 있다.
    const candidate =
      raw && typeof raw === 'object' && 'default' in raw
        ? (raw as { default: unknown }).default
        : raw;
    if (!candidate || typeof candidate !== 'object') continue;
    const script = candidate as Partial<DocentScript>;
    if (typeof script.siteId !== 'string' || script.siteId.length === 0) continue;
    if (!script.intro?.narration) continue;
    if (!Array.isArray(script.points) || script.points.length === 0) continue;
    if (!script.outro?.narration) continue;
    map.set(script.siteId, script as DocentScript);
  }
  return map;
}

const scriptsBySiteId = indexDocentScripts(
  import.meta.glob('/data/docent/*.json', { eager: true }),
);

/** 이 성지의 도슨트 원고. 없으면 null — 화면은 소개·역사 챕터로 폴백한다. */
export function getDocentScript(siteId: string | undefined): DocentScript | null {
  if (!siteId) return null;
  return scriptsBySiteId.get(siteId) ?? null;
}
