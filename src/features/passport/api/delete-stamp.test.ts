import { beforeEach, describe, expect, it, vi } from 'vitest';

const calls: string[] = [];
const remove = vi.fn();
const selectResult = vi.fn();
vi.mock('@/shared/api/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'user' } } }) },
    storage: { from: () => ({ remove: (...args: unknown[]) => remove(...args) }) },
    from: () => ({
      select: () => ({
        eq: () => ({ eq: () => ({ maybeSingle: () => selectResult() }) }),
      }),
      delete: () => ({
        eq: () => ({ eq: async () => { calls.push('delete-row'); return { error: null }; } }),
      }),
    }),
  },
}));

import { deleteStamp } from './stamps.repository';

describe('순례 기록 삭제', () => {
  beforeEach(() => {
    calls.length = 0;
    remove.mockReset();
    selectResult.mockReset();
    selectResult.mockResolvedValue({
      data: {
        photo_url: 'https://example.com/storage/v1/object/public/pilgrim-photos/user/site.jpg',
        stamp_photos: [{ url: 'https://example.com/storage/v1/object/public/pilgrim-photos/user/site/1.jpg' }],
      },
      error: null,
    });
  });

  it('공개 사진 원본을 먼저 지운 뒤 기록을 삭제한다', async () => {
    remove.mockImplementation(async () => { calls.push('remove-photos'); return { error: null }; });
    expect((await deleteStamp('stamp')).success).toBe(true);
    expect(remove).toHaveBeenCalledWith(['user/site.jpg', 'user/site/1.jpg']);
    expect(calls).toEqual(['remove-photos', 'delete-row']);
  });

  it('사진을 지우지 못했다면 기록을 남겨 재시도할 수 있게 한다', async () => {
    remove.mockResolvedValue({ error: new Error('storage failed') });
    expect((await deleteStamp('stamp')).success).toBe(false);
    expect(calls).not.toContain('delete-row');
  });
});
