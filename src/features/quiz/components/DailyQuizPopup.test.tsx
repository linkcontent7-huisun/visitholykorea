import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DICTIONARY } from '@/shared/i18n/dictionary';
import type { HolyQuiz } from '../data/holy-quiz';
import { DailyQuizPopup } from './DailyQuizPopup';

/** 정답에만 「딩동」, 오답에는 소리 없음 (2026-11-20 사장님 지시) */

const ko = (key: string) => (DICTIONARY as Record<string, Record<string, string>>)[key]?.ko ?? key;

vi.mock('@/shared/i18n/use-settings', () => ({
  useSettings: () => ({ language: 'ko', t: ko }),
}));

const ding = vi.fn();
vi.mock('../lib/correct-ding', () => ({ playCorrectDing: () => ding() }));

const quiz: HolyQuiz = {
  id: 't1',
  question: { ko: '시험 문제', en: 'Test question' },
  choices: [
    { ko: '맞는 답', en: 'Right' },
    { ko: '틀린 답', en: 'Wrong' },
  ],
  answer: 0,
  hint: { ko: '힌트', en: 'Hint' },
  explanation: { ko: '해설', en: 'Explanation' },
};

function openQuiz() {
  render(<DailyQuizPopup isOpen onClose={() => {}} startIndex={0} quizzes={[quiz]} />);
  fireEvent.click(screen.getByRole('button', { name: ko('quizStart') }));
}

beforeEach(() => ding.mockClear());

describe('퀴즈 정답 소리', () => {
  it('정답을 고르면 딩동이 한 번 나고 정답 문구는 그대로다', () => {
    openQuiz();
    fireEvent.click(screen.getByRole('button', { name: /맞는 답/ }));
    expect(ding).toHaveBeenCalledTimes(1);
    expect(screen.getByText(ko('quizCorrect'))).toBeTruthy();
  });

  it('오답에는 소리가 나지 않는다', () => {
    openQuiz();
    fireEvent.click(screen.getByRole('button', { name: /틀린 답/ }));
    expect(ding).not.toHaveBeenCalled();
  });
});
