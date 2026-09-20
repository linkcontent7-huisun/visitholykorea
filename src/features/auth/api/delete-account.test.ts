import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSession = vi.fn();
const invoke = vi.fn();
const signOut = vi.fn();
vi.mock('@/shared/api/supabase', () => ({
  supabase: {
    auth: { getSession: () => getSession(), signOut: (...args: unknown[]) => signOut(...args) },
    functions: { invoke: (...args: unknown[]) => invoke(...args) },
  },
}));

import { deleteMyAccount } from './auth';

describe('내 계정 삭제 요청', () => {
  beforeEach(() => {
    getSession.mockReset();
    invoke.mockReset();
    signOut.mockReset();
  });

  it('로그인하지 않았다면 삭제 요청을 보내지 않는다', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    expect((await deleteMyAccount()).success).toBe(false);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('서버 삭제가 실패하면 로그아웃하지 않아 재시도할 수 있다', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'token' } }, error: null });
    invoke.mockResolvedValue({ data: null, error: new Error('failed') });
    expect((await deleteMyAccount()).success).toBe(false);
    expect(signOut).not.toHaveBeenCalled();
  });

  it('서버 삭제가 끝난 뒤에만 로컬 세션을 지운다', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'token' } }, error: null });
    invoke.mockResolvedValue({ data: { success: true }, error: null });
    signOut.mockResolvedValue({ error: null });

    expect((await deleteMyAccount()).success).toBe(true);
    expect(invoke).toHaveBeenCalledWith('delete-account', {
      method: 'POST',
      headers: { Authorization: 'Bearer token' },
    });
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  });
});
