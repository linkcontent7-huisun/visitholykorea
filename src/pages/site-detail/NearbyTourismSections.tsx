import { Compass } from 'lucide-react';
import { WalkingCourseCard } from '@/features/sites/components/WalkingCourseCard';
import { useNearbyFacilities } from '@/features/sites/hooks/use-nearby-tour';
import { useWalkingCoursesNear } from '@/features/sites/hooks/use-tour-extras';
import { GROUP_LABEL_KEY } from '@/features/sites/lib/nearby-facilities';
import { ScrollHintRow } from '@/shared/components/ui/ScrollHintRow';
import { SectionHeading } from '@/shared/components/ui/SectionHeading';
import { SquircleSurface } from '@/shared/components/ui/SquircleSurface';
import { useSettings } from '@/shared/i18n/use-settings';
import { kakaoDirectionsUrl } from '@/shared/lib/geo';
import type { HolySite } from '@/shared/types/domain';

/** 가는 김에 둘러볼 곳 — 레포츠·쇼핑은 도보권 밖으로 벗어나는 유형이라 뺀다(사장님 지적, 2026-09-17) */
const HIDDEN_FACILITY_GROUPS = new Set(['레포츠', '쇼핑']);

/**
 * 「둘러볼 곳」(TourAPI 편의시설)과 근처 걷기길 (#102 에서 페이지에서 떼어 냄).
 * 페이지의 space-y 간격을 그대로 받도록 감싸는 요소 없이 형제 노드로 돌려준다.
 */
export function NearbyTourismSections({ site }: { site: HolySite }) {
  const { t } = useSettings();
  const {
    data: facilityGroupsRaw = [],
    isFetching: facilitiesLoading,
    isError: facilitiesError,
  } = useNearbyFacilities(site.coordinates);
  const facilityGroups = facilityGroupsRaw.filter((g) => !HIDDEN_FACILITY_GROUPS.has(g.group));
  const { data: walkingCourses = [] } = useWalkingCoursesNear(site);

  return (
    <>
      {/* 「주변 정보」 절은 「둘러볼 곳」(TourAPI 편의시설)과 장소 기준 걷기길만 남긴다.
            성지가 알려주는 주변(DB 큐레이션)과 근처 행사(TourAPI)는 화면에서 뺐다. */}
      {!facilitiesLoading && !facilitiesError && facilityGroups.length === 0 && (
        <SquircleSurface
          as="p"
          borderColor="var(--color-app-border)"
          borderDashed
          className="bg-white p-5 text-base text-app-text-muted"
        >
          {t('siteNearbyTourismEmpty')}
        </SquircleSurface>
      )}

      {/*
          주변 편의시설 — 맛집·숙박·볼거리를 한 화면에서 본다(관광공사 유형 그대로, 레포츠·쇼핑은 뺐다).
          TourAPI 를 한 번만 부르고 유형으로 나눈다(저장하지 않는다).
          빈 유형은 아예 그리지 않는다 — 시골 성지의 빈 탭은 정보가 없는 앱으로 보인다.
        */}
      {(facilitiesLoading || facilityGroups.length > 0) && (
        <section>
          <SectionHeading title={t('siteNearbyTitle')} />

          {facilitiesLoading ? (
            <div className="no-scrollbar -mx-3 flex gap-4 overflow-x-auto px-3 lg:-mx-5 lg:px-5">
              {[1, 2, 3].map((i) => (
                <SquircleSurface
                  key={i}
                  className="h-64 w-44 flex-shrink-0 animate-pulse bg-app-bg"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {facilityGroups.map(({ group, spots }) => (
                <div key={group}>
                  <h3 className="mb-3 text-lg font-bold text-app-text">
                    {t(GROUP_LABEL_KEY[group])}
                  </h3>
                  <ScrollHintRow className="-mx-3 flex gap-4 px-3 lg:-mx-5 lg:px-5">
                    {spots.map((spot) => (
                      <SquircleSurface
                        as="a"
                        key={spot.contentid}
                        // 이름 검색은 정확한 장소로 안 이어질 때가 있었다(사장님 지적,
                        // 2026-09-17) — 좌표가 있으니 길찾기로 보낸다. 목적지가 곧 정답이다.
                        href={kakaoDirectionsUrl(spot.title, Number(spot.mapy), Number(spot.mapx))}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={`${spot.title} 길찾기`}
                        borderColor="var(--color-app-border)"
                        borderClassName="transition-colors group-hover:stroke-brand-blue"
                        className="group w-44 flex-shrink-0 overflow-hidden bg-white text-left"
                      >
                        <div className="relative flex h-36 items-center justify-center overflow-hidden bg-app-panel">
                          {spot.firstimage ? (
                            <img
                              src={spot.firstimage}
                              alt={spot.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <Compass
                              size={28}
                              className="text-app-text-muted opacity-30"
                              aria-hidden
                            />
                          )}
                        </div>
                        <div className="p-4">
                          <h4 className="truncate text-base font-bold text-app-text group-hover:text-brand-blue">
                            {spot.title}
                          </h4>
                        </div>
                      </SquircleSurface>
                    ))}
                  </ScrollHintRow>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 장소를 기준으로 찾은 결과만 보여준다 — 근처에 걷기길이 없으면 빈 영역도 만들지 않는다. */}
      {walkingCourses.length > 0 && (
        <section>
          <SectionHeading title={t('routeNearbyTrails')} />
          <div className="space-y-3">
            {walkingCourses.slice(0, 3).map((course, index) => (
              <WalkingCourseCard key={course.crsIdx ?? index} course={course} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
