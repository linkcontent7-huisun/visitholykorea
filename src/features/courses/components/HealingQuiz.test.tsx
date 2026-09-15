import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DICTIONARY } from '@/shared/i18n/dictionary';
import type { TourApiSpot } from '@/shared/api/tour-api';
import { HealingQuiz } from './HealingQuiz';
import type { Candidate } from '../hooks/use-candidate-plans';
import type * as CourseMatching from '../api/course-matching';
import type { PooledSite } from '../api/course-matching';

/**
 * 「오늘의 성지 일정」 전체 흐름 — 인트로 → 6문항 → 후보 카드 → 일정.
 *
 * 실브라우저 검증이 번번이 막혔던 화면이다 — 프레임이 스로틀되는 환경에서는 mode="wait"
 * 전환이 끝나지 않아 다음 문항이 안 나온다. jsdom 은 애니메이션을 즉시 끝내므로 여기서
 * **로직**을 못 박아 둔다. TourAPI 는 훅째로 모킹 — 카드 → 일정에서 재호출이 없는 것도 여기서 확인한다.
 */

const gps = { status: 'denied' as 'denied' | 'granted', location: null as { lat: number; lng: number } | null };
vi.mock('@/shared/i18n/use-settings', () => ({
  useSettings: () => ({
    wideView: false,
    origin: null,
    setOrigin: vi.fn(),
    gpsLocation: gps.location,
    gpsStatus: gps.status,
    requestGpsLocation: vi.fn(),
    language: 'ko',
    t: (key: string) => {
      const entry = (DICTIONARY as Record<string, Record<string, string>>)[key];
      return entry?.ko ?? key;
    },
  }),
}));

const mutateMock = vi.fn();
vi.mock('../hooks/use-compass-memory', () => ({
  useSaveCompassResponse: () => ({ mutate: mutateMock, isPending: false, isSuccess: false }),
  useCompassMemory: () => ({ data: null }),
}));

vi.mock('@/features/sites/hooks/use-nearby-directory', () => ({
  useNearbyDirectory: () => ({ data: [] }),
}));

const poolMock = vi.fn();
vi.mock('../api/course-matching', async (importOriginal) => {
  const actual = await importOriginal<typeof CourseMatching>();
  return { ...actual, buildCandidatePool: (...args: unknown[]) => poolMock(...args) };
});

// 카드 3장의 실시간 데이터 — 훅째로 흉내 낸다. 호출 횟수로 "카드 → 일정 재호출 0" 을 확인한다.
const plansMock = vi.fn();
vi.mock('../hooks/use-candidate-plans', () => ({
  useCandidatePlans: (pooled: PooledSite[]) => plansMock(pooled),
}));

const spot = (title: string, dist: number, typeId = '12'): TourApiSpot =>
  ({ contentid: title, contenttypeid: typeId, title, addr1: '', addr2: '', mapx: '127', mapy: '37.5', firstimage: '', dist: String(dist) }) as TourApiSpot;

function pooled(name: string, distanceKm: number): PooledSite {
  return {
    site: {
      id: name,
      name,
      category: '순교성지',
      location: '어딘가',
      imageUrl: null,
      coordinates: { lat: 37.5, lng: 127 },
    } as PooledSite['site'],
    distanceKm,
    quality: 1,
  };
}

