/**
 * 인근 혼잡도 산식 (2026-09-16 재설계).
 *
 * 한국관광공사 TourAPI 에는 실시간 혼잡도가 없다. 관광지 집중률 예측을
 * 성지 이름 또는 같은 시·군·구 관광지들의 값으로 "인근" 근거로 쓴다.
 *
 * 예전 산식의 "주변 명소·식당 개수" 축은 뺐다 — 시설 수는 사람 수의 근거가 못 된다.
 * 집중률이 없는 시·군·구(광주·전남 등)에서는 **등급을 내지 않는다.**
 *
 * 화면 규칙(사장님 2026-09-16): 등급은 세 단계뿐이고, 퍼센트·점수·건수 같은 숫자는 화면에 내지
 * 않는다. 그래서 근거는 문장 키(`ReasonItem`)로 돌려주고 숫자는 내부(`score`)에만 둔다.
 *
 * 이 파일에는 API 호출이 없다. 순수 계산만 있어서 테스트로 고정한다. 조회는 `congestion-lookup.ts`.
 */

import type { CongestionRate } from '@/shared/api/tour-api';
import type { TranslationKey } from '@/shared/i18n/dictionary';
import { koreaTodayYmd } from '@/shared/lib/korea-date';
import { isSameSpot } from '../lib/name-match';

// ---------------------------------------------------------------------------
// 상수 — 발표자료에 그대로 공개할 값들
// ---------------------------------------------------------------------------

/** 등급 경계. 이 미만이 조용, 다음 미만이 보통, 그 이상이 붐빔. */
export const LEVEL_BOUNDS = { quietBelow: 30, moderateBelow: 60 } as const;

export const CROWDING_LEVELS = ['조용', '보통', '붐빔'] as const;
export type CrowdingLevel = (typeof CROWDING_LEVELS)[number];

/** 점수(0~100) → 세 단계. 경계값은 낮은 쪽(더 조용한 쪽)에 포함되지 않는다. */
export function toCrowdingLevel(score: number): CrowdingLevel {
  if (score < LEVEL_BOUNDS.quietBelow) return '조용';
  if (score < LEVEL_BOUNDS.moderateBelow) return '보통';
  return '붐빔';
}

// ---------------------------------------------------------------------------
// 관광공사 집중률
// ---------------------------------------------------------------------------

