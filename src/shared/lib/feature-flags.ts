/**
 * 제출판 모드. true면 관리자 콘솔·즐겨찾기·순례기록 작성을 입구부터 숨긴다.
 * 기능 코드는 그대로 두면서 공모전 심사 화면에는 본선 기능만 보이게 하기 위한 스위치다.
 * Vercel 환경 변수 VITE_SUBMISSION_MODE=true로 켜며, 없으면 개발 중 기능이 보이도록 false다.
 */
export const SUBMISSION_MODE = import.meta.env.VITE_SUBMISSION_MODE === 'true';
