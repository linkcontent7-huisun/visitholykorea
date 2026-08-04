import { Footprints } from 'lucide-react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import type { CourseCard } from '../api/course-matching';

/** "쉼표 순례길" 피드에 노출되는 코스 카드. */
export function CourseCardItem({ course }: { course: CourseCard }) {
  const tags = [course.site.emotionTag, course.site.region, course.site.category].filter(
    (tag): tag is string => Boolean(tag),
  );

  return (
    <Link
      to={paths.siteDetail(course.site.id)}
      className="group block overflow-hidden rounded-[24px] border border-app-border bg-white shadow-sm"
      id={`course-${course.site.id}`}
    >
      <div className="relative flex h-48 items-center justify-center overflow-hidden bg-app-bg">
        <SiteThumbnail
          imageUrl={course.site.imageUrl}
          name={course.site.name}
          emojiSizeClass="text-5xl"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {course.walkMinutes != null && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-brand-blue shadow-sm backdrop-blur-sm">
            <Footprints size={12} /> 도보 {course.walkMinutes}분
          </div>
        )}
      </div>
      <div className="p-5">
        <h4 className="mb-2 text-[15px] font-extrabold leading-snug text-app-text">
          {course.title}
        </h4>
        <p className="mb-3 text-[12px] leading-relaxed text-app-text-muted">{course.subtitle}</p>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-app-bg px-2.5 py-1 text-[10px] font-bold text-app-text-muted"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
