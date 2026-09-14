import { useNavigate } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { HealingQuiz } from '@/features/courses/components/HealingQuiz';

/**
 * "마음 나침반" — 여덟 가지 질문으로 지금 마음에 맞는 성지 한 곳을 찾아주는 화면.
 * 헤더·하단 탭이 있는 AppLayout 안에서 뜬다 — 전체 화면으로 두었더니 "새 창이 떴다"고
 * 느끼고 되돌아가지 못하는 사용자가 있었다 (T-021).
 */
export default function CompassPage() {
  const navigate = useNavigate();

  return (
    <HealingQuiz
      isOpen
      onClose={() => navigate(-1)}
      // 코스를 고르면 상세의 「찾아가는 길」(지도 앱 길찾기)로 바로 연다.
      // replace: 뒤로가기가 나침반 질문으로 되돌아가지 않게 한다.
      onSelectSite={(id) => navigate(`${paths.siteDetail(id)}#directions`, { replace: true })}
    />
  );
}
