/**
 * 제출판 모드. true 면 **관리자 콘솔만** 주소·메뉴에서 숨긴다.
 * 예전엔 즐겨찾기·순례 기록 작성도 숨겼는데, 둘 다 정식 기능이 돼(2026-09-20 병합) 관리자만 남겼다(2026-09-21).
 * 기능 코드는 그대로 두면서 공모전 심사 화면에는 완성된 기능만 보이게 하기 위한 스위치다.
 * Vercel 환경 변수 VITE_SUBMISSION_MODE=true로 켜며, 없으면 개발 중 기능이 보이도록 false다.
 */
export const SUBMISSION_MODE = import.meta.env.VITE_SUBMISSION_MODE === 'true';

/**
 * 체험여행 접수(「하늘에서 빵이 내린다면」) 숨김 — 2026-11-11 사장님 지시: 이번 발표(11/12)에서는 다루지 않는다.
 * true 인 동안 대전 성지 화면의 모집 배너·카드 팝업이 뜨지 않고, 접수 주소(/programs/…/apply)는 첫 화면으로 보낸다.
 * 접수 코드·DB 표·관리자 「프로그램 접수」 탭은 그대로 둔다. 다시 보이게 하려면 false 로 바꾼다.
 */
export const PROGRAMS_HIDDEN = true;
