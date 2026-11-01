import { HOLY_QUIZZES } from '../data/holy-quiz';

const SHOWN_KEY = 'vhk-quiz-popup-day';

/** 이용자 시계 기준 오늘 날짜(YYYY-MM-DD). UTC 로 자르면 한국 아침 9시 전에 날짜가 하루 어긋난다. */
export function dayKey(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

/** 한 판의 문제 수 — 11/1 사장님 결정(「한 문제는 너무 빨리 끝난다」 → 3문제 + 결과 카드). */
export const QUIZ_SET_SIZE = 3;

/**
 * 오늘 한 판의 첫 문항 위치 — 날짜마다 3칸씩 돌린다. 모두가 같은 날 같은 3문제를 푼다.
 * 40과 3은 서로소라 40일이면 모든 문항이 한 번씩 첫 문제가 되고 한 바퀴 돈다.
 */
export function quizIndexOfDay(date: Date, count: number = HOLY_QUIZZES.length): number {
  const days = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
  return (days * QUIZ_SET_SIZE) % count;
}

/**
 * 오늘 팝업을 이미 띄웠으면 false. 띄우는 순간 기록하므로 새로고침해도 다시 뜨지 않는다.
 * 저장소를 못 쓰는 브라우저(시크릿 등)에서는 기록이 안 남아 열 때마다 뜬다 — 막히는 것보다 낫다.
 */
export function claimTodaysPopup(date: Date = new Date()): boolean {
  try {
    const today = dayKey(date);
    if (localStorage.getItem(SHOWN_KEY) === today) return false;
    localStorage.setItem(SHOWN_KEY, today);
  } catch {
    // 저장소 접근 실패 — 그대로 보여 준다
  }
  return true;
}
