import { describe, expect, it } from 'vitest';
import { hasEmailPassword } from './auth';

describe('hasEmailPassword — 비밀번호 칸을 보여 줄 계정인가', () => {
  it('이메일로 가입한 계정만 true', () => {
    expect(hasEmailPassword({ identities: [{ provider: 'email' }] })).toBe(true);
  });

  it('카카오·구글·네이버 계정은 false — 비밀번호가 없으니 칸을 그리지 않는다', () => {
    expect(hasEmailPassword({ identities: [{ provider: 'google' }] })).toBe(false);
    expect(hasEmailPassword({ identities: [] })).toBe(false);
    expect(hasEmailPassword(null)).toBe(false);
  });
});
