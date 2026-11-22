import type { WalkingCourse } from '@/shared/api/tour-api';
import { useSettings } from '@/shared/i18n/use-settings';
import { plainCourseSummary } from '../lib/course-summary';

/**
 * 두루누비 걷기길 한 장 — 장소 상세에서 근처 걷기길을 보여줄 때 쓴다 (T-020).
 * 실제 응답 필드는 crsKorNm·crsDstnc(km)·crsTotlRqrmHour(분)·crsLevel(1~3) 이다.
 * 두루누비에 코스별 고정 주소가 없어 링크는 걸지 않는다 — 이름으로 두루누비에서 찾게 안내만.
 */
export function WalkingCourseCard({ course }: { course: WalkingCourse }) {
  const { t, language } = useSettings();
  // 설명은 두루누비 한국어 원문뿐이라, 외국어 화면에서는 보이지 않는다(코스 이름·거리·시간은 그대로)
  const summary =
    language === 'ko' && course.crsSummary ? plainCourseSummary(course.crsSummary) : '';
  const minutes = Number(course.crsTotlRqrmHour);
  const time =
    Number.isFinite(minutes) && minutes > 0
      ? t('walkingCourseTime')
          .replace('{h}', String(Math.floor(minutes / 60)))
          .replace('{m}', String(minutes % 60))
      : null;
  const level = {
    '1': t('walkingLevelEasy'),
    '2': t('walkingLevelNormal'),
    '3': t('walkingLevelHard'),
  }[course.crsLevel ?? ''];
  const meta = [course.crsDstnc ? `${course.crsDstnc}km` : null, time, level]
    .filter(Boolean)
    .join(' · ');
  return (
    <div className="rounded-lg border border-app-border bg-app-bg p-5">
      <p className="text-base font-bold text-app-text">{course.crsKorNm}</p>
      {meta && <p className="mt-1 text-sm text-app-text-muted">{meta}</p>}
      {summary && (
        <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-app-text-muted">
          {summary}
        </p>
      )}
      <p className="mt-2 text-xs font-bold text-app-text-muted">{t('walkingCourseSource')}</p>
    </div>
  );
}
