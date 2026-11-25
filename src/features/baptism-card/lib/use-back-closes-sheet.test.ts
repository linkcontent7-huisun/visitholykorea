import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useBackClosesSheet } from './use-back-closes-sheet';

/** jsdom 의 history.back() 은 popstate 를 비동기로 보낸다 */
const tick = () => new Promise((r) => setTimeout(r, 20));

describe('세례명 카드 창과 뒤로 가기', () => {
  it('열면 기록 한 칸이 쌓이고, 뒤로 가기는 창만 닫는다', async () => {
    const onClose = vi.fn();
    const before = window.history.length;
    const { rerender } = renderHook(({ open }) => useBackClosesSheet(open, onClose), { initialProps: { open: true } });
    expect(window.history.length).toBe(before + 1);
    window.history.back();
    await tick();
    expect(onClose).toHaveBeenCalledTimes(1);
    rerender({ open: false });
    await tick();
    // 이미 빠졌으니 한 칸 더 되돌리지 않는다
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('닫기 단추로 닫으면 쌓은 칸을 되돌린다(창 닫기 신호는 다시 부르지 않는다)', async () => {
    const onClose = vi.fn();
    const { rerender } = renderHook(({ open }) => useBackClosesSheet(open, onClose), { initialProps: { open: true } });
    const during = window.location.href;
    rerender({ open: false });
    await tick();
    expect(onClose).not.toHaveBeenCalled();
    expect(window.location.href).toBe(during);
  });

  it('닫혀 있으면 아무것도 하지 않는다', () => {
    const onClose = vi.fn();
    const before = window.history.length;
    renderHook(() => useBackClosesSheet(false, onClose));
    expect(window.history.length).toBe(before);
  });
});
