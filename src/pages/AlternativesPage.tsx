import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X } from 'lucide-react';
import { paths } from '@/app/routes/paths';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { useSites } from '@/features/sites/hooks/use-sites';
import { useAlternatives, useAttractionSearch } from '@/features/quiet/api/use-alternatives';
import { AlternativesList } from '@/features/quiet/components/AlternativesList';
import type { TourApiSpot } from '@/shared/api/tour-api';

/**
 * "붐비면, 대신 여기" — 관광지를 붐빔 기준으로 성지와 바꿔주는 화면.
 *
 * 이 앱의 출발 질문이 여기에 있다. 유명 관광지에 사람이 몰릴 때 반경 20km 안에서
 * 더 조용한 성지를 찾아 준다. 붐빔은 한국관광공사 TourAPI 의 **오늘 열리는 축제**와
 * **주변 관광 인프라 밀도**로 그때그때 계산한다(저장하지 않는다).
 *
 * 검색과 추천을 두 단계로 나눈 이유는 `use-alternatives.ts` 주석에 있다 —
 * "명동"으로 검색하면 명동성당·명동거리·명동예술극장이 모두 잡히기 때문이다.
 */
export default function AlternativesPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<TourApiSpot | null>(null);

  const { data: candidates = [], isFetching: isSearching } = useAttractionSearch(keyword);
  // 대체지는 좌표가 있어야 거리를 잴 수 있다. 전체를 받아 훅 안에서 걸러 쓴다.
  const { data: sites = [], isLoading: isSitesLoading } = useSites({ limit: 500 });
  const {
    data: result,
    isFetching: isRanking,
    isError,
  } = useAlternatives(selected, sites);

  const showCandidates = keyword.trim().length >= 2 && !selected;

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-white pb-16">
      <header className="p-8 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1 text-sm font-bold text-app-text-muted"
          aria-label="뒤로 가기"
        >
          <ArrowLeft size={18} /> 뒤로
        </button>
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-app-text">
          붐비면, 대신 여기
        </h1>
        <p className="text-sm font-medium leading-relaxed text-app-text-muted">
          가려던 관광지가 붐빈다면, 근처에서 더 조용한 성지를 찾아드려요
        </p>
      </header>

      {/* 1단계 — 관광지 검색 */}
      <div className="px-8 py-2">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-app-text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setSelected(null);
            }}
            placeholder="관광지 이름 (예: 경복궁, 해운대)"
            aria-label="관광지 이름으로 검색"
            className="w-full rounded-[20px] border border-app-border bg-app-bg py-4 pl-12 pr-12 text-sm font-bold text-app-text outline-none transition-all placeholder:font-medium placeholder:text-app-text-muted focus:ring-2 focus:ring-brand-violet/20"
          />
          {keyword && (
            <button
              onClick={() => {
                setKeyword('');
                setSelected(null);
              }}
              aria-label="검색어 지우기"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-app-text-muted hover:bg-app-bg"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {keyword.trim().length === 1 && (
          <p className="mt-2 pl-2 text-xs font-medium text-app-text-muted">
            두 글자 이상 입력해 주세요
          </p>
        )}
      </div>

      <div className="px-8 py-4">
        {/* 후보 목록 — 어느 곳을 말하는지 사용자가 고른다 */}
        {showCandidates && (
          <>
            {isSearching && <LoadingSpinner label="관광지를 찾는 중" />}
            {!isSearching && candidates.length === 0 && (
              <p className="rounded-[20px] bg-app-bg p-6 text-center text-sm font-medium text-app-text-muted">
                “{keyword.trim()}” 으로 찾은 관광지가 없어요.
                <br />
                다른 이름으로 검색해 보세요.
              </p>
            )}
            {!isSearching && candidates.length > 0 && (
              <ul className="flex flex-col gap-2">
                {candidates.map((spot) => (
                  <li key={spot.contentid}>
                    <button
                      onClick={() => setSelected(spot)}
                      className="w-full rounded-[16px] border border-gray-100 bg-app-bg p-4 text-left transition-all hover:border-brand-violet hover:bg-[#F3F0FF]"
                    >
                      <p className="text-sm font-extrabold text-app-text">{spot.title}</p>
                      {spot.addr1 && (
                        <p className="mt-1 text-xs font-medium text-app-text-muted">{spot.addr1}</p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* 2단계 — 고른 곳의 붐빔과 대체 성지 */}
        {selected && (
          <>
            <button
              onClick={() => setSelected(null)}
              className="mb-4 text-sm font-bold text-brand-violet"
            >
              ← 다른 관광지 고르기
            </button>

            {(isRanking || isSitesLoading) && (
              <LoadingSpinner label="오늘 얼마나 붐비는지 확인하는 중" />
            )}

            {isError && (
              <p className="rounded-[20px] bg-app-bg p-6 text-center text-sm font-medium text-app-text-muted">
                지금은 관광 정보를 불러올 수 없어요.
                <br />
                잠시 뒤에 다시 시도해 주세요.
              </p>
            )}

            {result && !isRanking && (
              <AlternativesList
                origin={result.origin}
                picks={result.picks}
                relaxed={result.relaxed}
              />
            )}
          </>
        )}

        {/* 아무것도 안 한 상태 — 무엇을 하는 화면인지 알려준다 */}
        {!showCandidates && !selected && (
          <div className="rounded-[20px] bg-app-bg p-6">
            <p className="mb-3 text-sm font-bold text-app-text">이렇게 써 보세요</p>
            <ol className="flex flex-col gap-2 text-sm font-medium leading-relaxed text-app-text-muted">
              <li>1. 가려던 관광지 이름을 검색합니다</li>
              <li>2. 목록에서 그곳을 고릅니다</li>
              <li>3. 오늘의 붐빔과, 근처의 더 조용한 성지를 보여드려요</li>
            </ol>
            <p className="mt-4 border-t border-app-border pt-3 text-xs font-medium leading-relaxed text-app-text-muted">
              붐빔은 한국관광공사 TourAPI 의 오늘 열리는 축제와 주변 관광 시설 밀도로
              추정한 값입니다. 공사 데이터에는 실시간 혼잡도가 없어 실제와 다를 수 있어요.
            </p>
          </div>
        )}
      </div>

      <div className="px-8 pt-2">
        <button
          onClick={() => navigate(paths.map)}
          className="text-sm font-bold text-app-text-muted underline"
        >
          지도에서 전국 성지 보기
        </button>
      </div>
    </div>
  );
}
