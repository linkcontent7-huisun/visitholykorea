import { ArrowRight, Loader2, MapPin, PartyPopper, Phone, Search, Wind, X } from 'lucide-react';
import { useState } from 'react';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import { Link, useNavigate } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { QuickDirectionsButtons } from '@/features/sites/components/QuickDirectionsButtons';
import { useLocalizedSites, useSiteSearch } from '@/features/sites/hooks/use-sites';
import { useDirectorySearch } from '@/features/sites/hooks/use-nearby-directory';
import { directoryDisplayAddress, directoryDisplayName } from '@/features/sites/lib/nearby-directory';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { localizeDomainValue } from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';

export default function SearchPage() {
  const navigate = useNavigate();
  const { wideView, t, language } = useSettings();
  const widthClass = wideView ? 'max-w-4xl' : 'max-w-lg';

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const { data: resultsRaw = [], isFetching } = useSiteSearch(debouncedQuery);
  const results = useLocalizedSites(resultsRaw);
  // 208곳 성지 밖에서, 전국 본당·공소 주소록(5,918건)도 함께 찾는다(2026-09-07 요청).
  const { data: directoryResults = [] } = useDirectorySearch(debouncedQuery);


  return (
    <div className={`mx-auto flex min-h-page ${widthClass} flex-col bg-white`}>
      <div className="flex h-20 shrink-0 items-center gap-4 border-b border-slate-100 px-6">
        <Search className="text-slate-400" size={24} />
        <input
          autoFocus
          type="search"
          placeholder={t('searchInputPlaceholder')}
          aria-label={t('searchAria')}
          className="flex-1 border-none bg-transparent text-xl font-bold text-slate-900 focus:outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-400 hover:text-slate-900"
          aria-label={t('searchCloseAria')}
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/30 p-6">
        {query.length === 0 ? (
          <div className="mx-auto max-w-prose">
            <div className="py-14 text-center text-slate-300">
              <Search size={48} className="mx-auto mb-4 opacity-10" />
              <p className="font-bold">{t('searchPromptTitle')}</p>
              <p className="mt-2 text-xs">{t('searchPromptBody')}</p>
            </div>

            {/* 처음 온 사람에게 막막하지 않도록, 이미 있는 화면들로 가는 지름길을 준다
                (2026-09-07 피드백 — 새로 지어낸 추천 목록이 아니라 실제 기능으로 연결한다). */}
            <div className="pb-10">
              <h2 className="mb-3 text-[0.625rem] font-black uppercase tracking-widest text-slate-400">
                {t('searchRecommendTitle')}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to={paths.region('서울')}
                  className="flex flex-col items-start gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md"
                >
                  <MapPin size={18} className="text-blue-500" />
                  <span className="text-sm font-bold text-slate-800">
                    {t('searchRecommendSeoul')}
                  </span>
                </Link>
                <Link
                  to={paths.quiet}
                  className="flex flex-col items-start gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md"
                >
                  <Wind size={18} className="text-blue-500" />
                  <span className="text-sm font-bold text-slate-800">
                    {t('searchRecommendAlternatives')}
                  </span>
                </Link>
                <Link
                  to={paths.festivals}
                  className="flex flex-col items-start gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md"
                >
                  <PartyPopper size={18} className="text-blue-500" />
                  <span className="text-sm font-bold text-slate-800">
                    {t('searchRecommendFestival')}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-prose space-y-10">
            {(results.length > 0 || isFetching) && (
              <section className="space-y-4">
                <h2 className="text-[0.625rem] font-black uppercase tracking-widest text-slate-400">
                  {t('searchResults')}
                </h2>
                <div className="space-y-3">
                  {isFetching && results.length === 0 && (
                    <div className="flex items-center justify-center gap-2 py-4 text-slate-300">
                      <Loader2 className="animate-spin" size={16} /> {t('searching')}
                    </div>
                  )}
                  {results.map((site) => (
                    <Link
                      key={site.id}
                      to={paths.siteDetail(site.id)}
                      className="flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50">
                        {/* 사진 없는 성지도 임시 이미지로 — SiteThumbnail 이 처리 (2026-09-12) */}
                        <SiteThumbnail
                          imageUrl={site.imageUrl}
                          name={site.name}
                          category={site.category}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-900">{site.name}</p>
                        <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                          <MapPin size={10} /> {site.location}
                        </p>
                      </div>
                      <ArrowRight size={16} className="text-slate-300" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 208곳 성지에는 없지만 전국 본당·공소 주소록엔 있는 경우 —
                "성당 검색이 안 된다"는 피드백(2026-09-07)에 대한 답.
                아직 개별 홈페이지 데이터가 없어 우리 앱 안에서 주소·전화만 보여준다. */}
            {directoryResults.length > 0 && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-[0.625rem] font-black uppercase tracking-widest text-slate-400">
                    {t('directorySearchResults')}
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                    {t('directorySearchHint')}
                  </p>
                  {/* 로마자 표기가 실제로 쓰이는 화면에서만 — 기계 변환이라는 것을 밝힌다 */}
                  {language !== 'ko' && directoryResults.some((e) => e.nameRomanized) && (
                    <p className="mt-1 text-[0.6875rem] italic text-slate-300">
                      {t('directoryRomanizedNote')}
                    </p>
                  )}
                </div>
                <ul className="space-y-3">
                  {directoryResults.map((entry) => {
                    const displayName = directoryDisplayName(entry, language);
                    const displayAddress = directoryDisplayAddress(entry, language);
                    return (
                    <li
                      key={entry.id}
                      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2">
                            <span className="truncate font-bold text-slate-900">{displayName}</span>
                            <span className="shrink-0 rounded-full bg-slate-50 px-2 py-0.5 text-[0.625rem] font-bold text-slate-400">
                              {localizeDomainValue(entry.category, t)}
                            </span>
                          </p>
                          {displayAddress && (
                            <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-400">
                              <MapPin size={10} className="shrink-0" /> {displayAddress}
                            </p>
                          )}
                        </div>
                        {entry.phone && (
                          <a
                            href={`tel:${entry.phone.replace(/[^0-9+]/g, '')}`}
                            aria-label={`${entry.name} ${t('callPhone')}`}
                            className="flex shrink-0 items-center justify-center rounded-xl bg-slate-50 p-2.5 text-blue-600"
                          >
                            <Phone size={14} />
                          </a>
                        )}
                      </div>
                      {/* 외국인 순례자가 직접 찾아갈 수 있게 — 개별 홈페이지 대신 실제 길찾기로 연결한다 */}
                      {entry.lat != null && entry.lng != null && (
                        <div className="mt-3 border-t border-slate-100 pt-3">
                          <QuickDirectionsButtons
                            destination={{ name: displayName, lat: entry.lat, lng: entry.lng }}
                            siteName={displayName}
                          />
                        </div>
                      )}
                    </li>
                    );
                  })}
                </ul>
              </section>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
