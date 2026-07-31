import React, { useState, useEffect } from 'react';
import { Search, Filter, History, MapPin, Church, Map as MapIcon, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DIOCESES, HolySite, TabType } from '../../types';
import { supabase } from '../../lib/supabase';

interface ExploreTabProps {
  onSelectSite: (id: string) => void;
}

export default function ExploreTab({ onSelectSite }: ExploreTabProps) {
  const [selectedDiocese, setSelectedDiocese] = useState<string | null>(null);
  const [sites, setSites] = useState<HolySite[]>([]);
  const [filter, setFilter] = useState('전체');
  const [loading, setLoading] = useState(false);

  const categories = ['전체', '순교성지', '역사사적지', '주교좌성당', '순례길'];

  useEffect(() => {
    if (selectedDiocese) {
      fetchSitesByDiocese();
    }
  }, [selectedDiocese, filter]);

  async function fetchSitesByDiocese() {
    setLoading(true);
    let query = supabase.from('holy_sites').select('*').eq('diocese', selectedDiocese);

    if (filter !== '전체') {
      query = query.eq('category', filter);
    }

    const { data, error } = await query.order('name');
    if (error) {
      console.error('fetchSitesByDiocese error:', error);
    }
    if (data) {
      setSites(
        data.map((row: any) => ({
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
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="p-8 pb-4">
        <h1 className="text-3xl font-extrabold text-app-text tracking-tight mb-2">탐색</h1>
        <p className="text-app-text-muted text-sm font-medium">전국의 성스러운 자취를 찾아서</p>
      </header>

      {/* Diocese Grid or List */}
      <div className="px-8 py-4">
        {!selectedDiocese ? (
          <div>
            <h3 className="text-[11px] font-bold text-app-text-muted uppercase tracking-widest mb-6">교구별 탐색</h3>
            <div className="grid grid-cols-3 gap-3">
              {DIOCESES.map((diocese) => (
                <button
                  key={diocese}
                  onClick={() => setSelectedDiocese(diocese)}
                  className="aspect-square rounded-[16px] bg-app-bg border border-transparent flex flex-col items-center justify-center gap-2 hover:border-brand-violet hover:text-brand-violet hover:bg-[#F3F0FF] transition-all group"
                  id={`diocese-${diocese}`}
                >
                  <MapPin size={24} className="text-gray-300 group-hover:text-brand-violet group-hover:scale-110 transition-all" />
                  <span className="text-xs font-bold text-app-text-muted group-hover:text-brand-violet">{diocese}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* Back to Diocese selection */}
            <button 
              onClick={() => setSelectedDiocese(null)}
              className="flex items-center gap-2 text-brand-blue font-bold mb-8 text-sm group"
              id="back-to-diocese"
            >
              <ChevronRight size={20} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
              {selectedDiocese} 교구 목록
            </button>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar -mx-8 px-8">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    filter === cat 
                    ? 'bg-brand-blue border-brand-blue text-white shadow-lg shadow-brand-blue/10' 
                    : 'bg-white border-app-border text-app-text-muted hover:border-brand-violet'
                  }`}
                  id={`filter-${cat}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sites List */}
            <div className="space-y-8 mt-2">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-28 bg-app-bg rounded-[24px] animate-pulse" />)
              ) : sites.length > 0 ? (
                sites.map((site) => (
                  <motion.div
                    key={site.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => onSelectSite(site.id)}
                    className="flex gap-5 group cursor-pointer"
                    id={`explore-item-${site.id}`}
                  >
                    <div className="w-24 h-24 rounded-[20px] overflow-hidden flex-shrink-0 shadow-lg shadow-gray-100 bg-app-bg flex items-center justify-center">
                      {site.imageUrl ? (
                        <img src={site.imageUrl} alt={site.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <Church size={28} className="text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center border-b border-app-border pb-5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-extrabold text-brand-violet bg-brand-violet/5 px-2 rounded-lg uppercase tracking-tight">
                          {site.category}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-app-text group-hover:text-brand-blue transition-colors leading-tight mb-1">{site.name}</h4>
                      <p className="text-xs text-app-text-muted truncate w-48 font-medium">{site.location}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-24">
                  <div className="w-20 h-20 bg-app-bg rounded-full flex items-center justify-center mx-auto mb-6">
                    <Church size={32} className="text-gray-300" />
                  </div>
                  <p className="text-app-text-muted text-sm font-medium">아직 등록된 성지가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
