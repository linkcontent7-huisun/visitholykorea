import type { Session } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/api/supabase', () => ({ supabase: { auth: { onAuthStateChange: vi.fn() } } }));

import {
  cleanPilgrimName,
  PILGRIM_NAME_KEY,
  pilgrimNameOf,
  writePilgrimName,
} from './pilgrim-name';

const sessionWith = (meta: Record<string, unknown>, email = 'a@example.com') =>
  ({ user: { email, user_metadata: meta } }) as unknown as Session;

describe('3D 에 넘기는 순례자 이름 (2026-11-22)', () => {
  it('이모지·줄바꿈·기호를 빼고 9자로 자른다', () => {
    expect(cleanPilgrimName('  마리아 🙏\n순례자!!  ')).toBe('마리아 순례자');
    expect(cleanPilgrimName('가나다라마바사아자차카')).toBe('가나다라마바사아자');
    expect(cleanPilgrimName('🙏🙏')).toBeNull();
    expect(cleanPilgrimName(undefined)).toBeNull();
  });

  it('이름이 없으면 이메일로 대신하지 않는다', () => {
    expect(pilgrimNameOf(sessionWith({}))).toBeNull();
    expect(pilgrimNameOf(sessionWith({ name: '세실리아' }))).toBe('세실리아');
    expect(pilgrimNameOf(null)).toBeNull();
  });

  it('로그인하면 쓰고, 로그아웃(이름 없음)하면 지운다', () => {
    const box = new Map<string, string>();
    const storage = {
      setItem: (k: string, v: string) => box.set(k, v),
      removeItem: (k: string) => box.delete(k),
    } as unknown as Storage;
    writePilgrimName('세실리아', storage);
    expect(box.get(PILGRIM_NAME_KEY)).toBe('세실리아');
    writePilgrimName(null, storage);
    expect(box.has(PILGRIM_NAME_KEY)).toBe(false);
  });

  it('저장소가 막혀도 오류를 내지 않는다', () => {
    const broken = {
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    expect(() => writePilgrimName('마리아', broken)).not.toThrow();
  });
});
