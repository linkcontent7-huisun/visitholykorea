import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

const html = readFileSync(resolve(process.cwd(), 'public/kakao-login.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? '';

function openPage(search: string, authorize: ReturnType<typeof vi.fn>, hash = '') {
  const page = new DOMParser().parseFromString(html, 'text/html');
  const kakao = { isInitialized: () => false, init: vi.fn(), Auth: { authorize } };
  new Function('window', 'document', 'location', 'Kakao', script)(
    { Kakao: kakao },
    page,
    { search, hash },
    kakao,
  );
  return { page, kakao };
}

describe('카카오 모바일 로그인 화면', () => {
  it('서비스워커가 가로채지 않도록 주소의 # 뒤에 실은 인증값을 읽는다', () => {
    const authorize = vi.fn();
    const { kakao } = openPage(
      '',
      authorize,
      '#state=fragment-state&js_key=public-key&redirect_uri=https%3A%2F%2Fproject.supabase.co%2Ffunctions%2Fv1%2Fkakao-auth%2Fcallback',
    );

    expect(kakao.init).toHaveBeenCalledWith('public-key');
    expect(authorize).toHaveBeenCalledWith({
      redirectUri: 'https://project.supabase.co/functions/v1/kakao-auth/callback',
      state: 'fragment-state',
      throughTalk: true,
    });
  });

  it('앱 도메인에서 카카오 SDK로 인증을 시작한다', () => {
    const authorize = vi.fn();
    const { page, kakao } = openPage(
      '?state=test-state&js_key=public-key&redirect_uri=https%3A%2F%2Fproject.supabase.co%2Ffunctions%2Fv1%2Fkakao-auth%2Fcallback',
      authorize,
    );

    expect(kakao.init).toHaveBeenCalledWith('public-key');
    expect(authorize).toHaveBeenCalledWith({
      redirectUri: 'https://project.supabase.co/functions/v1/kakao-auth/callback',
      state: 'test-state',
      throughTalk: true,
    });
    expect(page.querySelector('button')?.textContent).toContain('카카오톡');
    page.getElementById('retry')?.click();
    expect(authorize).toHaveBeenCalledTimes(2);
  });

  it('잘못된 콜백 주소로는 인증을 시작하지 않는다', () => {
    const authorize = vi.fn();
    const { page } = openPage(
      '?state=test-state&js_key=public-key&redirect_uri=https%3A%2F%2Fevil.example%2Fcallback',
      authorize,
    );

    expect(authorize).not.toHaveBeenCalled();
    expect(page.getElementById('message')?.textContent).toContain('열지 못했습니다');
  });
});
