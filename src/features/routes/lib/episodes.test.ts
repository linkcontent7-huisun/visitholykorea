import { describe, expect, it } from 'vitest';
import { countVisitedEpisodes, toEpisodes, type EpisodeStop } from './episodes';

const stops: EpisodeStop[] = [
  { position: 1, note: '체포가 시작된 곳', site: { id: 'a', name: '절두산' } },
  { position: 2, note: null, site: { id: 'b', name: '새남터' } },
  { position: 3, note: '마지막 증언', site: { id: 'c', name: '해미읍성' } },
];

describe('toEpisodes', () => {
  it('경유지 순서를 그대로 화 번호로 쓴다', () => {
    expect(toEpisodes(stops).map((e) => e.episode)).toEqual([1, 2, 3]);
  });

  it('다음 화 예고는 다음 경유지의 note 를 그대로 쓴다 — 없는 사연을 지어내지 않는다', () => {
    const episodes = toEpisodes(stops);
    expect(episodes[0]!.next).toEqual({ siteName: '새남터', teaser: null });
    expect(episodes[1]!.next).toEqual({ siteName: '해미읍성', teaser: '마지막 증언' });
  });

  it('마지막 화는 예고가 없다', () => {
    const last = toEpisodes(stops)[2]!;
    expect(last.isFinale).toBe(true);
    expect(last.next).toBeNull();
  });

  it('경유지가 하나뿐이면 그것이 곧 마지막 화다', () => {
    const one = toEpisodes([stops[0]!]);
    expect(one).toHaveLength(1);
    expect(one[0]!.isFinale).toBe(true);
    expect(one[0]!.next).toBeNull();
  });

  it('빈 코스도 터지지 않는다', () => {
    expect(toEpisodes([])).toEqual([]);
  });
});

describe('countVisitedEpisodes', () => {
  it('순서와 무관하게 다녀온 화의 수를 센다', () => {
    // 3화를 먼저 갔다고 진행이 0일 이유가 없다
    expect(countVisitedEpisodes(stops, new Set(['c']))).toBe(1);
    expect(countVisitedEpisodes(stops, new Set(['a', 'c']))).toBe(2);
  });

  it('이 코스 밖의 스탬프는 세지 않는다', () => {
    expect(countVisitedEpisodes(stops, new Set(['zzz']))).toBe(0);
  });

  it('하나도 안 갔으면 0', () => {
    expect(countVisitedEpisodes(stops, new Set())).toBe(0);
  });
});
