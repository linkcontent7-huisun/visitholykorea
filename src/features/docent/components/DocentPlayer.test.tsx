import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DocentChapter } from '../lib/chapters';
import { DocentPlayer } from './DocentPlayer';

/** jsdom 에는 음성 합성이 없다 — 호출 여부만 확인할 수 있게 흉내 낸다. */
class FakeUtterance {
  text: string;
  lang = '';
  rate = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

const speech = { speak: vi.fn(), cancel: vi.fn(), pause: vi.fn(), resume: vi.fn() };

beforeEach(() => {
  vi.stubGlobal('speechSynthesis', speech);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const chapters: DocentChapter[] = [
  { id: 'intro', title: '여는 말', narration: '여는 말 본문', location: null, lookFor: null },
  {
    id: 'point-1',
    title: '순교자 기념상',
    narration: '설명',
    location: '입구 왼쪽',
    lookFor: '십자가 부조',
    },
  { id: 'outro', title: '맺음말', narration: '맺음말 본문', location: null, lookFor: null },
];

describe('DocentPlayer', () => {
  it('챕터 목록과 위치·볼거리 안내를 함께 보여준다', () => {
    render(<DocentPlayer chapters={chapters} isDraft={false} language="ko" />);
    expect(screen.getByText('여는 말')).toBeInTheDocument();
    expect(screen.getByText('순교자 기념상')).toBeInTheDocument();
    expect(screen.getByText(/입구 왼쪽/)).toBeInTheDocument();
    expect(screen.getByText(/십자가 부조/)).toBeInTheDocument();
  });

  it('초안 원고에는 현장 확인 전 배지를 단다', () => {
    render(<DocentPlayer chapters={chapters} isDraft language="ko" />);
    expect(screen.getByText(/현장 확인 전/)).toBeInTheDocument();
  });

  it('챕터를 누르면 그 챕터부터 읽기 시작한다', () => {
    render(<DocentPlayer chapters={chapters} isDraft={false} language="ko" />);
    fireEvent.click(screen.getByText('순교자 기념상'));
    expect(speech.speak).toHaveBeenCalledTimes(1);
    const utterance = speech.speak.mock.calls[0]?.[0] as FakeUtterance;
    expect(utterance.text).toBe('설명');
    expect(utterance.lang).toBe('ko-KR');
  });

  it('챕터가 없으면 아무것도 그리지 않는다', () => {
    const { container } = render(<DocentPlayer chapters={[]} isDraft={false} language="ko" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('현재 챕터의 해설 전문을 글로도 보여준다 — 소리를 못 듣는 상황을 위해', () => {
    render(<DocentPlayer chapters={chapters} isDraft={false} language="ko" />);
    // 처음에는 첫 챕터가 현재이므로 그 본문이 보인다
    expect(screen.getByText('여는 말 본문')).toBeInTheDocument();
    expect(screen.queryByText('설명')).not.toBeInTheDocument();
    // 다른 챕터를 고르면 그 챕터의 본문으로 바뀐다
    fireEvent.click(screen.getByText('순교자 기념상'));
    expect(screen.getByText('설명')).toBeInTheDocument();
    expect(screen.queryByText('여는 말 본문')).not.toBeInTheDocument();
  });

  it('속도 버튼을 누르면 느리게·보통·빠르게가 순환하고 재생 속도에 반영된다', () => {
    render(<DocentPlayer chapters={chapters} isDraft={false} language="ko" />);
    const speedButton = screen.getByRole('button', { name: /읽는 속도/ });
    expect(speedButton).toHaveTextContent('보통');
    fireEvent.click(speedButton);
    expect(speedButton).toHaveTextContent('빠르게');
    fireEvent.click(screen.getByText('순교자 기념상'));
    const utterance = speech.speak.mock.calls[0]?.[0] as FakeUtterance;
    expect(utterance.rate).toBeGreaterThan(1);
    fireEvent.click(speedButton); // 빠르게 → 느리게
    expect(speedButton).toHaveTextContent('느리게');
  });
});
