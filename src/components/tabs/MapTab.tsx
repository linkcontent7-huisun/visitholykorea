import React, { useState, useEffect, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { HolySite } from '../../types';
import { supabase } from '../../lib/supabase';

interface MapTabProps {
  onSelectSite: (id: string) => void;
}

export default function MapTab({ onSelectSite }: MapTabProps) {
  const [sites, setSites] = useState<HolySite[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDiocese, setActiveDiocese] = useState<string>('전체');

  useEffect(() => {
    async function fetchSites() {
      const { data, error } = await supabase.from('holy_sites').select('*').order('diocese');
      if (error) console.error('MapTab fetchSites error:', error);
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
    fetchSites();
  }, []);

  const dioceses = useMemo(() => {
    const set = new Set(sites.map((s) => s.region).filter(Boolean));
    return ['전체', ...Array.from(set).sort()];
  }, [sites]);

  const filtered = activeDiocese === '전체' ? sites : sites.filter((s) => s.region === activeDiocese);

  return (
    <div className="pb-20 bg-app-bg min-h-screen">
      <header className="px-8 py-5 sticky top-0 bg-white/90 backdrop-blur-md z-40 border-b border-app-border">
        <h1 className="text-xl font-extrabold tracking-tight text-app-text">교구별 성지 지도</h1>
        <p className="text-[12px] text-app-text-muted mt-1">교구를 선택해서 순례지를 둘러보세요</p>
      </header>

      <div className="flex gap-2 overflow-x-auto px-6 py-4 no-scrollbar">
        {dioceses.map((d) => (
          <button
            key={d}
            onClick={() => setActiveDiocese(d)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-bold transition-colors ${
              activeDiocese === d ? 'bg-brand-blue text-white' : 'bg-white text-app-text-muted border border-app-border'
            }`}
            id={`diocese-filter-${d}`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="px-6 space-y-3">
        {loading ? (
          [1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)
        ) : filtered.length > 0 ? (
          filtered.map((site) => (
            <button
              key={site.id}
              onClick={() => onSelectSite(site.id)}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-app-border text-left"
              id={`map-site-${site.id}`}
            >
              <div className="w-12 h-12 rounded-xl bg-app-bg flex items-center justify-center shrink-0 overflow-hidden">
                {site.imageUrl ? (
                  <img src={site.imageUrl} alt={site.name} className="w-full h-full object-cover" />
                ) : (
                  <MapPin size={20} className="text-brand-violet" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-app-text text-sm truncate">{site.name}</h4>
                <p className="text-[11px] text-app-text-muted truncate mt-0.5">{site.location}</p>
              </div>
              <span className="text-[10px] font-bold text-brand-blue bg-brand-blue/10 px-2 py-1 rounded-full shrink-0">
                {site.category}
              </span>
            </button>
          ))
        ) : (
          <p className="text-center text-app-text-muted text-sm py-16">이 교구에는 등록된 성지가 없어요.</p>
        )}
      </div>
    </div>
  );
}
