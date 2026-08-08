import { describe, expect, it } from 'vitest';
import type { HolySite } from '@/shared/types/domain';
import {
  ALMOST,
  almostSiteIds,
  buildNudge,
  computeDioceseProgress,
  pinStateOf,
  totalProgress,
} from './progress';

function site(id: string, diocese: string): HolySite {
  return {
    id,
    name: `${id} 성지`,
    category: '순교성지',
    region: diocese,
    location: '어딘가',
    description: null,
    history: null,
    imageUrl: null,
    coordinates: { lat: 37, lng: 127 },
    emotionTag: null,
    seoTitle: null,
    seoDescription: null,
    nearbyAttractions: null,
    nearbyLodging: null,
    phone: null,
    homepageUrl: null,
    fax: null,
  };
}

/** 한 교구에 n 곳을 만들고 앞에서부터 visited 곳을 다녀온 것으로 친다 */
function diocese(name: string, total: number, visited: number) {
  const sites = Array.from({ length: total }, (_, i) => site(`${name}-${i}`, name));
  const visitedIds = new Set(sites.slice(0, visited).map((s) => s.id));
  return { sites, visitedIds };
}

describe('computeDioceseProgress — 교구별 진행', () => {
  it('다녀온 수와 전체 수를 센다', () => {
    const { sites, visitedIds } = diocese('대전', 27, 3);
    const [p] = computeDioceseProgress(sites, visitedIds);

    expect(p?.visited).toBe(3);
    expect(p?.total).toBe(27);
  });

  it('교구가 없는 성지는 기타로 묶는다', () => {
    const nameless = { ...site('x', ''), region: '' };
    const [p] = computeDioceseProgress([nameless], new Set());

    expect(p?.diocese).toBe('기타');
  });

  it('많이 채운 교구가 앞에 온다', () => {
    const a = diocese('대전', 10, 9);
    const b = diocese('서울', 10, 1);
    const progress = computeDioceseProgress([...a.sites, ...b.sites], new Set([...a.visitedIds, ...b.visitedIds]));

    expect(progress[0]?.diocese).toBe('대전');
  });
});

describe('almost — "거의 다 왔다"의 기준', () => {
  it('26/27 은 거의 다 온 것이다', () => {
    const { sites, visitedIds } = diocese('대전', 27, 26);
    const [p] = computeDioceseProgress(sites, visitedIds);

    expect(p?.almost).toBe(true);
    expect(p?.remainingSites).toHaveLength(1);
  });

  it('3/27 은 아니다 — 27곳을 들이대면 질린다', () => {
    const { sites, visitedIds } = diocese('대전', 27, 3);
    const [p] = computeDioceseProgress(sites, visitedIds);

    expect(p?.almost).toBe(false);
  });

  it('성지가 2곳뿐인 교구에서 1곳 남은 건 거의 다 온 게 아니다', () => {
    // 남은 수(1)만 보면 조건에 걸리지만, 절반밖에 안 채웠다
    const { sites, visitedIds } = diocese('군종', 2, 1);
    const [p] = computeDioceseProgress(sites, visitedIds);

    expect(p?.almost).toBe(false);
  });

  it('다 채운 교구는 강조하지 않는다 — 남은 곳이 없다', () => {
    const { sites, visitedIds } = diocese('대전', 10, 10);
    const [p] = computeDioceseProgress(sites, visitedIds);

    expect(p?.almost).toBe(false);
    expect(p?.remainingSites).toHaveLength(0);
  });

  it('경계값 — 남은 곳이 기준과 같으면 포함한다', () => {
    // 20곳 중 17곳 방문 → 남은 3곳(기준값), 비율 0.85
    const { sites, visitedIds } = diocese('대구', 20, 20 - ALMOST.maxRemaining);
    const [p] = computeDioceseProgress(sites, visitedIds);

    expect(p?.almost).toBe(true);
  });

  it('거의 다 차지 않은 교구는 남은 목록을 채우지 않는다 (쓸데없이 크게 만들지 않는다)', () => {
    const { sites, visitedIds } = diocese('서울', 25, 1);
    const [p] = computeDioceseProgress(sites, visitedIds);

    expect(p?.remainingSites).toHaveLength(0);
  });
});

describe('pinStateOf — 핀 3단계', () => {
  it('다녀온 곳 · 강조할 곳 · 나머지를 구분한다', () => {
    const visited = new Set(['a']);
    const almost = new Set(['b']);

    expect(pinStateOf('a', visited, almost)).toBe('visited');
    expect(pinStateOf('b', visited, almost)).toBe('almost');
    expect(pinStateOf('c', visited, almost)).toBe('remaining');
  });

  it('다녀온 곳이 강조보다 우선한다', () => {
    expect(pinStateOf('a', new Set(['a']), new Set(['a']))).toBe('visited');
  });
});

describe('buildNudge — 넛지 문구', () => {
  it('한 곳 남으면 그 이름을 부른다', () => {
    const { sites, visitedIds } = diocese('대전', 27, 26);
    const nudge = buildNudge(computeDioceseProgress(sites, visitedIds));

    expect(nudge).toContain('대전교구');
    expect(nudge).toContain('한 곳');
    expect(nudge).toContain('대전-26 성지'); // 남은 성지 이름을 직접 부른다
  });

  it('여러 곳 남으면 수만 말한다', () => {
    const { sites, visitedIds } = diocese('대전', 27, 25);
    const nudge = buildNudge(computeDioceseProgress(sites, visitedIds));

    expect(nudge).toContain('2곳');
  });

  it('거의 다 온 교구가 없으면 말을 걸지 않는다', () => {
    const { sites, visitedIds } = diocese('대전', 27, 2);
    expect(buildNudge(computeDioceseProgress(sites, visitedIds))).toBeNull();
  });

  it('아무 데도 안 갔으면 말을 걸지 않는다', () => {
    const { sites } = diocese('대전', 27, 0);
    expect(buildNudge(computeDioceseProgress(sites, new Set()))).toBeNull();
  });

  it('점수 따기 말투를 쓰지 않는다', () => {
    const { sites, visitedIds } = diocese('대전', 27, 26);
    const nudge = buildNudge(computeDioceseProgress(sites, visitedIds)) ?? '';

    for (const word of ['정복', '클리어', '달성률', '도전', '랭킹']) {
      expect(nudge).not.toContain(word);
    }
  });
});

describe('almostSiteIds · totalProgress', () => {
  it('강조할 성지 id 를 모은다', () => {
    const a = diocese('대전', 27, 26);
    const b = diocese('서울', 25, 24);
    const all = [...a.sites, ...b.sites];
    const visited = new Set([...a.visitedIds, ...b.visitedIds]);

    const ids = almostSiteIds(computeDioceseProgress(all, visited));

    expect(ids.size).toBe(2); // 교구마다 한 곳씩
  });

  it('전체 진행을 센다', () => {
    const { sites, visitedIds } = diocese('대전', 27, 3);
    expect(totalProgress(sites, visitedIds)).toEqual({ visited: 3, total: 27 });
  });
});
