/**
 * 관광공사 「관광지 집중률 예측」을 성지에 붙이기 위한 조회 계층.
 *
 * 집중률 API 는 `areaCd`(시·도 2자리) + `signguCd`(시·군·구 5자리)가 **둘 다 필수**다
 * (2026-09-16 실측: 시·도만 넘기면 `NO_MANDATORY_REQUEST_PARAMETERS_ERROR1(signguCd)`).
 * 예전 코드는 시·도만 넘겨 한 번도 데이터를 받은 적이 없었다.
 *
 * 시·군·구 코드는 하드코딩하지 않고 TourAPI 법정동 코드표(`ldongCode2`)에서 받아 주소와
 * 이름으로 맞춘다 — `scripts/congestion-coverage.ts` 와 같은 방법. 코드표는 하루, 집중률은
 * 6시간 동안 **메모리에만** 둔다. DB·localStorage·서비스워커에는 넣지 않는다(ADR 0002).
 *
 * 호출 수: 시·도 목록 1회 + 시·도당 시·군구 목록 1회(하루 캐시) + 시·군·구당 집중률 1회(6시간 캐시).
 */

import {
  getCongestionRates,
  getLdongCodes,
  type CongestionRate,
  type LdongCode,
} from '@/shared/api/tour-api';
import { regionOfAddress, type Region } from '@/shared/lib/regions';
import type { HolySite } from '@/shared/types/domain';

export interface DistrictCode {
  areaCd: string;
  signguCd: string;
  /** 사람이 읽는 이름 — 화면 근거 문장에 쓴다 */
  signguNm: string;
}

/**
 * 우리 짧은 시·도 이름 → 법정동 코드표의 시·도 이름에 들어 있는 조각.
 * 2026 행정구역 개편으로 광주·전남은 「전남광주통합특별시」 하나다 — 둘 다 그 행으로 간다.
 */
const LDONG_SIDO_MATCH: Record<Region, string> = {
  서울: '서울',
  부산: '부산',
  대구: '대구',
  인천: '인천',
  광주: '광주',
  대전: '대전',
  울산: '울산',
  세종: '세종',
  경기: '경기',
  강원: '강원',
  충북: '충청북',
  충남: '충청남',
  전북: '전북',
  전남: '전남',
  경북: '경상북',
  경남: '경상남',
  제주: '제주',
};

/**
 * 개편 전 코드로만 데이터가 오는 곳. 인천 중구·동구는 2026 개편으로 제물포구·영종구가 됐지만
 * 집중률 API 는 옛 코드(28110·28140)로만 준다(2026-09-15 실측). 주소는 아직 옛 이름이다.
 */
const LEGACY_DISTRICTS: Array<{ prefix: string; code: DistrictCode }> = [
  { prefix: '인천광역시 중구', code: { areaCd: '28', signguCd: '28110', signguNm: '인천 중구' } },
  { prefix: '인천광역시 동구', code: { areaCd: '28', signguCd: '28140', signguNm: '인천 동구' } },
  { prefix: '인천시 동구', code: { areaCd: '28', signguCd: '28140', signguNm: '인천 동구' } },
];

/**
 * 주소 → 코드표의 시·도 행. 순수 함수 — 테스트로 고정.
 * 시·도는 첫 낱말만 본다. 주소 전체를 훑으면 「경기도 광주시」의 광주가 먼저 잡혀
 * 전남광주통합특별시를 조회하게 된다.
 */
export function matchSido(address: string, sidoList: readonly LdongCode[]): LdongCode | null {
  const firstWord = address.trim().split(/\s+/, 1)[0] ?? '';
  const region = regionOfAddress(firstWord);
  if (!region) return null;
  const piece = LDONG_SIDO_MATCH[region];
  return sidoList.find((s) => s.name.includes(piece)) ?? null;
}

/**
 * 주소 → 그 시·도 안의 시·군·구 행. 「천안시 동남구」처럼 긴 이름이 「천안시」보다 먼저 맞아야
 * 하므로 이름이 긴 순으로 본다. 순수 함수.
 */
export function matchSigngu(address: string, signguList: readonly LdongCode[]): LdongCode | null {
  return (
    [...signguList]
      .sort((a, b) => b.name.length - a.name.length)
      .find((g) => address.includes(g.name)) ?? null
  );
}

