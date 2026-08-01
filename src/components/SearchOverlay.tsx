import React, { useState, useEffect } from 'react';
import { Search, X, ArrowRight, Loader2, BookOpen, MapPin, Church } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../lib/supabase';
import { HolySite } from '../types';
import { askAIGuide } from '../services/geminiService';
import { useSettings } from '../contexts/SettingsContext';

interface SearchOverlayProps {
  onClose: () => void;
  onSiteClick: (siteId: string) => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ onClose, onSiteClick }) => {
  const { wideView } = useSettings();
  const widthClass = wideView ? 'max-w-4xl' : 'max-w-lg';
  const [query, setQuery] = useState('');
  const [localResults, setLocalResults] = useState<HolySite[]>([]);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isSearchingDb, setIsSearchingDb] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setLocalResults([]);
      setAiResult(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearchingDb(true);
      const { data, error } = await supabase
        .from('holy_sites')
        .select('*')
        .or(`name.ilike.%${trimmed}%,location.ilike.%${trimmed}%`)
        .limit(8);
      setIsSearchingDb(false);
      if (error) {
        console.error('search error:', error);
        return;
      }
      setLocalResults(
        (data ?? []).map((row: any) => ({
          id: row.id,
          name: row.name,
          category: row.category,
          location: row.location,
          description: row.description,
          imageUrl: row.image_url,
          history: row.history,
          coordinates: { lat: row.lat, lng: row.lng },
          region: row.diocese,
        })),
      );
    }, 300); // 디바운스

    return () => clearTimeout(timeout);
  }, [query]);

  const handleAiSearch = async () => {
    if (!query.trim()) return;
    setIsLoadingAi(true);
    setAiResult(null);
    const result = await askAIGuide(`"${query}"에 대해 알려줘.`);
    setAiResult(result ?? null);
    setIsLoadingAi(false);
  };

  return (
    <div className={`fixed inset-y-0 left-1/2 -translate-x-1/2 w-full ${widthClass} z-[300] bg-white animate-in slide-in-from-top duration-300 flex flex-col`}>
      <div className="h-20 flex items-center px-6 gap-4 border-b border-slate-100 shrink-0">
        <Search className="text-slate-400" size={24} />
        <input
          autoFocus
          type="text"
          placeholder="성지명, 지역, 성인 검색..."
          className="flex-1 bg-transparent border-none focus:outline-none text-xl font-bold text-slate-900"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
        />
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/30 p-6">
        {query.length === 0 ? (
          <div className="text-center py-20 text-slate-300">
            <Search size={48} className="mx-auto mb-4 opacity-10" />
            <p className="font-bold">무엇을 찾고 싶으신가요?</p>
            <p className="text-xs mt-2">성지명, 지역, 소재지로 검색해보세요.</p>
          </div>
        ) : (
          <div className="max-w-prose mx-auto space-y-10">
            {(localResults.length > 0 || isSearchingDb) && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">검색 결과</h4>
                <div className="space-y-3">
                  {isSearchingDb && localResults.length === 0 && (
                    <div className="flex items-center gap-2 text-slate-300 py-4 justify-center">
                      <Loader2 className="animate-spin" size={16} /> 검색 중...
                    </div>
                  )}
                  {localResults.map((site) => (
                    <button
                      key={site.id}
                      onClick={() => {
                        onSiteClick(site.id);
                        onClose();
                      }}
                      className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-left"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center">
                        {site.imageUrl ? (
                          <img src={site.imageUrl} className="w-full h-full object-cover" alt={site.name} />
                        ) : (
                          <Church size={18} className="text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">{site.name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin size={10} /> {site.location}
                        </p>
                      </div>
                      <ArrowRight size={16} className="text-slate-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI 순례 가이드에게 물어보기</h4>
                {isLoadingAi && <Loader2 className="animate-spin text-blue-500" size={16} />}
              </div>

              {!aiResult && !isLoadingAi && (
                <button
                  onClick={handleAiSearch}
                  className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] text-white flex flex-col items-center justify-center gap-2 shadow-xl shadow-blue-100 active:scale-[0.98] transition-all"
                >
                  <BookOpen size={24} />
                  <span className="font-bold">"{query}"에 대해 AI에게 물어보기</span>
                  <span className="text-[10px] opacity-70">Enter를 누르거나 이 버튼을 눌러보세요</span>
                </button>
              )}

              {aiResult && (
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                      <BookOpen size={16} />
                    </div>
                    <span className="text-sm font-bold text-slate-800">AI 순례 가이드 미카엘</span>
                  </div>
                  <div className="markdown-chat prose prose-sm text-slate-600 leading-relaxed font-light [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-2 [&_strong]:font-bold">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResult}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;
