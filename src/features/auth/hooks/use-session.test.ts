import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSession = vi.fn();
vi.mock('@/shared/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => getSession(),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

import { useSession } from './use-session';

describe('useSession', () => {
  beforeEach(() => getSession.mockReset());

  it('다른 창에서 로그인이 끝나 이 창이 다시 보이면 세션을 다시 읽는다', async () => {
    // 처음엔 세션 없음 → 창이 다시 보일 때는 세션 있음 (다른 창이 저장해 둔 상태)
    getSession
      .mockResolvedValueOnce({ data: { session: null } })
      .mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });

    const { result } = renderHook(() => useSession());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.session).toBeNull();

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await waitFor(() => expect(result.current.session?.user.id).toBe('u1'));
  });

  it('저장소가 바뀌어도(다른 탭 로그인) 다시 읽는다', async () => {
    getSession
      .mockResolvedValueOnce({ data: { session: null } })
      .mockResolvedValue({ data: { session: { user: { id: 'u2' } } } });
    const { result } = renderHook(() => useSession());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'sb-x-auth-token' }));
    });
    await waitFor(() => expect(result.current.session?.user.id).toBe('u2'));
  });
});
