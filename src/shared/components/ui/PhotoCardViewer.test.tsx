import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DICTIONARY } from '@/shared/i18n/dictionary';
import { PhotoCardViewer } from './PhotoCardViewer';

/**
 * 카드 안 사진 보기 — 모달이 아니라 카드 안에 그려지는지, 넘기기·닫기가 되는지.
 */

vi.mock('@/shared/i18n/use-settings', () => ({
  useSettings: () => ({
    language: 'ko',
    t: (key: string) => {
      const entry = (DICTIONARY as Record<string, Record<string, string>>)[key];
      return entry?.ko ?? key;
    },
  }),
}));

const PHOTOS = ['https://example.test/1.jpg', 'https://example.test/2.jpg'];

describe('PhotoCardViewer', () => {
  it('photos 가 null 이면 아무것도 그리지 않는다', () => {
    const { container } = render(
      <PhotoCardViewer photos={null} index={0} onIndexChange={vi.fn()} onClose={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('카드 안(absolute inset-0)에 그려지고 role=dialog 가 아니다', () => {
    render(
      <li style={{ position: 'relative' }}>
        <PhotoCardViewer photos={PHOTOS} index={0} onIndexChange={vi.fn()} onClose={vi.fn()} />
      </li>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    const group = screen.getByRole('group', { name: '사진 확대해서 보기' });
    expect(group.className).toContain('absolute inset-0');
    expect(group.closest('li')).not.toBeNull();
    expect(screen.getByRole('img')).toHaveAttribute('src', PHOTOS[0]);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('다음·이전 단추와 화살표 키로 넘기고, Esc 와 닫기 단추로 닫는다', () => {
    const onIndexChange = vi.fn();
    const onClose = vi.fn();
    render(
      <PhotoCardViewer photos={PHOTOS} index={0} onIndexChange={onIndexChange} onClose={onClose} />,
    );
    // 첫 장이라 「이전」은 없다
    expect(screen.queryByRole('button', { name: '이전 사진' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '다음 사진' }));
    expect(onIndexChange).toHaveBeenCalledWith(1);

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(onIndexChange).toHaveBeenLastCalledWith(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getAllByRole('button', { name: '닫기' })[1]!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
