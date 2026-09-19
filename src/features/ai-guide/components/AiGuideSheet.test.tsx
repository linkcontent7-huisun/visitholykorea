import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DICTIONARY } from '@/shared/i18n/dictionary';
import { AiGuideSheet } from './AiGuideSheet';
import { chatStore } from '../lib/chat-store';

/**
 * 미카엘 시트 — 대화 한 줄기(store) · 로그인 시 DB 기록 불러오기/저장/지우기 · 폴백 띠 · 참고한 성지.
 * 서버(Edge Function)·DB 는 전부 모킹. 스펙: docs/DSH/2026-09-18-미카엘-챗봇-스펙.md 5·7절.
 */

vi.mock('@/shared/i18n/use-settings', () => ({
  useSettings: () => ({
    t: (key: string) => (DICTIONARY as Record<string, Record<string, string>>)[key]?.ko ?? key,
  }),
}));

const session = { current: null as { user: { id: string } } | null };
vi.mock('@/features/auth/hooks/use-session', () => ({
  useSession: () => ({ session: session.current, isLoading: false }),
}));

const askMock = vi.fn();
vi.mock('../api/ai-guide.client', () => ({
  askAIGuide: (...args: unknown[]) => askMock(...args),
}));

const fetchHistoryMock = vi.fn();
const saveMock = vi.fn();
const clearMock = vi.fn();
vi.mock('../api/ai-chat.repository', () => ({
  fetchChatHistory: () => fetchHistoryMock(),
  saveChatTurns: (...args: unknown[]) => saveMock(...args),
  clearChatHistory: () => clearMock(),
}));

const GREETING = DICTIONARY.aiGreeting.ko;

beforeEach(() => {
  vi.clearAllMocks();
  session.current = null;
  chatStore.set([]);
  chatStore.markLoaded(undefined);
  askMock.mockResolvedValue({
    text: '절두산은 마포구에 있어요.',
    fallback: false,
    sources: ['절두산 순교성지'],
  });
  fetchHistoryMock.mockResolvedValue([]);
  clearMock.mockResolvedValue(true);
});

async function send(text: string) {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: text } });
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  await waitFor(() => expect(askMock).toHaveBeenCalled());
}

describe('AiGuideSheet', () => {
  it('비로그인: 인사말로 시작, 질문·답이 붙고 참고한 성지가 보이며, 문맥에는 인사말이 빠진다', async () => {
    render(<AiGuideSheet isOpen onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(GREETING)).toBeInTheDocument());
    await send('절두산 어디예요?');
    await waitFor(() => expect(screen.getByText('절두산은 마포구에 있어요.')).toBeInTheDocument());
    expect(screen.getByText(/참고한 성지: 절두산 순교성지/)).toBeInTheDocument();
    // 첫 질문이라 문맥은 비어 있어야 한다(인사말 제외)
    expect(askMock.mock.calls[0]![1]).toEqual([]);
    // 저장은 repository 가 로그인 여부로 판단 — 호출 자체는 된다
    expect(saveMock).toHaveBeenCalledWith([
      { role: 'user', text: '절두산 어디예요?' },
      { role: 'bot', text: '절두산은 마포구에 있어요.' },
    ]);
    expect(fetchHistoryMock).not.toHaveBeenCalled();
  });

  it('두 번째 질문에는 직전 대화가 문맥으로 실린다', async () => {
    render(<AiGuideSheet isOpen onClose={vi.fn()} />);
    await send('절두산 어디예요?');
    await waitFor(() => expect(screen.getByText('절두산은 마포구에 있어요.')).toBeInTheDocument());
    askMock.mockResolvedValue({ text: '미사 시간은 몰라요.', fallback: false, sources: [] });
    await send('거기 미사 시간은?');
    const history = askMock.mock.calls[1]![1] as { role: string; text: string }[];
    expect(history.map((h) => h.text)).toEqual(['절두산 어디예요?', '절두산은 마포구에 있어요.']);
  });

  it('로그인: 열 때 DB 기록을 채우고, 「대화 지우기」가 DB 와 화면을 비운다', async () => {
    session.current = { user: { id: 'u1' } };
    fetchHistoryMock.mockResolvedValue([
      { role: 'user', text: '지난번 질문' },
      { role: 'bot', text: '지난번 답' },
    ]);
    render(<AiGuideSheet isOpen onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('지난번 답')).toBeInTheDocument());
    expect(screen.queryByText(GREETING)).toBeNull();

    fireEvent.click(document.getElementById('ai-clear-chat')!);
    await waitFor(() => expect(clearMock).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.getByText(GREETING)).toBeInTheDocument());
    expect(screen.queryByText('지난번 답')).toBeNull();
  });

  it('서버가 폴백(정보 카드)을 주면 띠로 알린다', async () => {
    askMock.mockResolvedValue({
      text: '**절두산 순교성지**\n서울시 마포구',
      fallback: true,
      sources: ['절두산 순교성지'],
    });
    render(<AiGuideSheet isOpen onClose={vi.fn()} />);
    await send('절두산');
    await waitFor(() =>
      expect(screen.getByText(DICTIONARY.aiFallbackNotice.ko)).toBeInTheDocument(),
    );
  });
});
