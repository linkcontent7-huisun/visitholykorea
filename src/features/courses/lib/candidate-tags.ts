/**
 * 후보 카드 태그 배정 — 「가장 가까워요 · 소개가 자세해요」.
 * 「인근이 조용해요」는 붐빔 지수를 쓰던 태그라 뺐다(사장님 2026-11-27, 공모전 종료).
 *
 * 태그는 **데이터로 증명되는 것만** 붙인다. 「마음에 꼭 맞아요」는 카드 셋이 다 같은 마음이라
 * 구분이 안 되고, 「한적한 성지」는 성지 안 사람 수를 잴 데이터가 없어 거짓 주장이다.
 * 한 성지에 태그 하나. 겹치면 가까움 → 자세함 순으로 양보한다.
 *
 * 순수 함수 — 스펙 7-1 절. 테스트로 고정한다.
 */

export type CandidateTag = 'nearest' | 'detailed';

export interface TagInput {
  distanceKm: number;
  quality: number;
}

/** 페이지 안 카드들에 태그를 매긴다. 결과 배열은 입력과 같은 순서. */
export function assignTags(cards: readonly TagInput[]): (CandidateTag | null)[] {
  const tags: (CandidateTag | null)[] = cards.map(() => null);
  const taken = new Set<number>();

  const claim = (tag: CandidateTag, order: number[]) => {
    const idx = order.find((i) => !taken.has(i));
    if (idx == null) return;
    tags[idx] = tag;
    taken.add(idx);
  };

  const byDistance = cards
    .map((_, i) => i)
    .sort((a, b) => cards[a]!.distanceKm - cards[b]!.distanceKm);
  claim('nearest', byDistance);

  // 소개 태그는 품질이 0 보다 커야 붙는다 — 아무 정보도 없는 곳에 "자세해요"는 거짓이다.
  const byQuality = cards
    .map((c, i) => (c.quality > 0 ? i : null))
    .filter((i): i is number => i != null)
    .sort((a, b) => cards[b]!.quality - cards[a]!.quality);
  claim('detailed', byQuality);

  return tags;
}
