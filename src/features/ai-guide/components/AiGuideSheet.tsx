import { AnimatePresence, motion } from 'motion/react';
import { Bot, Loader2, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { askAIGuide } from '../api/ai-guide.client';

/**
 * 미카엘의 답변은 마크다운(표·불릿·굵게)으로 온다. 채팅 말풍선 안에서 읽히도록
 * 표와 목록만 최소한으로 손봐 준다.
 */
const MARKDOWN_CLASS =
  'space-y-2 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-app-border [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-app-border [&_td]:px-2 [&_td]:py-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-1 [&_strong]:font-bold';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

const GREETING: Message = {
  role: 'bot',
  text: '안녕하세요, 순례자님. 성지순례를 돕는 미카엘입니다. 가고 싶은 지역이나 마음에 걸리는 것이 있다면 편히 말씀해 주세요.',
};

interface AiGuideSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/** 하단에서 올라오는 AI 가이드 대화 시트. */
export function AiGuideSheet({ isOpen, onClose }: AiGuideSheetProps) {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setIsLoading(true);

    const response = await askAIGuide(question);
    setMessages((prev) => [...prev, { role: 'bot', text: response }]);
    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="AI 순례 가이드"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative flex h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[40px] bg-white shadow-2xl sm:h-[70vh] sm:rounded-[40px]"
          >
            <header className="flex shrink-0 items-center justify-between bg-brand-blue p-8 text-white">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/10 bg-white/10 shadow-xl backdrop-blur-xl">
                  <Bot size={28} />
                </div>
                <div>
                  <h3 className="mb-1.5 text-xl font-extrabold leading-none tracking-tight">
                    순례 안내 미카엘
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-green-400 shadow-lg shadow-green-400/50" />
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/50">
                      Online Now
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 transition-all hover:bg-white/20"
                aria-label="닫기"
              >
                <X size={22} />
              </button>
            </header>

            <div
              ref={scrollRef}
              className="no-scrollbar flex-1 space-y-6 overflow-y-auto bg-white p-8"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-[28px] p-5 text-sm font-medium leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'rounded-tr-none bg-brand-blue text-white'
                        : 'rounded-tl-none border border-app-border bg-app-bg text-app-text'
                    }`}
                  >
                    {msg.role === 'bot' ? (
                      <div className={MARKDOWN_CLASS}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-3 rounded-[28px] rounded-tl-none border border-app-border bg-app-bg p-5">
                    <Loader2 size={18} className="animate-spin text-brand-violet" />
                    <span className="text-xs font-bold tracking-tight text-app-text-muted">
                      홀리가 답변을 생각하고 있어요...
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-4 border-t border-app-border bg-white p-8">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleSend();
                  }}
                  placeholder="평화 속에서 질문해 보세요"
                  aria-label="질문 입력"
                  className="w-full rounded-[24px] border border-app-border bg-app-bg px-7 py-5 pr-16 text-sm font-bold text-app-text outline-none transition-all placeholder:text-gray-300 focus:ring-2 focus:ring-brand-blue/20"
                />
                <button
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || isLoading}
                  aria-label="보내기"
                  className={`absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-2xl px-4 py-3 transition-all ${
                    input.trim()
                      ? 'bg-brand-blue text-white shadow-xl shadow-brand-blue/20'
                      : 'bg-gray-100 text-gray-300'
                  }`}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