let afternoonBusy = false;
function toCandidate(p: PooledSite, i: number): Candidate {
  const afternoon = afternoonBusy
    ? [
        { spot: spot('붐비는곳', 500), congestion: 85, level: 'busy' as const },
        { spot: spot('한적한곳', 900), congestion: 20, level: 'easy' as const },
      ]
    : [{ spot: spot('동네공원', 700), congestion: null, level: null }];
  return {
    ...p,
    tag: (['nearest', 'quiet', 'detailed'] as const)[i] ?? null,
    facilities: [],
    crowding: null,
    lunch: spot('동네식당', 300, '39'),
    afternoon,
    loading: false,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  gps.status = 'denied';
  gps.location = null;
  afternoonBusy = false;
  poolMock.mockResolvedValue({
    pool: [pooled('가까운성지', 5), pooled('중간성지', 12), pooled('먼성지', 18)],
    moreInNextRadius: 4,
  });
  plansMock.mockImplementation((sites: PooledSite[]) => sites.map(toCandidate));
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

/** 인트로 → 6문항을 답하고 결과까지 간다. */
async function answerAll(time: '반나절' | '하루' | '1박2일' = '하루') {
  click('시작하기');
  await waitFor(() => expect(document.getElementById('quiz-emotion-평온')).toBeTruthy());
  fireEvent.click(document.getElementById('quiz-emotion-평온')!);
  next();

  await waitFor(() => expect(document.getElementById('quiz-concern-나 자신을 돌보는 일')).toBeTruthy());
  fireEvent.click(document.getElementById('quiz-concern-나 자신을 돌보는 일')!);
  next();

  await waitFor(() => expect(screen.queryByRole('combobox')).toBeTruthy());
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '서울' } });
  next();

  await waitFor(() => expect(document.getElementById(`quiz-time-${time}`)).toBeTruthy());
  fireEvent.click(document.getElementById(`quiz-time-${time}`)!);
  next();

  await waitFor(() => expect(document.querySelector('button[id^="quiz-party-"]')).toBeTruthy());
  fireEvent.click(document.querySelector<HTMLButtonElement>('button[id^="quiz-party-"]')!);
  next();

  await waitFor(() => expect(screen.queryByRole('textbox')).toBeTruthy());
  next();
}

