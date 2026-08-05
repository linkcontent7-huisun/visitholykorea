/**
 * 쉼자리 개방 추정 — "지금 가면 문이 열려 있는가".
 *
 * 이 서비스의 가장 큰 위험은 "가 봤더니 잠겨 있었다"이다. 그것도 이미 지쳐서 찾아간 사람에게.
 * 다행히 가톨릭 시설의 개방은 **요일 패턴**을 따른다. 본당은 월·화에 쉬고 수~일에 연다.
 * 그래서 5,918곳을 하나씩 확인하는 대신 **유형별 기본 패턴 + 확인된 곳의 예외**로 다룬다.
 *
 * 중요한 원칙: **추정과 확인을 절대 섞지 않는다.**
 * 추정을 사실처럼 보여주면 헛걸음이 우리 탓이 된다.
 *
 * 이 파일에는 API 호출도 DB 접근도 없다. 순수 계산이라 테스트로 고정할 수 있다.
 */

/** 쉼자리 유형. `catholic_directory.category` 를 이 축으로 접어서 쓴다. */
export type RestPlaceKind = '본당' | '공소' | '성지' | '피정의집' | '수도회' | '기타';

export type OpennessStatus = '열림' | '닫힘' | '확인필요';

/** 확인된 사실인지, 패턴에서 추정한 것인지 */
export type OpennessConfidence = '확인됨' | '추정';

export interface OpennessResult {
  status: OpennessStatus;
  confidence: OpennessConfidence;
  /** 화면에 그대로 쓸 수 있는 이유 */
  reason: string;
  /** 열려 있어도 조용하지 않을 수 있을 때의 귀띔 */
  crowdNote?: string;
}

/** 장소별로 확인해 둔 정보. 있으면 패턴보다 항상 우선한다. */
export interface VerifiedOpening {
  /** 확인한 날짜 (YYYY-MM-DD). 오래되면 신뢰도가 떨어진다 */
  checkedAt: string;
  /** 닫는 요일 (0=일 … 6=토) */
  closedWeekdays: number[];
  /** 여는 시각 / 닫는 시각 (0~23) */
  opensHour?: number;
  closesHour?: number;
  note?: string;
}

const WEEKDAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'] as const;

/**
 * 유형별 기본 요일 패턴.
 *
 * 본당의 월·화 휴무는 사제 휴무일에서 온다. 교구·본당마다 차이가 있어
 * (월요일만 쉬는 곳도 많다) 이건 어디까지나 **기본값**이고,
 * 확인된 곳은 `VerifiedOpening` 으로 덮어쓴다.
 */
const DEFAULT_CLOSED_WEEKDAYS: Record<RestPlaceKind, number[] | null> = {
  본당: [1, 2], // 월, 화
  성지: [1], // 성지는 대체로 상시 개방하되 월요일 휴무인 곳이 있다
  공소: null, // 상주 사제가 없어 평소 잠겨 있다 — 패턴으로 추정하지 않는다
  피정의집: null, // 예약제라 요일로 판단할 수 없다
  수도회: null, // 봉쇄 수도원 등 성격이 매우 다르다
  기타: null,
};

/** 낮 시간대 추정. 밤에는 대부분 잠근다. */
const DEFAULT_OPEN_HOURS = { opens: 6, closes: 20 } as const;

function weekdayLabel(day: number): string {
  return WEEKDAY_LABEL[day] ?? '';
}

function formatClosedDays(days: number[]): string {
  return days.map(weekdayLabel).join('·');
}

/**
 * 주일(일요일)은 문은 열려 있지만 미사로 붐빈다.
 * 토요일 저녁도 특전 미사가 있어 조용하지 않다.
 * "열림"과 "조용함"은 다른 축이라 따로 알려 준다.
 */
