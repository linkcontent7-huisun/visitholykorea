import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { DICTIONARY } from '@/shared/i18n/dictionary';
import { NewPlaceSheet } from './NewPlaceSheet';

/** 「내 장소」에 이미 있는 성지를 올리던 일(수리산 성지, 2026-11-22 점검)을 막는 안내 */

const ko = (key: string) => (DICTIONARY as Record<string, Record<string, string>>)[key]?.ko ?? key;
vi.mock('@/shared/i18n/use-settings', () => ({ useSettings: () => ({ language: 'ko', t: ko }) }));
vi.mock('@/shared/hooks/use-debounced-value', () => ({ useDebouncedValue: <T,>(v: T) => v }));
vi.mock('@/shared/hooks/use-modal-focus', () => ({ useModalFocus: () => ({ current: null }) }));
vi.mock('@/features/directory/hooks/use-nearby-directory', () => ({
  useDirectorySearch: () => ({ data: [] }),
}));
vi.mock('../hooks/use-places', () => ({
  useCreatePlace: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
const searched: string[] = [];
vi.mock('@/features/sites/hooks/use-sites', () => ({
  useSiteSearch: (term: string) => {
    searched.push(term);
    return { data: term === '수리산' ? [{ id: 'suri', name: '수리산 성지' }] : [] };
  },
}));

function Where() {
  const loc = useLocation();
  return <p data-testid="where">{loc.pathname + loc.hash}</p>;
}

describe('내 장소 — 이미 있는 성지 안내', () => {
  it('「수리산성지」를 치면 이미 있는 성지로 알려 주고, 누르면 칸을 닫고 그 성지 기록 칸으로 간다', () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter initialEntries={['/records']}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <NewPlaceSheet isOpen onClose={onClose} />
                <Where />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText(new RegExp(ko('placeName'))), {
      target: { value: '수리산성지' },
    });
    expect(searched).toContain('수리산'); // 붙여 쓴 「성지」를 떼고 찾는다
    expect(screen.getByText(ko('placeExistingSite'))).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /수리산 성지/ }));
    expect(onClose).toHaveBeenCalled();
    expect(screen.getByTestId('where')).toHaveTextContent('/sites/suri#reviews-heading');
  });

  it('성지 목록에 없는 이름이면 안내가 나오지 않는다', () => {
    render(
      <MemoryRouter>
        <NewPlaceSheet isOpen onClose={() => {}} />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText(new RegExp(ko('placeName'))), {
      target: { value: '서귀포성당' },
    });
    expect(screen.queryByText(ko('placeExistingSite'))).toBeNull();
  });
});
