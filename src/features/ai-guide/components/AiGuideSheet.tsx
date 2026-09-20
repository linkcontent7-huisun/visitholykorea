import { AnimatePresence, motion } from 'motion/react';
import { Loader2, Send, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MichaelIcon } from '@/shared/components/icons/MichaelIcon';
import { useModalFocus } from '@/shared/hooks/use-modal-focus';
import { useSettings } from '@/shared/i18n/use-settings';
import { useSession } from '@/features/auth/hooks/use-session';
import { askAIGuide } from '../api/ai-guide.client';
import { clearChatHistory, fetchChatHistory, saveChatTurns } from '../api/ai-chat.repository';
import { chatStore, useChatMessages } from '../lib/chat-store';

/**
 * 미카엘의 답변은 마크다운(표·불릿·굵게)으로 온다. 채팅 말풍선 안에서 읽히도록
 * 표와 목록만 최소한으로 손봐 준다.
 */
const MARKDOWN_CLASS =
  'space-y-2 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-app-border [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-app-border [&_td]:px-2 [&_td]:py-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-1 [&_strong]:font-bold';

interface AiGuideSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 하단에서 올라오는 AI 가이드 대화 시트.
 *
 * 대화는 앱에 한 줄기(chat-store) — 헤더 · 홈 카드 어디서 열어도 같다. 로그인이면 열 때 DB 에서
 * 최근 대화를 채우고 질문 · 답을 쌍으로 저장한다(스펙 7절). 비로그인은 세션 안에서만.
 */
export function AiGuideSheet({ isOpen, onClose }: AiGuideSheetProps) {
  const { t } = useSettings();
  const { session } = useSession();
  const userId = session?.user.id ?? null;
  const messages = useChatMessages();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // 포커스 가두기·Esc·되돌리기 — 키보드로도 열고 닫을 수 있어야 한다(2026-09-20 접근성 감사)
  const dialogRef = useModalFocus<HTMLDivElement>(isOpen, onClose);
  // 첫 인사는 고른 언어로 — 외국인에게 한국어 인사가 먼저 뜨면 답도 한국어로 올 것처럼 보인다
  const greeting = t('aiGreeting');

  // 열 때: 로그인이면 DB 기록을 한 번 채운다. 로그인 상태가 바뀌면 다시 채운다.
  useEffect(() => {
    if (!isOpen || chatStore.loadedFor() === userId) return;
    chatStore.markLoaded(userId);
    if (!userId) {
      if (chatStore.get().length === 0) chatStore.set([{ role: 'bot', text: greeting }]);
      return;
    }
    let active = true;
    void fetchChatHistory().then((history) => {
      if (!active) return;
      chatStore.set(history.length ? history : [{ role: 'bot', text: greeting }]);
    });
    return () => {
      active = false;
    };
  }, [isOpen, userId, greeting]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    setInput('');
    // 문맥은 실제 대화만 — 첫 인사(greeting)는 뺀다
    const history = chatStore.get().filter((m) => m.text !== greeting);
    chatStore.append({ role: 'user', text: question });
    setIsLoading(true);

    const answer = await askAIGuide(question, history);
    chatStore.append({
      role: 'bot',
      text: answer.text,
      fallback: answer.fallback,
      sources: answer.sources,
    });
    setIsLoading(false);
    // 로그인일 때만 저장된다(repository 가 판단). 실패해도 화면은 그대로.
    void saveChatTurns([
      { role: 'user', text: question },
      { role: 'bot', text: answer.text },
    ]);
  };

  const handleClear = async () => {
    if (userId) await clearChatHistory();
    chatStore.set([{ role: 'bot', text: greeting }]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('aiSheetAria')}
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
            className="relative flex h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-lg bg-white sm:h-[88dvh] sm:rounded-lg"
          >
            <header className="flex shrink-0 items-center justify-between bg-brand-blue px-6 py-4 text-white">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/10 backdrop-blur-xl">
                  <MichaelIcon size={28} aria-hidden />
                </div>
                <div className="flex items-center">
                  <h3 className="text-xl font-extrabold leading-none tracking-tight">
                    {t('aiGuideTitle')}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {messages.some((m) => m.role === 'user') && (
                  <button
                    onClick={() => void handleClear()}
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/10 transition-colors hover:bg-white/20 focus-visible:outline-white"
                    aria-label={t('aiClearChat')}
                    title={t('aiClearChat')}
                    id="ai-clear-chat"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                {/* 남색 머리띠 위라 전역 남색 포커스 선이 안 보인다 — 흰 선으로. 열리면 여기로 포커스가 온다 */}
                <button
                  onClick={onClose}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/10 transition-colors hover:bg-white/20 focus-visible:outline-white"
                  aria-label={t('close')}
                  data-autofocus
                >
                  <X size={22} />
                </button>
              </div>
            </header>

            {/* 답이 도착하면 스크린리더가 읽어 준다 — 없으면 화면이 바뀐 줄 모른다(WCAG 4.1.3) */}
            <div
              ref={scrollRef}
              className="no-scrollbar flex-1 space-y-5 overflow-y-auto bg-white p-6"
              aria-live="polite"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-lg p-5 text-base font-medium leading-relaxed ${
                      msg.role === 'user'
                        ? 'rounded-tr-none bg-brand-blue text-white'
                        : 'rounded-tl-none border border-app-border bg-app-bg text-app-text'
                    }`}
                  >
                    {msg.role === 'bot' ? (
                      <div>
                        {msg.fallback && (
                          <p className="mb-2 rounded bg-app-panel px-2 py-1 text-xs font-bold text-app-text-muted">
                            {t('aiFallbackNotice')}
                          </p>
                        )}
                        <div className={MARKDOWN_CLASS}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                        </div>
                        {msg.sources && msg.sources.length > 0 && (
                          <p className="mt-2 text-xs text-app-text-muted">
                            {t('aiSourcesLabel')} {msg.sources.join(' · ')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start" role="status">
                  <div className="flex items-center gap-3 rounded-lg rounded-tl-none border border-app-border bg-app-bg p-5">
                    <Loader2 size={18} className="animate-spin text-brand-blue" />
                    <span className="text-xs font-bold tracking-tight text-app-text-muted">
                      {t('aiThinking')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-4 border-t border-app-border bg-white p-5">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleSend();
                  }}
                  placeholder={t('aiInputPlaceholder')}
                  aria-label={t('aiInputAria')}
                  className="w-full rounded-lg border border-app-input-border bg-app-bg px-6 py-4 pr-16 text-base font-bold text-app-text transition-colors focus:border-brand-blue"
                />
                <button
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || isLoading}
                  aria-label={t('send')}
                  className={`absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg px-4 py-3 transition-colors ${
                    input.trim() ? 'bg-brand-blue text-white' : 'bg-app-panel text-app-text-muted'
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
