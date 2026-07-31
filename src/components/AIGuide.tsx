import React, { useState } from 'react';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { askAIGuide } from '../services/geminiService';

interface AIGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export default function AIGuide({ isOpen, onClose }: AIGuideProps) {
  const { wideView } = useSettings();
  const widthClass = wideView ? 'max-w-4xl' : 'max-w-lg';
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    const answer = await askAIGuide(question);
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', text: answer ?? '죄송해요, 지금은 답변을 가져올 수 없어요. 잠시 후 다시 시도해주세요.' },
    ]);
    setLoading(false);
  };

  return (
    <div className={`fixed inset-y-0 left-1/2 -translate-x-1/2 w-full ${widthClass} z-[300] bg-white flex flex-col`}>
      <div className="h-16 flex items-center justify-between px-6 border-b border-app-border shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-brand-violet" />
          <h2 className="font-extrabold text-app-text tracking-tight">AI 순례 가이드</h2>
        </div>
        <button onClick={onClose} className="p-2 text-app-text-muted" id="ai-guide-close">
          <X size={22} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-app-text-muted text-sm py-16">
            성지 순례에 대해 무엇이든 물어보세요.
            <br />
            (예: "초보 순례자에게 좋은 코스 추천해줘")
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-brand-blue text-white rounded-br-sm'
                  : 'bg-app-bg text-app-text rounded-bl-sm'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-app-bg text-app-text-muted px-4 py-3 rounded-2xl rounded-bl-sm">
              <Loader2 size={16} className="animate-spin" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-app-border flex gap-2 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="질문을 입력하세요"
          className="flex-1 bg-app-bg rounded-xl px-4 py-3 text-sm outline-none"
          id="ai-guide-input"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="w-12 h-12 bg-brand-blue text-white rounded-xl flex items-center justify-center disabled:opacity-50"
          id="ai-guide-send"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
