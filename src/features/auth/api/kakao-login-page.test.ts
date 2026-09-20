import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

const html = readFileSync(resolve(process.cwd(), 'public/kakao-login.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? '';

const 콜백 = 'https://project.supabase.co/functions/v1/kakao-auth/callback';
const 정상해시 = `#state=test-state&js_key=public-key&redirect_uri=${encodeURIComponent(콜백)}`;

function openPage(hash: string, authorize: ReturnType<typeof vi.fn>, search = '') {
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
  // 크롬은 사용자가 직접 누른 직후가 아닌 외부 앱 실행(intent:)을 조용히 막는다.
  // 이 화면은 이동해 온 화면이라 늘 그 경우여서, 저절로 열지 않고 한 번 더 누르게 한다.
  it('화면을 열자마자 카카오로 보내지 않는다 — 누를 곳 두 개를 보여준다', () => {
    const authorize = vi.fn();
    const { page } = openPage(정상해시, authorize);

    expect(authorize).not.toHaveBeenCalled();
    expect(page.getElementById('talk')?.textContent).toContain('카카오톡');
    expect(page.getElementById('account')?.textContent).toContain('카카오 계정');
    expect(page.getElementById('choices')?.hidden).toBe(false);
  });

  it('「카카오톡으로 로그인」을 누르면 카카오톡 앱으로 연다', () => {
    const authorize = vi.fn();
    const { page, kakao } = openPage(정상해시, authorize);

    page.getElementById('talk')?.click();

    expect(kakao.init).toHaveBeenCalledWith('public-key');
    expect(authorize).toHaveBeenCalledWith({
      redirectUri: 콜백,
      state: 'test-state',
      throughTalk: true,
    });
  });

  it('「카카오 계정으로 로그인」을 누르면 카카오 웹 로그인으로 간다', () => {
    const authorize = vi.fn();
    const { page } = openPage(정상해시, authorize);

    page.getElementById('account')?.click();

    expect(authorize).toHaveBeenCalledWith({
      redirectUri: 콜백,
      state: 'test-state',
      throughTalk: false,
    });
  });

  it('서비스워커가 가로채지 않도록 주소의 # 뒤에 실은 인증값을 읽는다', () => {
    const authorize = vi.fn();
    const { page } = openPage(
      '#state=fragment-state&js_key=public-key&redirect_uri=' + encodeURIComponent(콜백),
      authorize,
    );

    page.getElementById('talk')?.click();

    expect(authorize).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'fragment-state', redirectUri: 콜백 }),
    );
  });

  it('# 가 없으면 예전 방식대로 ? 뒤의 값도 읽는다', () => {
    const authorize = vi.fn();
    const { page } = openPage(
      '',
      authorize,
      '?state=query-state&js_key=public-key&redirect_uri=' + encodeURIComponent(콜백),
    );

    page.getElementById('talk')?.click();

    expect(authorize).toHaveBeenCalledWith(expect.objectContaining({ state: 'query-state' }));
  });

  it('잘못된 콜백 주소로는 인증을 시작하지 않는다', () => {
    const authorize = vi.fn();
    const { page } = openPage(
      '#state=test-state&js_key=public-key&redirect_uri=https%3A%2F%2Fevil.example%2Fcallback',
      authorize,
    );

    expect(page.getElementById('message')?.textContent).toContain('열지 못했습니다');
    expect(page.getElementById('choices')?.hidden).toBe(true);

    page.getElementById('talk')?.click();
    expect(authorize).not.toHaveBeenCalled();
  });
});
