import React, { useState, useEffect } from 'react';
import { ChevronLeft, MapPin, Share2, Heart, Navigation, History, Stamp, Check, Compass } from 'lucide-react';
import { motion } from 'motion/react';
import { HolySite } from '../types';
import { supabase } from '../lib/supabase';
import { addStamp, hasStamp } from '../services/pilgrimageService';
import { getNearbyAttractions, TourApiSpot } from '../services/tourApiService';
import { useSettings } from '../contexts/SettingsContext';

interface SiteDetailProps {
  siteId: string;
  onBack: () => void;
  onSelectSite: (id: string) => void;
}

export default function SiteDetail({ siteId, onBack, onSelectSite }: SiteDetailProps) {
  const { wideView } = useSettings();
  const widthClass = wideView ? 'max-w-4xl' : 'max-w-lg';
  const [site, setSite] = useState<HolySite | null>(null);
  const [loading, setLoading] = useState(true);
  const [stamped, setStamped] = useState(false);
  const [stampLoading, setStampLoading] = useState(false);
  const [nearbySites, setNearbySites] = useState<HolySite[]>([]);
  const [nearbyAttractions, setNearbyAttractions] = useState<TourApiSpot[]>([]);
  const [attractionsLoading, setAttractionsLoading] = useState(false);

  useEffect(() => {
    async function fetchSite() {
      const { data, error } = await supabase.from('holy_sites').select('*').eq('id', siteId).single();
      if (error) console.error('fetchSite error:', error);
      if (data) {
        setSite({
          id: data.id,
          name: data.name,
          category: data.category,
          location: data.location,
          description: data.description,
          imageUrl: data.image_url,
          history: data.history,
          coordinates: { lat: data.lat, lng: data.lng },
          region: data.diocese ?? data.region_province,
          emotionTag: data.emotion_tag,
          seoTitle: data.seo_title,
          seoDescription: data.seo_description,
          nearbyAttractions: data.nearby_attractions,
          nearbyLodging: data.nearby_lodging,
        });

        if (data.diocese) {
          const { data: nearbyRows } = await supabase
            .from('holy_sites')
            .select('*')
            .eq('diocese', data.diocese)
            .neq('id', siteId)
            .limit(6);
          if (nearbyRows) {
            setNearbySites(
              nearbyRows.map((row: any) => ({
                id: row.id,
                name: row.name,
                category: row.category,
                location: row.location,
                description: row.description,
                imageUrl: row.image_url,
                history: row.history,
                coordinates: { lat: row.lat, lng: row.lng },
                region: row.diocese,
                emotionTag: row.emotion_tag,
              })),
            );
          }
        }
      }
      setLoading(false);
    }
    fetchSite();
    hasStamp(siteId).then(setStamped);
  }, [siteId]);

  useEffect(() => {
    const { lat, lng } = site?.coordinates ?? {};
    if (lat == null || lng == null) {
      setNearbyAttractions([]);
      return;
    }
    let cancelled = false;
    setAttractionsLoading(true);
    getNearbyAttractions(lng, lat, 3000, 8)
      .then((spots) => {
        if (!cancelled) setNearbyAttractions(spots);
      })
      .catch((err) => {
        console.error('getNearbyAttractions error:', err);
        if (!cancelled) setNearbyAttractions([]);
      })
      .finally(() => {
        if (!cancelled) setAttractionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [site?.coordinates.lat, site?.coordinates.lng]);

  const handleStamp = async () => {
    setStampLoading(true);
    const result = await addStamp(siteId);
    setStampLoading(false);
    if (result.success) {
      setStamped(true);
    } else {
      alert(result.error === '로그인이 필요합니다.' ? '스탬프를 찍으려면 로그인이 필요해요.' : '스탬프 저장에 실패했어요.');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
       <div className="w-12 h-12 border-4 border-brand-violet border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  if (!site) return <div className="p-10 text-center font-bold font-sans">성지를 찾을 수 없습니다.</div>;

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Hero Header */}
      <div className="relative h-[55vh] w-full overflow-hidden bg-app-bg flex items-center justify-center">
        {site.imageUrl ? (
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10 }}
            src={site.imageUrl}
            alt={site.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-8xl opacity-30">⛪</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
        
        <button 
          onClick={onBack}
          className="absolute top-12 left-6 w-11 h-11 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all shadow-xl"
          id="back-button"
        >
          <ChevronLeft size={22} />
        </button>

        <div className="absolute top-12 right-6 flex gap-3">
          <button className="w-11 h-11 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all shadow-xl">
            <Heart size={20} />
          </button>
          <button className="w-11 h-11 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all shadow-xl">
            <Share2 size={20} />
          </button>
        </div>

        <div className="absolute bottom-12 left-8 right-8 text-white">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-3"
          >
            <span className="px-3 py-1.5 bg-brand-violet rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-xl shadow-brand-violet/20">
              {site.category}
            </span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold tracking-tight mb-4 leading-tight"
          >
            {site.name}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 text-sm font-medium opacity-90 mb-4"
          >
            <MapPin size={16} className="text-brand-violet" />
            {site.location}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2"
          >
            {[site.emotionTag, site.region, site.category].filter(Boolean).map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-white/15 backdrop-blur-md border border-white/20 rounded-full text-[11px] font-bold"
              >
                #{tag}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-8 -mt-8 bg-white rounded-t-[40px] relative z-10 space-y-12">
        {/* About Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-brand-violet rounded-full" />
            <h3 className="text-xl font-extrabold text-app-text tracking-tight">기본 정보</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-app-bg p-5 rounded-[28px] border border-app-border">
                <div className="text-[10px] font-extrabold text-app-text-muted mb-2 uppercase tracking-widest">주소</div>
                <p className="text-xs font-bold text-app-text leading-relaxed">
                   {site.location}
                </p>
             </div>
             <div className="bg-app-bg p-5 rounded-[28px] border border-app-border">
                <div className="text-[10px] font-extrabold text-app-text-muted mb-2 uppercase tracking-widest">교구 / 감성 태그</div>
                <p className="text-xs font-bold text-app-text">
                   {site.region} {site.emotionTag ? `· ${site.emotionTag}` : ''}
                </p>
             </div>
          </div>
        </section>

        {/* Narrative Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-brand-violet rounded-full" />
            <h3 className="text-xl font-extrabold text-app-text tracking-tight">성지 이야기</h3>
          </div>
          <div className="space-y-10">
            <div className="p-8 bg-brand-blue/[0.03] rounded-[40px] border border-brand-blue/5 relative overflow-hidden">
               <History size={100} className="absolute -bottom-6 -right-6 text-brand-blue/5 rotate-12" />
               <p className="text-lg font-bold text-brand-blue/90 mb-6 tracking-tight leading-snug relative z-10 italic">
                  "{site.description}"
               </p>
               <p className="text-app-text-muted text-[15px] leading-relaxed font-medium relative z-10">
                  {site.history}
               </p>
            </div>
          </div>
        </section>

        {/* Nearby Attractions (TourAPI 실시간) */}
        {(attractionsLoading || nearbyAttractions.length > 0) && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-brand-violet rounded-full" />
              <h3 className="text-xl font-extrabold text-app-text tracking-tight">주변 정보</h3>
              <span className="text-[10px] font-bold text-app-text-muted">실시간 · 한국관광공사</span>
            </div>
            {attractionsLoading ? (
              <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-8 px-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex-shrink-0 w-44 h-64 rounded-[32px] bg-app-bg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-8 px-8">
                {nearbyAttractions.map((spot) => (
                  <div
                    key={spot.contentid}
                    className="flex-shrink-0 w-44 rounded-[32px] overflow-hidden bg-white border border-app-border shadow-sm text-left"
                  >
                    <div className="h-40 overflow-hidden relative bg-app-bg flex items-center justify-center">
                      {spot.firstimage ? (
                        <img src={spot.firstimage} alt={spot.title} className="w-full h-full object-cover" />
                      ) : (
                        <Compass size={28} className="text-app-text-muted opacity-30" />
                      )}
                      {spot.dist && (
                        <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[9px] font-extrabold text-brand-violet">
                          {Math.round(Number(spot.dist))}m
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h4 className="font-extrabold text-sm text-app-text mb-1 truncate">{spot.title}</h4>
                      <p className="text-[10px] text-app-text-muted font-bold truncate">{spot.addr1}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Action Grid */}
        <div className="flex gap-4">
          <button
            onClick={handleStamp}
            disabled={stamped || stampLoading}
            className={`flex-1 py-5 rounded-[24px] font-extrabold text-sm shadow-2xl flex items-center justify-center gap-2 transition-all ${
              stamped
                ? 'bg-emerald-50 text-emerald-600 shadow-none border border-emerald-200'
                : 'bg-brand-blue text-white shadow-brand-blue/20 hover:bg-brand-blue/90'
            }`}
            id="stamp-button"
          >
            {stamped ? <Check size={20} /> : <Stamp size={20} />}
            {stampLoading ? '기록하는 중...' : stamped ? '순례 스탬프 완료' : '순례 스탬프 찍기'}
          </button>
          <button className="w-16 h-16 bg-white border border-app-border rounded-[24px] flex items-center justify-center text-app-text-muted hover:text-brand-violet hover:border-brand-violet transition-all shadow-sm">
            <Navigation size={24} />
          </button>
        </div>

        {/* Nearby Sites */}
        {nearbySites.length > 0 && (
          <section className="pb-10">
             <h3 className="text-xl font-extrabold text-app-text mb-8 tracking-tight flex items-center gap-3">
               <div className="w-1.5 h-6 bg-brand-violet rounded-full" />
               {site.region} 교구의 다른 성지
             </h3>
             <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-8 px-8">
                {nearbySites.map(nearby => (
                  <button
                    key={nearby.id}
                    onClick={() => onSelectSite(nearby.id)}
                    className="flex-shrink-0 w-44 rounded-[32px] overflow-hidden bg-white border border-app-border group shadow-sm text-left"
                    id={`nearby-${nearby.id}`}
                  >
                     <div className="h-40 overflow-hidden relative bg-app-bg flex items-center justify-center">
                       {nearby.imageUrl ? (
                         <img
                            src={nearby.imageUrl}
                            alt={nearby.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                       ) : (
                         <span className="text-4xl opacity-30">⛪</span>
                       )}
                        <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[9px] font-extrabold text-brand-violet">{nearby.category}</div>
                     </div>
                     <div className="p-5">
                        <h4 className="font-extrabold text-sm text-app-text mb-1 truncate">{nearby.name}</h4>
                        <p className="text-[10px] text-app-text-muted font-bold truncate">{nearby.location}</p>
                     </div>
                  </button>
                ))}
             </div>
          </section>
        )}
      </div>

      {/* Persistent Bottom Bar */}
      <div className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full ${widthClass} p-6 bg-white/90 backdrop-blur-md border-t border-app-border flex gap-4 z-[60]`}>
        <button className="flex-1 bg-app-bg text-app-text border border-app-border py-4 rounded-[20px] font-bold text-sm hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
           <MapPin size={18} /> 길찾기
        </button>
        <button className="flex-1 bg-brand-blue text-white py-4 rounded-[20px] font-bold text-sm shadow-lg shadow-brand-blue/20">
           공유하기
        </button>
      </div>
    </div>
  );
}
