import { useNavigate } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { HealingQuiz } from '@/features/courses/components/HealingQuiz';

/**
 * "마음 나침반" — 일곱 가지 질문으로 지금 마음에 맞는 성지 한 곳을 찾아주는 화면.
 * 전체 화면을 쓰기 때문에 하단 탭 없이 독립 라우트로 둔다.
 */
export default function CompassPage() {
  const navigate = useNavigate();

  return (
    <HealingQuiz
      isOpen
      onClose={() => navigate(-1)}
      onSelectSite={(id) => navigate(paths.siteDetail(id))}
    />
  );
}
