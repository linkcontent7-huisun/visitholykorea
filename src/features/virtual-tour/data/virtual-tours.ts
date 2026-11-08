/**
 * 3D 가상 순례가 있는 성지 목록 (2026-11-09 F1).
 *
 * 3D 는 별도 저장소·Vercel 프로젝트(`visitholykorea-visit`)이고, 메인 vercel.json 의 rewrite 로
 * `visitholykorea.com/visit/` 아래에 붙어 있다. 성지가 3곳을 넘으면 `holy_sites` 에
 * `virtual_tour_url` 컬럼을 두고 관리자 화면에서 고치는 쪽으로 옮긴다(통합 계획 Q4).
 */

/** 3D 쪽 공간 id — 3D 저장소 `shared/spaces.ts` 의 SpaceId 와 같은 값이어야 한다 */
export type VirtualTourSpace = 'cathedral';

export interface VirtualTour {
  space: VirtualTourSpace;
  /** 3D 화면 캡처(자체 제작 시범 모델) — 카드 썸네일 */
  thumbnail: string;
}

/** 명동대성당 holy_sites.id */
export const MYEONGDONG_SITE_ID = '4b4199cf-2236-4842-8996-38ee9d36e542';

/** 홈 첫 화면에 내세우는 3D — 지금은 명동대성당 한 곳뿐이다 */
export const HOME_VIRTUAL_TOUR: VirtualTour = {
  space: 'cathedral',
  thumbnail: '/images/visit/myeongdong-nave.jpg',
};

const VIRTUAL_TOURS: Readonly<Partial<Record<string, VirtualTour>>> = {
  [MYEONGDONG_SITE_ID]: HOME_VIRTUAL_TOUR,
};

export function virtualTourForSite(siteId: string | undefined): VirtualTour | undefined {
  return siteId ? VIRTUAL_TOURS[siteId] : undefined;
}
