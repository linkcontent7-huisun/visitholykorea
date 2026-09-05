import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TourApiError } from '@/shared/api/tour-api';
import { DICTIONARY } from '@/shared/i18n/dictionary';
import * as useSettingsModule from '@/shared/i18n/use-settings';
import * as useQuietSitesModule from '../hooks/use-quiet-sites';
import { TodayQuietSection } from './TodayQuietSection';

vi.mock('../hooks/use-quiet-sites');
vi.mock('@/shared/i18n/use-settings');

// 문구는 사전을 거치므로, 테스트도 실제 사전 값을 그대로 쓴다
vi.mocked(useSettingsModule.useSettings).mockReturnValue({
  language: 'ko',
  setLanguage: vi.fn(),
  largeText: false,
  setLargeText: vi.fn(),
  origin: null,
  setOrigin: vi.fn(),
  t: ((key: keyof typeof DICTIONARY) => DICTIONARY[key].ko) as never,
  wideView: false,
});

function mockQuietSites(overrides: Partial<ReturnType<typeof useQuietSitesModule.useQuietSites>>) {
  vi.mocked(useQuietSitesModule.useQuietSites).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    ...overrides,
  } as ReturnType<typeof useQuietSitesModule.useQuietSites>);
}

describe('TodayQuietSection — 한도 초과 안내', () => {
  it('일일 호출 한도 초과(코드 22)면 "잠시 후" 문구를 보여주고, API 원문은 감춘다', () => {
    mockQuietSites({
      isError: true,
      error: new TourApiError('TourAPI 오류: LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR', '22'),
    });
    render(<TodayQuietSection sites={[]} />);
    expect(screen.getByText(/오늘 조회 한도/)).toBeInTheDocument();
    expect(screen.queryByText(/LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR/)).not.toBeInTheDocument();
  });

  it('그 밖의 오류는 기존처럼 일반 오류 문구와 원문을 보여준다', () => {
    mockQuietSites({
      isError: true,
      error: new Error('네트워크 오류'),
    });
    render(<TodayQuietSection sites={[]} />);
    expect(screen.getByText('오늘의 붐빔을 계산하지 못했어요')).toBeInTheDocument();
    expect(screen.getByText('네트워크 오류')).toBeInTheDocument();
    expect(screen.queryByText(/오늘 조회 한도/)).not.toBeInTheDocument();
  });
});
