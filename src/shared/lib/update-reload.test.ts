import { describe, expect, it, vi } from 'vitest';
import { reloadIfUpdateReady } from './update-reload';

const fakeWindow = (ready: boolean) => {
  const reload = vi.fn();
  return { win: { vhkUpdateReady: ready, location: { reload } } as unknown as Window, reload };
};

describe('새 판은 화면을 옮길 때만 반영', () => {
  it('새 판이 없으면 새로고침하지 않는다', () => {
    const { win, reload } = fakeWindow(false);
    expect(reloadIfUpdateReady(win)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
  it('새 판이 있으면 한 번만 새로고침한다', () => {
    const { win, reload } = fakeWindow(true);
    expect(reloadIfUpdateReady(win)).toBe(true);
    expect(reloadIfUpdateReady(win)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
