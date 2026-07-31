import React, { useState, useEffect } from 'react';
import { Camera, PenLine, Heart, MapPin, Calendar, Stamp as StampIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { PilgrimageLog } from '../../types';
import { supabase } from '../../lib/supabase';
import { getMyStamps, getCertificateLevel, CERTIFICATE_LEVELS, StampedSite } from '../../services/pilgrimageService';

interface RecordTabProps {
  onSelectSite: (id: string) => void;
}

export default function RecordTab({ onSelectSite }: RecordTabProps) {
  const [logs, setLogs] = useState<PilgrimageLog[]>([]);
  const [stamps, setStamps] = useState<StampedSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSegment, setActiveSegment] = useState<'logs' | 'stamps'>('logs');

  useEffect(() => {
    async function fetchData() {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data } = await supabase
          .from('pilgrimage_logs')
          .select('*')
          .eq('user_id', userData.user.id)
          .order('visit_date', { ascending: false });
        if (data) setLogs(data);
      }
      const myStamps = await getMyStamps();
      setStamps(myStamps);
      setLoading(false);
    }
    fetchData();
  }, []);

  const certLevel = getCertificateLevel(stamps.length);
  const nextLevel = CERTIFICATE_LEVELS.find((l) => l.minStamps > stamps.length);

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Header */}
      <header className="p-8 pb-4 sticky top-0 bg-white/90 backdrop-blur-md z-40 border-b border-app-border">
        <h1 className="text-3xl font-extrabold text-app-text tracking-tight mb-4">기록</h1>
        <div className="flex bg-app-bg p-1 rounded-[16px] border border-app-border">
          <button 
            onClick={() => setActiveSegment('logs')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-[12px] transition-all ${activeSegment === 'logs' ? 'bg-white text-brand-blue shadow-sm' : 'text-app-text-muted'}`}
            id="seg-logs"
          >
            순례 여행기
          </button>
          <button 
            onClick={() => setActiveSegment('stamps')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-[12px] transition-all ${activeSegment === 'stamps' ? 'bg-white text-brand-blue shadow-sm' : 'text-app-text-muted'}`}
            id="seg-stamps"
          >
            방문 스탬프
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="p-8 pb-32">
        {activeSegment === 'logs' ? (
          <div className="space-y-8">
            <button className="w-full py-5 border-2 border-dashed border-app-border rounded-[24px] flex items-center justify-center gap-3 text-app-text-muted hover:border-brand-violet/30 hover:text-brand-violet hover:bg-brand-violet/5 transition-all text-sm font-bold" id="create-log-btn">
              <PenLine size={20} />
              여행기 작성하기
            </button>

            {loading ? (
                [1, 2].map(i => <div key={i} className="h-64 bg-white rounded-[32px] animate-pulse" />)
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[32px] overflow-hidden bg-white shadow-xl shadow-gray-200/40 border border-app-border"
                  id={`log-item-${log.id}`}
                >
                  {log.site_image && (
                    <img src={log.site_image} alt={log.title} className="w-full h-56 object-cover" />
                  )}
                  <div className="p-7">
                    <div className="flex items-center gap-2 text-brand-violet mb-3">
                       <MapPin size={14} className="fill-brand-violet/10" />
                       <span className="text-[10px] font-extrabold uppercase tracking-widest">{log.site_name}</span>
                    </div>
                    <h3 className="text-xl font-bold text-app-text mb-3 leading-tight">{log.title}</h3>
                    <p className="text-app-text-muted text-sm line-clamp-3 mb-6 font-medium leading-relaxed">{log.content}</p>
                    <div className="flex justify-between items-center pt-5 border-t border-app-border">
                       <div className="flex items-center gap-2 text-app-text-muted">
                          <Calendar size={14} />
                          <span className="text-[10px] font-bold">{log.visit_date}</span>
                       </div>
                       <button className="flex items-center gap-1.5 text-pink-500 font-bold">
                          <Heart size={16} className="fill-pink-500" />
                          <span className="text-xs">12</span>
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
                <div className="text-center py-24 px-10">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-gray-100">
                        <PenLine size={32} className="text-gray-300" />
                    </div>
                    <h4 className="text-xl font-bold text-app-text mb-3 tracking-tight">다녀온 성지를 기록해보세요</h4>
                    <p className="text-app-text-muted text-sm leading-relaxed font-medium">
                        내 순례의 감동과 기도를 기록으로 남기고<br />다른 순례자들과 마음을 나누어보세요.
                    </p>
                </div>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {/* 순례 여권 진행 카드 */}
            <div className="bg-gradient-to-br from-brand-blue to-brand-violet text-white rounded-[32px] p-8 shadow-xl shadow-brand-blue/20">
              <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-70 mb-2">순례 여권</p>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-black">{stamps.length}</span>
                <span className="text-sm font-bold opacity-80 mb-1">곳 순례</span>
              </div>
              {certLevel && (
                <p className="text-sm font-bold mb-1">
                  {certLevel.emoji} 현재 등급: {certLevel.label}
                </p>
              )}
              {nextLevel && (
                <p className="text-xs opacity-70">
                  다음 등급 "{nextLevel.label}"까지 {nextLevel.minStamps - stamps.length}곳 남았어요
                </p>
              )}
            </div>

            {stamps.length === 0 ? (
              <div className="text-center py-16 px-10">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-gray-100">
                  <StampIcon size={32} className="text-gray-300" />
                </div>
                <h4 className="text-lg font-bold text-app-text mb-3 tracking-tight">아직 스탬프가 없어요</h4>
                <p className="text-app-text-muted text-sm leading-relaxed font-medium">
                  성지 상세 페이지에서 "순례 스탬프 찍기"를 눌러<br />나만의 순례 여권을 채워보세요.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-y-8 gap-x-6">
                {stamps.map((stamp) => (
                  <button
                    key={stamp.stampId}
                    onClick={() => onSelectSite(stamp.siteId)}
                    className="flex flex-col items-center gap-3"
                    id={`stamp-${stamp.stampId}`}
                  >
                    <div className="w-20 h-20 rounded-full flex items-center justify-center border-4 bg-brand-blue border-app-border shadow-2xl shadow-brand-blue/20 rotate-6 scale-110 transition-all duration-500">
                      <StampIcon size={32} className="text-white" />
                    </div>
                    <span className="text-[10px] font-extrabold tracking-tight text-brand-blue text-center leading-tight">
                      {stamp.siteName}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-[100px] right-8 w-15 h-15 bg-brand-violet text-white rounded-full shadow-2xl shadow-brand-violet/30 flex items-center justify-center z-50 border-4 border-white"
        id="fab-camera"
      >
        <Camera size={26} />
      </motion.button>
    </div>
  );
}