/** 개편 전 코드로 가야 하는 주소면 그 코드를, 아니면 null. 순수 함수. */
export function legacyDistrict(address: string): DistrictCode | null {
  return LEGACY_DISTRICTS.find(({ prefix }) => address.startsWith(prefix))?.code ?? null;
}

// ---------------------------------------------------------------------------
// 메모리 캐시 — 저장소가 아니다. 새로고침하면 사라진다.
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  at: number;
  value: Promise<T>;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const CONGESTION_TTL_MS = 6 * 60 * 60 * 1000;

let sidoCache: CacheEntry<LdongCode[]> | null = null;
const signguCache = new Map<string, CacheEntry<LdongCode[]>>();
const ratesCache = new Map<string, CacheEntry<CongestionRate[]>>();

function remember<T>(
  get: () => CacheEntry<T> | undefined | null,
  set: (entry: CacheEntry<T> | null) => void,
  ttlMs: number,
  load: () => Promise<T>,
): Promise<T> {
  const hit = get();
  if (hit && Date.now() - hit.at < ttlMs) return hit.value;
  const value = load().catch((error: unknown) => {
    // 실패(한도 초과 등)는 캐시하지 않는다 — 다음 호출에서 다시 시도
    set(null);
    throw error;
  });
  set({ at: Date.now(), value });
  return value;
}

function sidoList(): Promise<LdongCode[]> {
  return remember(
    () => sidoCache,
    (e) => {
      sidoCache = e;
    },
    DAY_MS,
    () => getLdongCodes(),
  );
}

function signguList(sidoCode: string): Promise<LdongCode[]> {
  return remember(
    () => signguCache.get(sidoCode),
    (e) => (e ? signguCache.set(sidoCode, e) : signguCache.delete(sidoCode)),
    DAY_MS,
    () => getLdongCodes(sidoCode),
  );
}

function ratesFor(district: DistrictCode): Promise<CongestionRate[]> {
  return remember(
    () => ratesCache.get(district.signguCd),
    (e) => (e ? ratesCache.set(district.signguCd, e) : ratesCache.delete(district.signguCd)),
    CONGESTION_TTL_MS,
    () => getCongestionRates(district.areaCd, district.signguCd),
  );
}

/** 테스트용 — 캐시를 비운다. */
export function resetCongestionCaches(): void {
  sidoCache = null;
  signguCache.clear();
  ratesCache.clear();
}

/** 성지 주소 → 시·군·구 코드. 못 찾으면 null (등급 없음으로 처리된다). API 실패는 던진다. */
export async function districtForSite(
  site: Pick<HolySite, 'location'>,
): Promise<DistrictCode | null> {
  const address = site.location ?? '';
  const legacy = legacyDistrict(address);
  if (legacy) return legacy;

  const sido = matchSido(address, await sidoList());
  if (!sido) return null;
  const signgu = matchSigngu(address, await signguList(sido.code));
  if (!signgu) return null;
  return { areaCd: sido.code, signguCd: sido.code + signgu.code, signguNm: signgu.name };
}

export interface CongestionLookup {
  district: DistrictCode | null;
  /** 시·군·구를 못 찾았거나 그 지역에 데이터가 없으면 빈 배열 */
  rates: CongestionRate[];
}

/** 성지의 시·군·구 집중률 행 전체. API 실패는 던진다 — 화면이 「불러오지 못했어요」를 보여야 한다. */
export async function fetchCongestionForSite(
  site: Pick<HolySite, 'location'>,
): Promise<CongestionLookup> {
  const district = await districtForSite(site);
  if (!district) return { district: null, rates: [] };
  return { district, rates: await ratesFor(district) };
}

/**
 * 실패를 빈 배열로 흡수하는 판 — 「오늘의 성지 일정」처럼 집중률이 없어도 화면이 성립하는 곳용.
 * 빈 배열이면 산식은 등급을 내지 않으므로 "실패 = 조용" 으로 읽히지 않는다.
 */
export async function fetchCongestionRatesForSite(site: HolySite): Promise<CongestionRate[]> {
  try {
    return (await fetchCongestionForSite(site)).rates;
  } catch (error) {
    console.warn(`관광지 집중률 조회 건너뜀 (${site.name}):`, error);
    return [];
  }
}
