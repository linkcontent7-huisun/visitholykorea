import { describe, expect, it, vi } from 'vitest';
import { deleteAccountData } from '../supabase/functions/_shared/delete-account';

describe('계정 삭제', () => {
  it('중첩 폴더의 사진을 모두 지운 뒤 연결 기록과 계정을 삭제한다', async () => {
    const calls: string[] = [];
    const entries: Record<string, { name: string; id: string | null }[]> = {
      user: [
        { name: 'site.jpg', id: 'photo' },
        { name: 'stamp', id: null },
      ],
      'user/stamp': [{ name: '1.jpg', id: 'nested-photo' }],
    };
    const deps = {
      listPhotos: vi.fn(async (prefix: string, offset: number) => {
        calls.push(`list:${prefix}:${offset}`);
        return (entries[prefix] ?? []).slice(offset, offset + 100);
      }),
      removePhotos: vi.fn(async (paths: string[]) => {
        calls.push(`remove:${paths.join(',')}`);
      }),
      deleteRows: vi.fn(async (table: string) => {
        calls.push(`rows:${table}`);
      }),
      deleteUser: vi.fn(async () => {
        calls.push('user');
      }),
    };

    await deleteAccountData('user', deps);

    expect(deps.removePhotos).toHaveBeenCalledWith(['user/site.jpg', 'user/stamp/1.jpg']);
    expect(calls.indexOf('user')).toBeGreaterThan(
      calls.indexOf('remove:user/site.jpg,user/stamp/1.jpg'),
    );
    expect(calls).toContain('rows:events');
    expect(calls).toContain('rows:visit_note_reports');
    expect(calls).toContain('rows:rest_spot_reports');
  });

  it('사진 삭제가 실패하면 계정을 삭제하지 않는다', async () => {
    const deps = {
      listPhotos: vi.fn(async () => [{ name: 'site.jpg', id: 'photo' }]),
      removePhotos: vi.fn(async () => {
        throw new Error('storage failed');
      }),
      deleteRows: vi.fn(async () => {}),
      deleteUser: vi.fn(async () => {}),
    };

    await expect(deleteAccountData('user', deps)).rejects.toThrow('storage failed');
    expect(deps.deleteUser).not.toHaveBeenCalled();
  });

  it('연결 기록 삭제가 실패하면 계정을 삭제하지 않는다', async () => {
    const deps = {
      listPhotos: vi.fn(async () => []),
      removePhotos: vi.fn(async () => {}),
      deleteRows: vi.fn(async () => {
        throw new Error('database failed');
      }),
      deleteUser: vi.fn(async () => {}),
    };

    await expect(deleteAccountData('user', deps)).rejects.toThrow('database failed');
    expect(deps.deleteUser).not.toHaveBeenCalled();
  });
});
