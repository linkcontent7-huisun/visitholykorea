
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, MapPin, ExternalLink, MessageCircle } from 'lucide-react';
import { getPilgrimageAdvice } from '../services/geminiService';
import { GroundingChunk } from '../types';

interface AiAssistantProps {
  onClose: () => void;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string, grounding?: GroundingChunk[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    let location = undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => 
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      );
      location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch (err) {
      console.log("Location access denied or failed.");
    }

    const response = await getPilgrimageAdvice(userMsg, location);
    setMessages(prev => [...prev, { role: 'bot', text: response.text, grounding: response.grounding }]);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg h-[80vh] rounded-[40px] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-blue-600 p-8 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">순례 도우미</h3>
            <p className="text-sm text-blue-100">가톨릭 굿뉴스 기반 성지 정보를 안내합니다</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {messages.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={32} className="text-blue-500" />
              </div>
              <p className="text-sm font-medium">무엇이든 물어보세요!<br /><span className="text-xs opacity-75">"서울대교구의 주요 성지는?"<br />"광희문 성지의 역사가 궁금해"</span></p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-3xl ${
                msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-100' 
                : 'bg-white shadow-sm border border-slate-100 text-slate-700 rounded-tl-none'
              }`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                {msg.grounding && msg.grounding.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">관련 링크</p>
                    {msg.grounding.map((chunk, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {chunk.maps && (
                          <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 text-xs hover:underline font-medium bg-blue-50 px-2 py-1 rounded-full">
                            <MapPin size={10} /> {chunk.maps.title}
                          </a>
                        )}
                        {chunk.web && (
                          <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 text-xs hover:underline font-medium bg-blue-50 px-2 py-1 rounded-full">
                            <ExternalLink size={10} /> {chunk.web.title}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                <Loader2 size={20} className="animate-spin text-blue-500" />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 bg-white border-t border-slate-100 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="성지 정보를 물어보세요..."
            className="flex-1 px-6 py-4 bg-slate-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center disabled:bg-slate-300 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-200"
          >
            <Send size={22} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiAssistant;