function crowdNoteFor(kind: RestPlaceKind, day: number, hour: number): string | undefined {
  if (kind !== '본당' && kind !== '성지') return undefined;

  if (day === 0) {
    return '주일이라 미사로 붐빌 수 있어요. 조용히 앉아 있고 싶다면 미사 시간을 피해 주세요';
  }
  if (day === 6 && hour >= 16) {
    return '토요일 저녁은 특전 미사가 있어 붐빌 수 있어요';
  }
  return undefined;
}

/**
 * 지금(또는 지정한 시각) 이 쉼자리가 열려 있는지 판단한다.
 *
 * 확인된 정보가 있으면 그걸 쓰고(`확인됨`), 없으면 유형별 패턴으로 추정한다(`추정`).
 * 패턴조차 없는 유형은 `확인필요` 로 남긴다 — **모르면 모른다고 말한다.**
 */
export function estimateOpenness(
  kind: RestPlaceKind,
  at: Date = new Date(),
  verified?: VerifiedOpening,
): OpennessResult {
  const day = at.getDay();
  const hour = at.getHours();

  if (verified) {
    const isClosedDay = verified.closedWeekdays.includes(day);
    if (isClosedDay) {
      return {
        status: '닫힘',
        confidence: '확인됨',
        reason: `${weekdayLabel(day)}요일은 쉬는 날이에요 (${verified.checkedAt} 확인)`,
      };
    }

    const opens = verified.opensHour ?? DEFAULT_OPEN_HOURS.opens;
    const closes = verified.closesHour ?? DEFAULT_OPEN_HOURS.closes;
    if (hour < opens || hour >= closes) {
      return {
        status: '닫힘',
        confidence: '확인됨',
        reason: `${opens}시부터 ${closes}시까지 열려요 (${verified.checkedAt} 확인)`,
      };
    }

    return {
      status: '열림',
      confidence: '확인됨',
      reason: verified.note ?? `${verified.checkedAt}에 확인한 곳이에요`,
      ...(crowdNoteFor(kind, day, hour) ? { crowdNote: crowdNoteFor(kind, day, hour)! } : {}),
    };
  }

  const closedDays = DEFAULT_CLOSED_WEEKDAYS[kind];

  // 패턴을 모르는 유형은 추정하지 않는다. 잘못 안내하느니 물어보게 한다.
  if (closedDays === null) {
    return {
      status: '확인필요',
      confidence: '추정',
      reason: '개방 시간이 곳마다 달라요. 가기 전에 전화로 확인해 주세요',
    };
  }

  if (closedDays.includes(day)) {
    return {
      status: '닫힘',
      confidence: '추정',
      reason: `${kind}은 보통 ${formatClosedDays(closedDays)}요일에 쉬어요`,
    };
  }

  if (hour < DEFAULT_OPEN_HOURS.opens || hour >= DEFAULT_OPEN_HOURS.closes) {
    return {
      status: '닫힘',
      confidence: '추정',
      reason: '밤에는 보통 문을 잠가요',
    };
  }

  const note = crowdNoteFor(kind, day, hour);
  return {
    status: '열림',
    confidence: '추정',
    reason: `${kind}은 보통 ${formatClosedDays(closedDays)}요일만 쉬어요`,
    ...(note ? { crowdNote: note } : {}),
  };
}

/**
 * "오늘 같은 날 어디로 가면 되나" — 요일 자체에 대한 안내.
 * 본당이 다 닫히는 월·화에 빈손으로 돌려보내지 않기 위한 문구다.
 */
export function weekdayGuidance(at: Date = new Date()): string | null {
  const day = at.getDay();

  if (day === 1 || day === 2) {
    return '월·화는 본당 대부분이 쉬는 날이에요. 성지와 대성당은 열려 있는 곳이 많아요';
  }
  if (day === 0) {
    return '주일은 어디나 미사로 붐벼요. 조용한 시간을 원한다면 미사 사이를 노려 보세요';
  }
  if (day >= 3 && day <= 5) {
    return '수·목·금은 문은 열려 있고 사람은 가장 적은 날이에요';
  }
  return null;
}
