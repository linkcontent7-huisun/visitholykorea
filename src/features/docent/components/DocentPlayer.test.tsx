import { act, fireEvent, render, screen } from '@testing-library/react';
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

  it('speak 가 무시되면(안드로이드 크롬 cancel 직후 버그) 잠시 후 한 번 재시도한다', () => {
    vi.useFakeTimers();
    // speaking/pending 이 계속 false → 시작되지 않은 것으로 판정되어야 한다
    render(<DocentPlayer chapters={chapters} isDraft={false} language="ko" />);
    fireEvent.click(screen.getByText('순교자 기념상'));
    expect(speech.speak).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(400);
    expect(speech.speak).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('음성 재생이 실패하면(onerror) 침묵하지 않고 안내 문구를 보여준다', () => {
    render(<DocentPlayer chapters={chapters} isDraft={false} language="ko" />);
    fireEvent.click(screen.getByText('순교자 기념상'));
    const utterance = speech.speak.mock.calls[0]?.[0] as FakeUtterance;
    act(() => utterance.onerror?.());
    expect(screen.getByText(/음성을 재생하지 못했/)).toBeInTheDocument();
  });
});

describe('DocentPlayer — 음성 미지원 브라우저(카카오톡 인앱 등)', () => {
  // 바깥 describe 의 beforeEach 가 stub 을 깔기 전 상태를 만들기 위해 여기서 걷어낸다
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('죽지 않고 안내 문구를 보여주며, 챕터를 누르면 글로는 읽을 수 있다', () => {
    render(<DocentPlayer chapters={chapters} isDraft={false} language="ko" />);
    expect(screen.getByText(/음성이 지원되지 않/)).toBeInTheDocument();
    // 재생은 못 해도 챕터 본문 읽기는 되어야 한다
    fireEvent.click(screen.getByText('순교자 기념상'));
    expect(screen.getByText('설명')).toBeInTheDocument();
  });
});

describe('DocentPlayer — 성당 예절 가드 (휴대폰·태블릿)', () => {
  beforeEach(() => {
    // 손가락 기기 흉내 — pointer: coarse
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('coarse'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    sessionStorage.clear();
  });

  it('이어폰을 알 수 없으면 재생 대신 정중한 안내와 확인 버튼을 보여준다', () => {
    render(<DocentPlayer chapters={chapters} isDraft={false} language="ko" />);
    fireEvent.click(screen.getByLabelText('재생'));
    expect(speech.speak).not.toHaveBeenCalled();
    expect(screen.getByText(/이어폰을 연결해 주세요/)).toBeInTheDocument();
    expect(screen.getByText(/들으실 수 없습니다/)).toBeInTheDocument();
  });

  it('"이어폰을 연결했어요"를 누르면 그때 재생이 시작된다', () => {
    render(<DocentPlayer chapters={chapters} isDraft={false} language="ko" />);
    fireEvent.click(screen.getByLabelText('재생'));
    fireEvent.click(screen.getByText('이어폰을 연결했어요'));
    expect(speech.speak).toHaveBeenCalled();
  });

  it('한 번 확인하면 같은 세션에서는 다시 묻지 않는다', () => {
    sessionStorage.setItem('vhk_docent_earphone_ok', '1');
    render(<DocentPlayer chapters={chapters} isDraft={false} language="ko" />);
    fireEvent.click(screen.getByLabelText('재생'));
    expect(speech.speak).toHaveBeenCalled();
    expect(screen.queryByText(/이어폰을 연결해 주세요/)).not.toBeInTheDocument();
  });

  it('PC(마우스 기기)에서는 가드 없이 바로 재생된다', () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    render(<DocentPlayer chapters={chapters} isDraft={false} language="ko" />);
    fireEvent.click(screen.getByLabelText('재생'));
    expect(speech.speak).toHaveBeenCalled();
  });
});

describe('DocentPlayer — 차단 상태에도 출구가 있다', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    sessionStorage.clear();
  });

  it('안내가 떠 있는 동안에도 확인 버튼이 항상 남는다 — 영구 잠금 방지', () => {
    render(<DocentPlayer chapters={chapters} isDraft={false} language="ko" />);
    fireEvent.click(screen.getByLabelText('재생'));
    // 어떤 가드 상태든 확인 버튼으로 빠져나갈 수 있어야 한다
    expect(screen.getByText('이어폰을 연결했어요')).toBeInTheDocument();
    fireEvent.click(screen.getByText('이어폰을 연결했어요'));
    expect(speech.speak).toHaveBeenCalled();
  });
});
