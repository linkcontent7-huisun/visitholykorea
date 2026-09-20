/**
 * 제출판 모드. true 면 **관리자 콘솔만** 주소·메뉴에서 숨긴다.
 * 예전엔 즐겨찾기·순례 기록 작성도 숨겼는데, 둘 다 정식 기능이 돼(2026-09-20 병합) 관리자만 남겼다(2026-09-21).
 * 기능 코드는 그대로 두면서 공모전 심사 화면에는 완성된 기능만 보이게 하기 위한 스위치다.
 * Vercel 환경 변수 VITE_SUBMISSION_MODE=true로 켜며, 없으면 개발 중 기능이 보이도록 false다.
 */
export const SUBMISSION_MODE = import.meta.env.VITE_SUBMISSION_MODE === 'true';
