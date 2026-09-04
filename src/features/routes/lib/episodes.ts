/**
 * 순례 코스를 "연재물"로 읽는 규칙.
 *
 * 코스는 원래 지리 순서가 아니라 **이야기 순서**로 성지를 꿴 것이다. 그런데
 * 화면은 그것을 그냥 목록으로 보여줘서, 다음 성지에 갈 이유가 "아직 안 가봤다"
 * 밖에 없었다. 연재물은 다르다 — **다음 화가 궁금해서** 본다.
 *
 * 그래서 경유지를 화(話)로 부르고, 각 화 끝에 다음 화 예고를 붙인다.
 * 예고 문구는 **다음 경유지의 note(이 코스에서의 의미)를 그대로 쓴다** —
 * 없는 사연을 지어내지 않고, 이미 사람이 쓴 한 줄을 제자리에 놓을 뿐이다.
 * note 가 없는 경유지는 예고 없이 이름만 보여준다.
 */

export interface EpisodeStop {
  position: number;
  note: string | null;
  site: { id: string; name: string };
}

export interface EpisodeView {
  /** 몇 화인가 (1부터) */
  episode: number;
  /** 마지막 화인가 */
  isFinale: boolean;
  /** 다음 화 예고. 다음 경유지가 없으면 null */
  next: { siteName: string; teaser: string | null } | null;
}

/** 경유지 목록을 화 단위로 읽는다. 입력 순서를 그대로 화 번호로 쓴다. */
export function toEpisodes(stops: EpisodeStop[]): EpisodeView[] {
  return stops.map((_, i) => {
    const next = stops[i + 1];
    return {
      episode: i + 1,
      isFinale: i === stops.length - 1,
      next: next ? { siteName: next.site.name, teaser: next.note } : null,
    };
  });
}

/**
 * 이 코스에서 내가 몇 화까지 다녀왔는가.
 *
 * "연속으로 몇 화"가 아니라 **다녀온 화의 수**를 센다 — 순례는 순서대로만
 * 다니는 것이 아니고, 3화를 먼저 갔다고 해서 진행이 0일 이유가 없다.
 */
export function countVisitedEpisodes(stops: EpisodeStop[], visitedSiteIds: Set<string>): number {
  return stops.filter((s) => visitedSiteIds.has(s.site.id)).length;
}
