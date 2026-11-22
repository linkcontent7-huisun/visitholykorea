/**
 * 새 판이 왔을 때 **화면을 옮길 때만** 새로고침한다 (2026-11-22).
 *
 * 예전에는 새 서비스워커가 페이지를 넘겨받는 순간(controllerchange, index.html) 바로 새로고침했다.
 * 배포가 잦은 날에는 순례자가 기록 칸·장소 칸에 사진을 고르던 도중에 화면이 통째로 다시 열려
 * 쓰던 것이 사라졌다 — 사장님 「사진 1장 넣으니 바로 다음으로 넘어간다」(시험 계정으로 재현:
 * 「새 장소 기록하기」에서 사진을 고른 직후 navigation type 이 reload 로 바뀌고 칸이 사라짐).
 * 지금은 index.html 이 `window.vhkUpdateReady = true` 만 표시하고, 다음 화면 이동 때 여기서 새로고침한다.
 */
declare global {
  interface Window {
    vhkUpdateReady?: boolean;
  }
}

/** 새 판이 기다리고 있으면 새로고침하고 true. 아니면 false */
export function reloadIfUpdateReady(win: Window = window): boolean {
  if (!win.vhkUpdateReady) return false;
  win.vhkUpdateReady = false;
  win.location.reload();
  return true;
}
