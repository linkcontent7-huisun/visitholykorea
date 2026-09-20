import { describe, expect, it } from 'vitest';
import type { LdongCode } from '@/shared/api/tour-api';
import { legacyDistrict, matchSido, matchSigngu } from './congestion-lookup';

const SIDO: LdongCode[] = [
  { code: '11', name: '서울특별시' },
  { code: '28', name: '인천광역시' },
  { code: '41', name: '경기도' },
  { code: '44', name: '충청남도' },
  { code: '12', name: '전남광주통합특별시' },
  { code: '51', name: '강원특별자치도' },
];

const CHUNGNAM: LdongCode[] = [
  { code: '130', name: '천안시' },
  { code: '131', name: '천안시 동남구' },
  { code: '270', name: '당진시' },
  { code: '210', name: '서산시' },
];

describe('matchSido — 주소 → 법정동 시·도', () => {
  it('긴 이름 주소(충청남도)도 짧은 이름 주소(충남)도 같은 행으로', () => {
    expect(matchSido('충청남도 당진시 우강면', SIDO)?.code).toBe('44');
    expect(matchSido('충남 당진시 우강면', SIDO)?.code).toBe('44');
  });
  it('2026 개편 — 광주와 전남 주소는 둘 다 통합특별시 행으로', () => {
    expect(matchSido('광주광역시 남구', SIDO)?.code).toBe('12');
    expect(matchSido('전라남도 나주시', SIDO)?.code).toBe('12');
  });
  it('「경기도 광주시」는 경기로 판정한다', () => {
    expect(matchSido('경기도 광주시 퇴촌면 천진암로 1203', SIDO)?.code).toBe('41');
  });
  it('시·도를 못 찾으면 null', () => {
    expect(matchSido('', SIDO)).toBeNull();
  });
});

describe('matchSigngu — 주소 → 시·군·구', () => {
  it('「천안시 동남구」처럼 긴 이름이 「천안시」보다 먼저 맞는다', () => {
    expect(matchSigngu('충청남도 천안시 동남구 목천읍', CHUNGNAM)?.code).toBe('131');
    expect(matchSigngu('충청남도 천안시 서북구', CHUNGNAM)?.code).toBe('130');
  });
  it('없는 시·군·구면 null', () => {
    expect(matchSigngu('충청남도 어디군', CHUNGNAM)).toBeNull();
  });
});

describe('legacyDistrict — 개편 전 코드로만 데이터가 오는 곳', () => {
  it('인천 중구·동구는 옛 코드', () => {
    expect(legacyDistrict('인천광역시 중구 답동')?.signguCd).toBe('28110');
    expect(legacyDistrict('인천시 동구 화수동')?.signguCd).toBe('28140');
  });
  it('그 외는 null', () => {
    expect(legacyDistrict('서울특별시 중구 명동길')).toBeNull();
  });
});
