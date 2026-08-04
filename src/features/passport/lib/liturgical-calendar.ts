/**
 * 전례력(典禮曆) 연동 한정판 스탬프 판정 로직.
 *
 * 스탬프를 찍는 "그 날짜"가 어떤 전례 시기·성월에 해당하는지 계산해서,
 * 순례 여권 스탬프에 시즌 한정판 디자인을 입힌다. 국내 어떤 벤치마크
 * (국가유산 방문 캠페인, Camino 크레덴시알)에도 없는 유일한 차별점 —
 * 자세한 배경은 가톨릭_지식창고의 여행업계동향과_기능제안서 3-1절 ④번 참고.
 *
 * 전례 시기 계산은 부활 주일을 기준으로 하며(Meeus/Jones/Butcher 알고리즘),
 * 실제 전례력의 정밀한 절기 경계(예: 대림 제1주일이 정확히 무슨 요일부터인지)
 * 대신 스탬프 연출용으로 단순화한 근사치를 쓴다 — 신학적 정확성이 필요한
 * 전례 안내 자체가 아니라 "그 시기 분위기를 담은 기념 스탬프"이기 때문이다.
 */

export type LiturgicalSeasonKey = '대림' | '성탄' | '사순' | '부활' | '연중';
export type SpecialMonthKey = '성모성월' | '성심성월' | '순교자성월' | '위령성월' | null;

export interface LiturgicalEvent {
  season: LiturgicalSeasonKey;
  specialMonth: SpecialMonthKey;
  /** 스탬프에 실제로 표시할 이름 (특별 성월이 있으면 그걸 우선) */
  label: string;
  emoji: string;
  colorClass: { bg: string; ring: string; text: string };
}

/** 그레고리력 기준 부활 주일 날짜를 계산한다 (Meeus/Jones/Butcher 알고리즘). */
function computeEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=3월, 4=4월
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const SEASON_STYLE: Record<
  LiturgicalSeasonKey,
  { emoji: string; colorClass: LiturgicalEvent['colorClass'] }
> = {
  대림: {
    emoji: '🕯️',
    colorClass: { bg: 'bg-violet-500', ring: 'ring-violet-300', text: 'text-violet-600' },
  },
  성탄: {
    emoji: '⭐',
    colorClass: { bg: 'bg-amber-400', ring: 'ring-amber-200', text: 'text-amber-600' },
  },
  사순: {
    emoji: '✝️',
    colorClass: { bg: 'bg-purple-700', ring: 'ring-purple-300', text: 'text-purple-700' },
  },
  부활: {
    emoji: '🐣',
    colorClass: { bg: 'bg-yellow-400', ring: 'ring-yellow-200', text: 'text-yellow-600' },
  },
  연중: {
    emoji: '🌿',
    colorClass: { bg: 'bg-emerald-600', ring: 'ring-emerald-200', text: 'text-emerald-600' },
  },
};

const SPECIAL_MONTH_STYLE: Record<
  Exclude<SpecialMonthKey, null>,
  { emoji: string; colorClass: LiturgicalEvent['colorClass'] }
> = {
  성모성월: {
    emoji: '🌹',
    colorClass: { bg: 'bg-sky-500', ring: 'ring-sky-200', text: 'text-sky-600' },
  },
  성심성월: {
    emoji: '❤️',
    colorClass: { bg: 'bg-red-500', ring: 'ring-red-200', text: 'text-red-600' },
  },
  순교자성월: {
    emoji: '🩸',
    colorClass: { bg: 'bg-rose-700', ring: 'ring-rose-300', text: 'text-rose-700' },
  },
  위령성월: {
    emoji: '🕊️',
    colorClass: { bg: 'bg-slate-600', ring: 'ring-slate-300', text: 'text-slate-600' },
  },
};

/** 해당 날짜의 전례 시기를 계산한다. */
function getSeason(date: Date): LiturgicalSeasonKey {
  const year = date.getFullYear();
  const today = startOfDay(date);
  const easter = startOfDay(computeEasterSunday(year));

  const adventStart = new Date(year, 10, 27); // 대림 시작 근사치(11/27 전후, 실제로는 그 즈음 주일)
  const christmasStart = new Date(year, 11, 25);
  const christmasEnd = new Date(year, 0, 6); // 다음 해 1/6까지가 성탄 시기이므로 연초 판정에 사용
  const lentStart = addDays(easter, -46); // 재의 수요일
  const easterEnd = addDays(easter, 49); // 성령강림 대축일까지

  // 연초(1/1~1/6)는 전년도 성탄 시기의 연장
  if (today <= startOfDay(christmasEnd)) return '성탄';
  if (today >= startOfDay(christmasStart)) return '성탄';
  if (today >= startOfDay(adventStart)) return '대림';
  if (today >= lentStart && today < easter) return '사순';
  if (today >= easter && today <= startOfDay(easterEnd)) return '부활';
  return '연중';
}

function getSpecialMonth(date: Date): SpecialMonthKey {
  const month = date.getMonth() + 1;
  if (month === 5) return '성모성월';
  if (month === 6) return '성심성월';
  if (month === 9) return '순교자성월'; // 한국 천주교회 고유 전통
  if (month === 11) return '위령성월';
  return null;
}

/** 주어진 날짜(기본값: 오늘)의 전례력 이벤트를 반환한다 — 스탬프 디자인 분기에 사용. */
export function getLiturgicalEvent(date: Date = new Date()): LiturgicalEvent {
  const season = getSeason(date);
  const specialMonth = getSpecialMonth(date);

  if (specialMonth) {
    const style = SPECIAL_MONTH_STYLE[specialMonth];
    return {
      season,
      specialMonth,
      label: specialMonth,
      emoji: style.emoji,
      colorClass: style.colorClass,
    };
  }

  const style = SEASON_STYLE[season];
  return {
    season,
    specialMonth: null,
    label: `${season} 시기`,
    emoji: style.emoji,
    colorClass: style.colorClass,
  };
}
