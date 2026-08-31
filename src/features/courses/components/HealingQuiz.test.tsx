import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DICTIONARY } from '@/shared/i18n/dictionary';
import { HealingQuiz } from './HealingQuiz';

/**
 * 나침반 7문항 전체 흐름 테스트.
 *
 * 실브라우저 검증이 번번이 막혔던 화면이다 — 프레임이 스로틀되는 환경
 * (숨긴 탭·인앱 브라우저 에뮬레이션)에서는 mode="wait" 전환이 끝나지 않아
 * 다음 문항이 안 나온다. jsdom 은 애니메이션을 즉시 끝내므로 여기서
 * 인트로→8문항→결과까지의 **로직**을 못 박아 둔다.
 */

// jsdom 에는 없는 API·서버 의존을 흉내 낸다
vi.mock('@/shared/i18n/use-settings', () => ({
  useSettings: () => ({
    wideView: false,
    origin: null,
    setOrigin: vi.fn(),
    t: (key: string) => {
      const entry = (DICTIONARY as Record<string, Record<string, string>>)[key];
      return entry?.ko ?? key;
    },
  }),
}));

const mutateMock = vi.fn();
vi.mock('../hooks/use-compass-memory', () => ({
  useSaveCompassResponse: () => ({ mutate: mutateMock }),
  useCompassMemory: () => ({ data: null }),
}));

vi.mock('@/features/sites/hooks/use-nearby-tour', () => ({
  useNearbyFacilities: () => ({ data: [] }),
}));

const getRecommendedCoursesMock = vi.fn();
vi.mock('../api/course-matching', () => ({
  getRecommendedCourses: (...args: unknown[]) => getRecommendedCoursesMock(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  getRecommendedCoursesMock.mockResolvedValue([
    {
      site: {
        id: 'site-1',
        name: '테스트 성지',
        category: '순교성지',
        location: '어딘가',
        imageUrl: null,
        coordinates: { lat: 37.5, lng: 127 },
      },
      reason: '마음에 맞아서',
    },
  ]);
});

/** 현재 화면의 버튼을 텍스트로 찾아 누른다. */
function click(label: string | RegExp) {
  const btn = screen
    .getAllByRole('button')
    .find((b) => (typeof label === 'string' ? b.textContent?.includes(label) : label.test(b.textContent ?? '')));
  expect(btn, `버튼 없음: ${label}`).toBeTruthy();
  fireEvent.click(btn!);
}

function next() {
  click(/다음으로|결과 보기/);
}

describe('HealingQuiz — 전체 흐름', () => {
  it('인트로부터 8문항을 지나 결과 화면까지 도달한다', async () => {
    render(<HealingQuiz isOpen onClose={vi.fn()} onSelectSite={vi.fn()} />);

    // 인트로
    click('시작하기');

    // Q1 감정 — mode="wait" 전환이 끝나 문항이 나타날 때까지 기다린다
    await waitFor(() => expect(document.getElementById('quiz-emotion-평온')).toBeTruthy());
    const nextBtn = screen
      .getAllByRole('button')
      .find((b) => /다음으로/.test(b.textContent ?? ''))!;
    expect(nextBtn).toBeDisabled();
    fireEvent.click(document.getElementById('quiz-emotion-평온')!);
    next();

    // Q2 관심사
    await waitFor(() => expect(document.getElementById('quiz-concern-나 자신을 돌보는 일')).toBeTruthy());
    fireEvent.click(document.getElementById('quiz-concern-나 자신을 돌보는 일')!);
    next();

    // Q3 출발지 — select
    await waitFor(() => expect(screen.queryByRole('combobox')).toBeTruthy());
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '서울' } });
    next();

    // Q4 성별
    await waitFor(() => expect(document.getElementById('quiz-gender-여성')).toBeTruthy());
    fireEvent.click(document.getElementById('quiz-gender-여성')!);
    next();

    // Q5~Q7 — id 목록에서 첫 항목을 누른다 (내부 키에 얽매이지 않는다)
    for (const prefix of ['quiz-style-', 'quiz-time-', 'quiz-party-']) {
      await waitFor(() =>
        expect(document.querySelector(`button[id^="${prefix}"]`)).toBeTruthy(),
      );
      fireEvent.click(document.querySelector<HTMLButtonElement>(`button[id^="${prefix}"]`)!);
      next();
    }

    // Q8 자유 텍스트 — 건너뛸 수 있어야 한다
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeTruthy());
    next();

    // 결과 — 추천 성지가 뜨고, 응답이 저장된다
    await waitFor(() => expect(screen.getByText('테스트 성지')).toBeInTheDocument());
    expect(getRecommendedCoursesMock).toHaveBeenCalledOnce();
    expect(mutateMock).toHaveBeenCalledOnce();
    const saved = mutateMock.mock.calls[0]![0] as {
      answers: Record<string, unknown>;
      matchedSiteId: string;
    };
    expect(saved.matchedSiteId).toBe('site-1');
    expect(saved.answers.emotion).toBe('평온');
    expect(saved.answers.region).toBe('서울');
  });

  it('닫으면 처음부터 다시 — 이전 답이 남지 않는다', async () => {
    const onClose = vi.fn();
    const { rerender } = render(<HealingQuiz isOpen onClose={onClose} onSelectSite={vi.fn()} />);
    click('시작하기');
    await waitFor(() => expect(document.getElementById('quiz-emotion-평온')).toBeTruthy());
    fireEvent.click(document.getElementById('quiz-emotion-평온')!);
    // 닫기
    fireEvent.click(document.getElementById('quiz-close')!);
    expect(onClose).toHaveBeenCalled();
    // 다시 열면 인트로부터 (퇴장 애니메이션이 정리될 때까지 기다린다)
    rerender(<HealingQuiz isOpen onClose={onClose} onSelectSite={vi.fn()} />);
    await waitFor(() => expect(document.getElementById('quiz-start')).toBeTruthy());
  });
});
