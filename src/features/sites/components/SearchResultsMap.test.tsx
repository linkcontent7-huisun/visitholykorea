import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import shapes from '@/features/map/data/diocese-shapes.json';
import { DIOCESE_INFO } from '@/features/map/data/diocese-info';
import { DICTIONARY } from '@/shared/i18n/dictionary';
import type { HolySite } from '@/shared/types/domain';
import { SearchResultsMap } from './SearchResultsMap';

/** 성지 찾기 지도의 교구 판 — 15개 교구를 모두 눌러 설명 카드가 뜨는지 (지시서 10호) */
vi.mock('@/shared/i18n/use-settings', () => ({
  useSettings: () => ({
    language: 'ko',
    t: (key: string) => (DICTIONARY as Record<string, Record<string, string>>)[key]?.ko ?? key,
  }),
}));

const site = (id: string, region: string, lat: number, lng: number) =>
  ({ id, name: id, region, coordinates: { lat, lng } }) as unknown as HolySite;

const SITES = [
  site('a', '대전', 36.7, 126.8),
  site('b', '대전', 36.3, 127.4),
  site('c', '서울', 37.56, 126.98),
];

function renderMap() {
  return render(
    <SearchResultsMap
      sites={SITES}
      matchedIds={new Set()}
      hasActiveSearch={false}
      selectedId={null}
    />,
  );
}

describe('교구 설명 자료', () => {
  it('지도에 그린 15개 교구마다 설명이 하나씩 있다', () => {
    const drawn = (shapes as { diocese: string }[]).map((s) => s.diocese).sort();
    expect(DIOCESE_INFO.map((d) => d.key).sort()).toEqual(drawn);
    expect(DIOCESE_INFO).toHaveLength(15);
  });
});

describe('성지 찾기 교구 지도', () => {
  it('처음에는 안내와 «교구란?» 만 보인다', () => {
    renderMap();
    expect(screen.getByText(DICTIONARY.dioceseMapHint.ko)).toBeInTheDocument();
    expect(screen.getByText(DICTIONARY.dioceseWhat.ko)).toBeInTheDocument();
  });

  // 15번 눌러 보는 시험이라 전체 시험을 병렬로 돌리면 기본 5초를 넘길 때가 있다(팀장 창, 2026-11-25) — 넉넉히 20초
  it('15개 교구를 하나씩 누르면 그 교구의 설명 카드가 뜬다', { timeout: 20_000 }, () => {
    renderMap();
    for (const info of DIOCESE_INFO) {
      fireEvent.click(screen.getByRole('button', { name: info.name.ko }));
      const card = screen.getByRole('heading', { name: info.name.ko }).closest('section')!;
      expect(within(card).getByText(info.about.ko)).toBeInTheDocument();
      expect(within(card).getByText(String(info.founded))).toBeInTheDocument();
    }
  });

  it('성지 수는 넘겨받은 성지에서 센다 — 대전 2곳', () => {
    renderMap();
    fireEvent.click(screen.getByRole('button', { name: '대전교구' }));
    const card = screen.getByRole('heading', { name: '대전교구' }).closest('section')!;
    expect(within(card).getByText('2곳')).toBeInTheDocument();
  });

  it('키보드(Enter)로도 고르고, 같은 교구를 다시 누르면 닫힌다', () => {
    renderMap();
    const seoul = screen.getByRole('button', { name: '서울대교구' });
    fireEvent.keyDown(seoul, { key: 'Enter' });
    expect(seoul).toHaveAttribute('aria-pressed', 'true');
    fireEvent.keyDown(seoul, { key: ' ' });
    expect(seoul).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(DICTIONARY.dioceseMapHint.ko)).toBeInTheDocument();
  });
});
