import { ArrowRight, BookOpen, Church, Loader2, MapPin, Search, X } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link, useNavigate } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { askAIGuide } from '@/features/ai-guide/api/ai-guide.client';
import { useSiteSearch } from '@/features/sites/hooks/use-sites';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { useSettings } from '@/shared/i18n/use-settings';

export default function SearchPage() {
  const navigate = useNavigate();
  const { wideView } = useSettings();
  const widthClass = wideView ? 'max-w-4xl' : 'max-w-lg';

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const { data: results = [], isFetching } = useSiteSearch(debouncedQuery);

  const [aiResult, setAiResult] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const handleAiSearch = async () => {
    const term = query.trim();
    if (!term) return;
    setIsLoadingAi(true);
    setAiResult(null);
    setAiResult(await askAIGuide(`"${term}"에 대해 알려줘.`));
    setIsLoadingAi(false);
  };

  return (
    <div className={`mx-auto flex min-h-screen ${widthClass} flex-col bg-white`}>
      <div className="flex h-20 shrink-0 items-center gap-4 border-b border-slate-100 px-6">
        <Search className="text-slate-400" size={24} />
        <input
          autoFocus
          type="search"
          placeholder="성지명, 지역, 성인 검색..."
          aria-label="성지 검색"
          className="flex-1 border-none bg-transparent text-xl font-bold text-slate-900 focus:outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleAiSearch();
          }}
        />
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-400 hover:text-slate-900"
          aria-label="검색 닫기"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/30 p-6">
        {query.length === 0 ? (
          <div className="py-20 text-center text-slate-300">
            <Search size={48} className="mx-auto mb-4 opacity-10" />
            <p className="font-bold">무엇을 찾고 싶으신가요?</p>
            <p className="mt-2 text-xs">성지명, 지역, 소재지로 검색해보세요.</p>
          </div>
        ) : (
          <div className="mx-auto max-w-prose space-y-10">
            {(results.length > 0 || isFetching) && (
              <section className="space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  검색 결과
                </h2>
                <div className="space-y-3">
                  {isFetching && results.length === 0 && (
                    <div className="flex items-center justify-center gap-2 py-4 text-slate-300">
                      <Loader2 className="animate-spin" size={16} /> 검색 중...
                    </div>
                  )}
                  {results.map((site) => (
                    <Link
                      key={site.id}
                      to={paths.siteDetail(site.id)}
                      className="flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50">
                        {site.imageUrl ? (
                          <img
                            src={site.imageUrl}
                            className="h-full w-full object-cover"
                            alt={site.name}
                          />
                        ) : (
                          <Church size={18} className="text-slate-300" />
                        )}
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

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  AI 순례 가이드에게 물어보기
                </h2>
                {isLoadingAi && <Loader2 className="animate-spin text-blue-500" size={16} />}
              </div>

              {!aiResult && !isLoadingAi && (
                <button
                  onClick={() => void handleAiSearch()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-[2rem] bg-gradient-to-r from-blue-600 to-indigo-600 py-6 text-white shadow-xl shadow-blue-100 transition-all active:scale-[0.98]"
                >
                  <BookOpen size={24} />
                  <span className="font-bold">&ldquo;{query}&rdquo;에 대해 AI에게 물어보기</span>
                  <span className="text-[10px] opacity-70">
                    Enter를 누르거나 이 버튼을 눌러보세요
                  </span>
                </button>
              )}

              {aiResult && (
                <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
                  <div className="mb-6 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <BookOpen size={16} />
                    </div>
                    <span className="text-sm font-bold text-slate-800">AI 순례 가이드 미카엘</span>
                  </div>
                  {/* 미카엘의 답변은 마크다운(표·불릿)으로 온다 */}
                  <div className="prose prose-sm text-sm font-light leading-relaxed text-slate-600 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-2 [&_strong]:font-bold [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc [&_ul]:pl-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResult}</ReactMarkdown>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
