import { beforeEach, describe, expect, it, vi } from 'vitest';

const insertMock = vi.fn();
const fromMock = vi.fn(() => ({ insert: insertMock }));
vi.mock('@/shared/api/supabase', () => ({
  supabase: { from: (...a: unknown[]) => fromMock(...(a as [])) },
}));

const { logQuestion } = await import('./ai-question-log');

const entry = {
  question: '  명동대성당은 어떤 곳인가요?  ',
  answer: '1898년에 완공된 성당이에요.',
  language: 'ko',
  sources: ['명동대성당'],
  fallback: false,
  signedIn: false,
};

describe('logQuestion — 미카엘 질문·답 익명 기록', () => {
  beforeEach(() => {
    insertMock.mockReset();
    fromMock.mockClear();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('질문·답·언어·참고 성지를 계정 정보 없이 넣는다', async () => {
    insertMock.mockResolvedValue({ error: null });
    await logQuestion(entry);
    expect(fromMock).toHaveBeenCalledWith('ai_question_logs');
    expect(insertMock).toHaveBeenCalledWith({
      question: '명동대성당은 어떤 곳인가요?',
      answer: '1898년에 완공된 성당이에요.',
      language: 'ko',
      sources: ['명동대성당'],
      fallback: false,
      signed_in: false,
    });
    expect(Object.keys(insertMock.mock.calls[0]![0])).not.toContain('user_id');
  });

  it('빈 질문은 넣지 않는다', async () => {
    await logQuestion({ ...entry, question: '   ' });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('긴 질문·답은 표의 한도에 맞춰 자른다', async () => {
    insertMock.mockResolvedValue({ error: null });
    await logQuestion({ ...entry, question: '가'.repeat(3000), answer: '나'.repeat(9000) });
    const row = insertMock.mock.calls[0]![0] as { question: string; answer: string };
    expect(row.question.length).toBe(2000);
    expect(row.answer.length).toBe(8000);
  });

  it('표가 없거나 권한이 없어도 던지지 않는다 (대화에 영향 없음)', async () => {
    insertMock.mockResolvedValue({
      error: { message: 'relation "ai_question_logs" does not exist' },
    });
    await expect(logQuestion(entry)).resolves.toBeUndefined();
  });

  it('네트워크 오류로 insert 가 던져도 삼킨다', async () => {
    insertMock.mockRejectedValue(new Error('network'));
    await expect(logQuestion(entry)).resolves.toBeUndefined();
  });
});
