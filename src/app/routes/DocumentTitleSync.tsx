import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { HOME_TITLE, titleFromHeading } from './document-title';

/**
 * 브라우저 탭 제목을 화면마다 바꾼다 (2026-11-03, 11/2 점검 「모든 화면의 탭 제목이 같다」).
 *
 * 화면마다 훅을 심는 대신 첫 h1 을 읽는다 — 모든 화면이 공용 PageHeader·자체 h1 로 제목을 이미
 * 그리고, 고른 언어로 번역돼 있어 따로 문구를 만들 필요가 없다. 화면은 lazy 로 늦게 그려지므로
 * DOM 변화를 지켜보다가 h1 이 나타나거나 바뀌면 고친다.
 *
 * 처음 열린 주소는 건드리지 않는다: 성지·코스 주소는 빌드 때 검색용 제목(seo_title)을 HTML 에
 * 넣어 두었고(scripts/seo-prerender.ts), 그것이 h1 보다 검색에 맞춘 문구다.
 */
export function DocumentTitleSync() {
  const { pathname } = useLocation();
  const first = useRef<{ path: string; title: string } | null>(null);
  if (first.current === null && typeof document !== 'undefined') {
    first.current = { path: pathname, title: document.title };
  }

  useEffect(() => {
    const initial = first.current;
    if (pathname === '/') {
      document.title = initial?.path === '/' ? initial.title : HOME_TITLE;
      return;
    }
    // 처음 연 성지·코스 주소 — 빌드 때 넣은 검색용 제목 그대로(다른 화면에서 돌아와도 복원)
    // 단, 서비스 워커가 캐시한 껍데기(index.html)로 열리면 기본 제목이 오므로 그때는 h1 을 쓴다(11/3 실측).
    if (initial && pathname === initial.path && initial.title !== HOME_TITLE) {
      document.title = initial.title;
      return;
    }
    const apply = () => {
      const next = titleFromHeading(document.querySelector('h1')?.textContent, pathname);
      if (next && document.title !== next) document.title = next;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
