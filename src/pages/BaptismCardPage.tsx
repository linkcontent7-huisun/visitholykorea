import { MousePointerClick } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { BAPTISM_NAMES } from '@/features/baptism-card/data/baptism-names';
import { cardImageUrl } from '@/features/baptism-card/lib/card-image';
import { DICTIONARY, fillPlaceholders, isLanguage } from '@/shared/i18n/dictionary';

/**
 * 공유받은 세례명 카드 한 장 (`/card/:language/:slug`).
 *
 * 메시지로 카드 주소를 받은 사람이 여기로 들어온다. 카드 그림 아래쪽에는 원래 사이트 주소가
 * 인쇄돼 있는데, 그 자리에 **누를 수 있는 버튼**을 겹쳐 놓아 한눈에 보이게 했다 —
 * 그림 파일만 보내면 받은 사람이 우리 사이트로 올 길이 없다는 사장님 지적(2026-11-11).
 *
 * 글은 받는 사람의 앱 언어가 아니라 **카드의 언어**(주소에 든 언어)를 따른다 — 카드와 버튼의 말이 같아야 한다.
 * 없는 언어·없는 카드 주소는 홈으로 보낸다.
 */
export default function BaptismCardPage() {
  const { language, slug } = useParams();
  const card = BAPTISM_NAMES.find((n) => n.slug === slug);
  if (!isLanguage(language) || !card) return <Navigate to={paths.home} replace />;

  const name = card.names[language];
  const alt = fillPlaceholders(DICTIONARY.baptismCardAlt[language], { name });

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#1f2d57] px-4 py-6">
      <h1 className="sr-only">{alt}</h1>
      <div className="relative w-full max-w-[28rem]">
        <img
          src={cardImageUrl(language, card.slug)}
          alt={alt}
          width={1080}
          height={1350}
          className="h-auto w-full rounded-lg"
        />
        {/* 카드에 인쇄된 「visitholykorea.com」 자리(아래에서 5.5%~16%)를 버튼으로 덮는다 */}
        <a
          href={paths.home}
          id="baptism-card-visit"
          className="absolute inset-x-[9%] bottom-[5.5%] flex h-[10.5%] items-center justify-center gap-[0.4em] whitespace-nowrap rounded-full bg-amber-400 px-3 text-[clamp(0.7rem,3.7vw,1.1rem)] font-extrabold text-[#1f2d57] shadow-lg ring-2 ring-white/80 transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
        >
          <MousePointerClick className="h-[1.2em] w-[1.2em] shrink-0" aria-hidden />
          {DICTIONARY.baptismCardVisit[language]}
        </a>
      </div>
    </main>
  );
}
