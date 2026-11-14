import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DICTIONARY } from '@/shared/i18n/dictionary';
import type { HolySite } from '@/shared/types/domain';
import { SiteNotesSection } from './SiteNotesSection';

/**
 * 성지 상세의 「순례 기록」 절 — #102 에서 SiteDetailPage 에서 떼어 내며 붙인 테스트.
 * 기록 쓰기·내 기록 수정·남의 기록 신고가 그대로 동작하는지 본다. DB 훅은 전부 모킹.
 */

const ko = (key: string) => (DICTIONARY as Record<string, Record<string, string>>)[key]?.ko ?? key;
vi.mock('@/shared/i18n/use-settings', () => ({
  useSettings: () => ({ language: 'ko', t: ko }),
}));
vi.mock('@/shared/hooks/use-unsaved-changes-guard', () => ({
  useUnsavedChangesGuard: () => undefined,
}));

const addMutate = vi.fn();
const reportMutate = vi.fn();
const updateMutate = vi.fn();
const state = {
  myStamp: null as null | Record<string, unknown>,
  notes: [] as Array<Record<string, unknown>>,
};
const mutation = (mutate: ReturnType<typeof vi.fn>) => ({ mutate, isPending: false });
vi.mock('@/features/passport/hooks/use-stamps', () => ({
  useMyStamp: () => ({ data: state.myStamp }),
  useMyStamps: () => ({ data: [] }),
  useSiteNotes: () => ({ data: state.notes }),
  useAddStamp: () => mutation(addMutate),
  useReportNote: () => mutation(reportMutate),
  useUpdateStamp: () => mutation(updateMutate),
  useUploadStampPhotos: () => mutation(vi.fn()),
  useDeleteStampPhoto: () => mutation(vi.fn()),
}));
vi.mock('@/features/passport/api/stamps.repository', () => ({
  isVisitedOnAvailable: () => false,
  recordNoteReads: vi.fn(),
  getMyStamps: vi.fn(async () => []),
}));

const site = { id: 'site-1', name: '명동대성당', category: '성당' } as unknown as HolySite;
const othersNote = {
  id: 'n-other',
  note: '고요했어요',
  photos: [],
  photoUrl: null,
  visitedAt: '2026-11-01',
};
const myNote = {
  id: 'n-mine',
  note: '다시 오고 싶다',
  photos: [],
  photoUrl: null,
  visitedAt: '2026-11-02',
};

const renderSection = () =>
  render(
    <MemoryRouter>
      <SiteNotesSection site={site} />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  // jsdom 에는 matchMedia 가 없다 — 사진 정책(photoPolicy)이 기기 종류를 물을 때 쓴다
  window.matchMedia ??= (query: string) => ({ matches: false, media: query }) as MediaQueryList;
  state.myStamp = null;
  state.notes = [];
});

describe('SiteNotesSection', () => {
  it('한 줄을 쓰기 전엔 저장이 꺼져 있고, 쓰면 기록(스탬프)을 만든다', () => {
    renderSection();
    const submit = screen.getByRole('button', { name: ko('noteSubmit') });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText(ko('noteAriaLabel')), {
      target: { value: '  마음이 고요해졌다  ' },
    });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);

    expect(addMutate).toHaveBeenCalledTimes(1);
    expect(addMutate.mock.calls[0]![0]).toMatchObject({ note: '마음이 고요해졌다' });
  });

  it('이미 한 줄을 남겼으면 입력 칸 대신 목록에서 내 것에 수정 단추가 붙는다', () => {
    state.myStamp = {
      id: 'n-mine',
      note: myNote.note,
      photos: [],
      visitedOn: null,
      visitedAt: null,
      crowdLevel: null,
    };
    state.notes = [myNote, othersNote];
    renderSection();

    expect(screen.queryByLabelText(ko('noteAriaLabel'))).toBeNull();
    expect(screen.getByText(ko('noteMine'))).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: ko('recordsEdit') }));
    expect(screen.getByDisplayValue(myNote.note)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: ko('recordsSave') }));
    expect(updateMutate.mock.calls[0]![0]).toMatchObject({ stampId: 'n-mine', note: myNote.note });

    fireEvent.click(screen.getByRole('button', { name: ko('recordsCancel') }));
    expect(screen.queryByDisplayValue(myNote.note)).toBeNull();
  });

  it('남의 기록은 확인을 받고 신고하며, 한 번 신고하면 단추가 꺼진다', () => {
    state.notes = [othersNote];
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderSection();

    const report = screen.getByRole('button', { name: ko('reportAction') });
    fireEvent.click(report);

    expect(confirm).toHaveBeenCalledWith(ko('reportConfirm'));
    expect(reportMutate).toHaveBeenCalledWith('n-other');
    expect(report).toBeDisabled();
    expect(report).toHaveTextContent(ko('reportedAction'));
  });
});