describe('HealingQuiz — 전체 흐름', () => {
  it('질문이 6개다 — 성별·참여 방식을 묻지 않는다', async () => {
    render(<HealingQuiz isOpen onClose={vi.fn()} onSelectSite={vi.fn()} />);
    await answerAll();
    expect(document.querySelector('[id^="quiz-gender-"]')).toBeNull();
    expect(document.querySelector('[id^="quiz-style-"]')).toBeNull();
    await waitFor(() => expect(document.getElementById('plan-cards')).toBeTruthy());
  });

  it('후보 카드 3장이 거리순으로 뜨고, 카드마다 태그 1개 — 카드를 누르면 일정, 저장은 그때 1회', async () => {
    const onSelectSite = vi.fn();
    render(<HealingQuiz isOpen onClose={vi.fn()} onSelectSite={onSelectSite} />);
    await answerAll();

    await waitFor(() => expect(document.getElementById('plan-cards')).toBeTruthy());
    const cards = document.querySelectorAll('#plan-cards li');
    expect(cards).toHaveLength(3);
    expect(cards[0]!.textContent).toContain('가까운성지');
    expect(cards[0]!.textContent).toContain('가장 가까워요');
    expect(cards[1]!.textContent).toContain('인근이 조용해요');
    expect(cards[2]!.textContent).toContain('소개가 자세해요');
    // 후보만 봤을 땐 저장하지 않는다
    expect(mutateMock).not.toHaveBeenCalled();
    expect(poolMock).toHaveBeenCalledOnce();
    // TourAPI 는 여기서 부르지 않는다 — 엔진에 출발지·시간이 그대로 넘어간다
    expect(poolMock.mock.calls[0]![1]).toMatchObject({ kind: 'region', label: '서울' });
    expect(poolMock.mock.calls[0]![2]).toBe('하루');

    const plansCallsBefore = plansMock.mock.calls.length;
    fireEvent.click(document.getElementById('plan-card-중간성지')!);

    // 일정 화면 — 오전·점심·오후
    await waitFor(() => expect(document.getElementById('plan-site')).toBeTruthy());
    expect(screen.getByText('중간성지')).toBeInTheDocument();
    expect(screen.getByText('동네식당')).toBeInTheDocument();
    expect(screen.getByText('동네공원')).toBeInTheDocument();
    expect(document.getElementById('plan-day2')).toBeNull();
    // 카드 → 일정에서 새 후보 조회가 없다 (훅은 같은 3장으로만 다시 불린다)
    for (const call of plansMock.mock.calls.slice(plansCallsBefore)) {
      expect((call[0] as PooledSite[]).map((p) => p.site.id)).toEqual(['가까운성지', '중간성지', '먼성지']);
    }
    expect(poolMock).toHaveBeenCalledOnce();

    // 저장 — 고른 성지, 성별·참여 방식은 null
    expect(mutateMock).toHaveBeenCalledOnce();
    const saved = mutateMock.mock.calls[0]![0] as { answers: Record<string, unknown>; matchedSiteId: string };
    expect(saved.matchedSiteId).toBe('중간성지');
    expect(saved.answers.emotion).toBe('평온');
    expect(saved.answers.region).toBe('서울');
    expect(saved.answers.origin).toEqual({ kind: 'region', label: '서울' });
    expect(saved.answers.gender).toBeNull();
    expect(saved.answers.style).toBeNull();

    // 이 일정으로 → 성지 상세
    fireEvent.click(document.getElementById('quiz-go')!);
    expect(onSelectSite).toHaveBeenCalledWith('중간성지');

    // 다른 후보 보기 → 카드로, 재조회 없음
    fireEvent.click(document.getElementById('plan-back')!);
    await waitFor(() => expect(document.getElementById('plan-cards')).toBeTruthy());
    expect(poolMock).toHaveBeenCalledOnce();
  });

  it('반나절은 점심 줄이 없고, 1박2일은 「2일차 준비 중」이 붙는다', async () => {
    const { unmount } = render(<HealingQuiz isOpen onClose={vi.fn()} onSelectSite={vi.fn()} />);
    await answerAll('반나절');
    await waitFor(() => expect(document.getElementById('plan-cards')).toBeTruthy());
    fireEvent.click(document.getElementById('plan-card-가까운성지')!);
    await waitFor(() => expect(document.getElementById('plan-site')).toBeTruthy());
    expect(screen.queryByText('동네식당')).toBeNull();
    expect(screen.getByText('동네공원')).toBeInTheDocument();
    unmount();

    render(<HealingQuiz isOpen onClose={vi.fn()} onSelectSite={vi.fn()} />);
    await answerAll('1박2일');
    await waitFor(() => expect(document.getElementById('plan-cards')).toBeTruthy());
    fireEvent.click(document.getElementById('plan-card-가까운성지')!);
    await waitFor(() => expect(document.getElementById('plan-day2')).toBeTruthy());
    expect(screen.getByText('동네식당')).toBeInTheDocument();
  });

  it('오후 관광지가 붐빌 예정이면 안내 + 「바꾸기」, 누르면 오후 줄만 바뀐다', async () => {
    afternoonBusy = true;
    render(<HealingQuiz isOpen onClose={vi.fn()} onSelectSite={vi.fn()} />);
    await answerAll();
    await waitFor(() => expect(document.getElementById('plan-cards')).toBeTruthy());
    fireEvent.click(document.getElementById('plan-card-가까운성지')!);
    await waitFor(() => expect(document.getElementById('plan-swap-afternoon')).toBeTruthy());
    expect(screen.getByText('붐비는곳')).toBeInTheDocument();
    expect(document.getElementById('plan-congestion')!.textContent).toContain('85%');
    fireEvent.click(document.getElementById('plan-swap-afternoon')!);
    await waitFor(() => expect(screen.getByText('한적한곳')).toBeInTheDocument());
    expect(document.getElementById('plan-swap-afternoon')).toBeNull();
    expect(screen.getByText('가까운성지')).toBeInTheDocument();
  });

  it('반경 안 후보가 3장보다 많으면 「더 보기」가 다음 3장을 준다', async () => {
    poolMock.mockResolvedValue({
      pool: [pooled('a', 1), pooled('b', 2), pooled('c', 3), pooled('d', 4), pooled('e', 5)],
      moreInNextRadius: 0,
    });
    render(<HealingQuiz isOpen onClose={vi.fn()} onSelectSite={vi.fn()} />);
    await answerAll();
    await waitFor(() => expect(document.getElementById('plan-more')).toBeTruthy());
    fireEvent.click(document.getElementById('plan-more')!);
    await waitFor(() => expect(document.getElementById('plan-card-d')).toBeTruthy());
    expect(document.querySelectorAll('#plan-cards li')).toHaveLength(2);
    // 바닥 — 더 보기 대신 시간·마음 바꾸기
    expect(document.getElementById('plan-more')).toBeNull();
    expect(document.getElementById('plan-widen-time')).toBeTruthy();
    expect(document.getElementById('plan-change-mood')).toBeTruthy();
  });

  it('카드가 3장 미만이면 「시간을 늘리면 N곳」 안내, 시간 버튼은 질문 4로 돌아간다 — 반경을 몰래 넓히지 않는다', async () => {
    poolMock.mockResolvedValue({ pool: [pooled('하나뿐', 9)], moreInNextRadius: 4 });
    render(<HealingQuiz isOpen onClose={vi.fn()} onSelectSite={vi.fn()} />);
    await answerAll('반나절');
    await waitFor(() => expect(document.getElementById('plan-cards')).toBeTruthy());
    expect(document.querySelectorAll('#plan-cards li')).toHaveLength(1);
    expect(screen.getByText(/시간을 늘리면 4곳/)).toBeInTheDocument();
    expect(poolMock).toHaveBeenCalledOnce();
    fireEvent.click(document.getElementById('plan-widen-time')!);
    await waitFor(() => expect(document.getElementById('quiz-time-하루')).toBeTruthy());
    // 답은 유지된다 — 반나절이 아직 선택돼 있고 다음으로 진행 가능
    expect(document.getElementById('quiz-next')).not.toBeDisabled();
  });

  it('후보가 0곳이면 「없어요」 화면 + 두 버튼, 마음 버튼은 질문 1로', async () => {
    poolMock.mockResolvedValue({ pool: [], moreInNextRadius: 2 });
    render(<HealingQuiz isOpen onClose={vi.fn()} onSelectSite={vi.fn()} />);
    await answerAll('반나절');
    await waitFor(() => expect(document.getElementById('plan-empty')).toBeTruthy());
    expect(screen.getByText(/서울에서 20km 안에/)).toBeInTheDocument();
    fireEvent.click(document.getElementById('plan-change-mood')!);
    await waitFor(() => expect(document.getElementById('quiz-emotion-평온')).toBeTruthy());
  });

  it('현재 위치가 허용되면 그 좌표가 출발지가 된다', async () => {
    gps.status = 'granted';
    gps.location = { lat: 36.0, lng: 127.0 };
    render(<HealingQuiz isOpen onClose={vi.fn()} onSelectSite={vi.fn()} />);
    click('시작하기');
    await waitFor(() => expect(document.getElementById('quiz-emotion-평온')).toBeTruthy());
    fireEvent.click(document.getElementById('quiz-emotion-평온')!);
    next();
    await waitFor(() => expect(document.getElementById('quiz-concern-일과 진로')).toBeTruthy());
    fireEvent.click(document.getElementById('quiz-concern-일과 진로')!);
    next();
    await waitFor(() => expect(document.getElementById('quiz-gps')).toBeTruthy());
    // 시·도를 고르지 않아도 다음으로 갈 수 있다
    expect(document.getElementById('quiz-next')).not.toBeDisabled();
    next();
    await waitFor(() => expect(document.getElementById('quiz-time-하루')).toBeTruthy());
    fireEvent.click(document.getElementById('quiz-time-하루')!);
    next();
    await waitFor(() => expect(document.querySelector('button[id^="quiz-party-"]')).toBeTruthy());
    fireEvent.click(document.querySelector<HTMLButtonElement>('button[id^="quiz-party-"]')!);
    next();
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeTruthy());
    next();
    await waitFor(() => expect(poolMock).toHaveBeenCalledOnce());
    expect(poolMock.mock.calls[0]![1]).toMatchObject({ kind: 'gps', lat: 36.0, lng: 127.0 });
  });

  it('닫으면 처음부터 다시 — 이전 답이 남지 않는다', async () => {
    const onClose = vi.fn();
    const { rerender } = render(<HealingQuiz isOpen onClose={onClose} onSelectSite={vi.fn()} />);
    click('시작하기');
    await waitFor(() => expect(document.getElementById('quiz-emotion-평온')).toBeTruthy());
    fireEvent.click(document.getElementById('quiz-emotion-평온')!);
    fireEvent.click(document.getElementById('quiz-close')!);
    expect(onClose).toHaveBeenCalled();
    rerender(<HealingQuiz isOpen onClose={onClose} onSelectSite={vi.fn()} />);
    await waitFor(() => expect(document.getElementById('quiz-start')).toBeTruthy());
  });
});
