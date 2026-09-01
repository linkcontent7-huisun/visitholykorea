import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import '@/shared/styles/globals.css';

/**
 * 배포 직후 "Failed to fetch dynamically imported module" 대응.
 *
 * 새 버전을 배포하면 청크 파일 이름(해시)이 바뀐다. 배포 전에 열어 둔 탭은
 * 옛 이름을 들고 있다가, 지연 로딩되는 페이지(성지 상세 등)로 이동하는 순간
 * 없는 파일을 찾으며 터진다 — 설문 링크를 받아 둔 분들이 정확히 이 경로로 들어온다.
 *
 * Vite 는 이 실패를 `vite:preloadError` 로 알려주므로, 한 번 새로고침해서
 * 새 버전을 받게 한다. sessionStorage 가드로 무한 새로고침을 막는다
 * (새로고침으로도 안 되는 실패라면 두 번째부터는 화면 오류로 드러나게 둔다).
 */
window.addEventListener('vite:preloadError', (event) => {
  const GUARD = 'chunk-reload-at';
  const last = Number(sessionStorage.getItem(GUARD) ?? 0);
  if (Date.now() - last < 10_000) return; // 10초 안에 또 실패하면 새로고침으로 못 고치는 문제다
  sessionStorage.setItem(GUARD, String(Date.now()));
  event.preventDefault(); // Vite 가 오류를 던지기 전에 우리가 처리한다
  window.location.reload();
});

const container = document.getElementById('root');
if (!container) {
  throw new Error('#root 엘리먼트를 찾을 수 없습니다. index.html 을 확인하세요.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