export interface CongestionSignal {
  /** site = 성지 이름이 관광지로 등재돼 있어 그 값. district = 같은 시·군·구 관광지들의 중앙값 */
  kind: 'site' | 'district';
  /** kind=site 일 때 매칭된 관광지 이름 */
  name: string | null;
  /** 시·군·구 이름 (응답의 signguNm) */
  district: string;
  /** 0~100 (내부용) */
  rate: number;
  level: CrowdingLevel;
  /** 그날 그 시·군·구에 등재된 관광지 수 (내부용) */
  count: number;
  /** YYYYMMDD — 어느 날의 예측인지 */
  baseYmd: string;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function clampRate(value: string): number {
  return Math.max(0, Math.min(100, Number(value)));
}

/**
 * 30일치 응답에서 **오늘(한국 날짜) 이후 가장 이른 날**의 행만 남긴다.
 *
 * 응답은 오늘부터가 아니라 **어제부터** 올 때가 있다(2026-09-21 배포본 실측: 9/21 에 `baseYmd=20260920`
 * 부터). 예전 코드는 가장 이른 날을 오늘로 가정해 어제 예측을 오늘 값으로 보여줬다(어제 96% → 오늘 50%
 * 같은 날은 등급이 틀렸다). 그 전 코드는 `max(baseYmd)` 로 30일 뒤 값을 썼다. 오늘 이후 행이 없으면 빈 배열.
 */
export function ratesForToday(
  rates: readonly CongestionRate[],
  todayYmd: string = koreaTodayYmd(),
): CongestionRate[] {
  const valid = rates.filter(
    (r) => r.baseYmd && r.baseYmd >= todayYmd && Number.isFinite(Number(r.cnctrRate)),
  );
  if (valid.length === 0) return [];
  const day = valid.reduce((min, r) => (r.baseYmd < min ? r.baseYmd : min), valid[0]!.baseYmd);
  return valid.filter((r) => r.baseYmd === day);
}

/**
 * 시·군·구 집중률 응답에서 이 성지에 붙일 신호를 고른다.
 *
 * ① 성지 이름이 관광지 이름과 맞으면 그 값(kind=site) ② 아니면 그날 관광지들의 중앙값(kind=district).
 * 최댓값은 쓰지 않는다 — 2026-09-14 감사에서 과대추정으로 판명. ③ 행이 없으면 null.
 * 날짜 고르기는 `ratesForToday` — `todayYmd` 는 테스트가 날짜를 고정할 때만 넘긴다.
 */
export function pickCongestion(
  siteName: string,
  rates: readonly CongestionRate[],
  todayYmd?: string,
): CongestionSignal | null {
  const rows = ratesForToday(rates, todayYmd);
  if (rows.length === 0) return null;
  const today = rows[0]!.baseYmd;
  const district = rows[0]?.signguNm ?? '';

  const matched = rows.find((r) => isSameSpot(siteName, r.tAtsNm));
  if (matched) {
    const rate = clampRate(matched.cnctrRate);
    return {
      kind: 'site',
      name: matched.tAtsNm,
      district,
      rate,
      level: toCrowdingLevel(rate),
      count: rows.length,
      baseYmd: today,
    };
  }

  const rate = median(rows.map((r) => clampRate(r.cnctrRate)));
  return {
    kind: 'district',
    name: null,
    district,
    rate,
    level: toCrowdingLevel(rate),
    count: rows.length,
    baseYmd: today,
  };
}

/** 「한적한 날」로 보여줄 최대 개수 — 날짜 알약 4개면 휴대폰 한 줄에 들어간다 */
export const QUIET_DAYS_LIMIT = 4;

/**
 * 이 성지의 앞으로 30일 중 「조용」 등급인 날(YYYYMMDD, 가까운 순).
 *
 * 집중률은 "그 장소의 가장 붐비는 시기 대비" 상대치라 장소끼리 비교는 못 해도 **같은 장소의 날짜 비교에는
 * 정확히 맞는 지표**다(data.go.kr 15128555). 그래서 오버투어리즘 답변은 "어디로"가 아니라 "언제"로 낸다
 * (2026-09-21 결정). 성지 이름이 관광지로 등재된 곳(kind=site)에만 의미가 있고, 그 외는 빈 배열.
 * 응답에 이미 30일치가 들어 있어 호출 수는 늘지 않는다. 오늘도 조용하면 오늘부터 센다.
 */
export function pickQuietDays(
  siteName: string,
  rates: readonly CongestionRate[],
  todayYmd: string = koreaTodayYmd(),
  limit: number = QUIET_DAYS_LIMIT,
): string[] {
  return rates
    .filter(
      (r) =>
        r.baseYmd &&
        r.baseYmd >= todayYmd &&
        Number.isFinite(Number(r.cnctrRate)) &&
        isSameSpot(siteName, r.tAtsNm) &&
        toCrowdingLevel(clampRate(r.cnctrRate)) === '조용',
    )
    .map((r) => r.baseYmd)
    .filter((ymd, i, all) => all.indexOf(ymd) === i)
    .sort()
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// 합산 · 근거
// ---------------------------------------------------------------------------

/** 화면이 그대로 번역해 쓰는 근거 한 줄. 숫자는 넣지 않는다 — `level` 은 「낮음·보통·높음」 말로 바뀐다. */
export interface ReasonItem {
  key: TranslationKey;
  params?: Record<string, string>;
  level?: CrowdingLevel;
}

export interface NearbyCrowding {
  /** null = 집중률이 없거나 성지 자체 값이 아님(district) → 등급을 내지 않는다 */
  level: CrowdingLevel | null;
  /** 0~100, 내부·테스트용. 화면에 내지 않는다 */
  score: number | null;
  congestion: CongestionSignal | null;
  reasons: ReasonItem[];
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * 관광공사 집중률로 인근 혼잡도를 만든다.
 *
 * 등급(`level`)은 **성지 이름이 관광지로 등재된 곳(kind=site)에만** 낸다(2026-09-21 결정).
 * 시·군·구 중앙값(kind=district)은 다른 장소들의 "자기 최고점 대비" 상대치를 다시 중앙값 낸 것이라
 * 성지 앞마당과 거의 무관한데, 같은 색 점·같은 「조용」 라벨로 보여주면 사용자는 이 성지 얘기로 읽는다.
 * 그래서 district 는 등급·점수 없이 근거 문장만 남긴다 — 화면은 색 점 없이 문장만 그리고, 일정 카드의
 * 「조용」 태그는 점수가 없으니 붙지 않는다. 집중률 정의: data.go.kr 15128555 「가장 붐비는 시기를 100 으로
 * 보았을 때의 상대 수치」. 데이터가 아예 없으면 근거만 남긴다.
 */
export function combineNearbyCrowding(congestion: CongestionSignal | null): NearbyCrowding {
  const reasons: ReasonItem[] = [];

  if (congestion?.kind === 'site') {
    reasons.push({ key: 'crowdingReasonSite', level: congestion.level });
  } else if (congestion) {
    reasons.push({
      key: 'crowdingReasonDistrict',
      params: { district: congestion.district },
      level: congestion.level,
    });
  } else {
    reasons.push({ key: 'crowdingReasonNoData' });
  }

  if (!congestion || congestion.kind === 'district') {
    return { level: null, score: null, congestion, reasons };
  }

  const score = round(congestion.rate);
  return { level: toCrowdingLevel(score), score, congestion, reasons };
}
