import { describe, expect, it } from 'vitest';
import type { HolySite } from '@/shared/types/domain';
import { nameAliases, normalizeSearchText, siteMatchesQuery } from './site-search-match';

function site(name: string, region: string, location: string): HolySite {
  return {
    id: name,
    name,
    category: '순교성지',
    region,
    location,
    description: null,
    history: null,
    imageUrl: null,
    imageSource: null,
    imageLicense: null,
    coordinates: { lat: null, lng: null },
    emotionTag: null,
    seoTitle: null,
    seoDescription: null,
    nearbyAttractions: null,
    nearbyLodging: null,
    phone: null,
    homepageUrl: null,
    fax: null,
  };
}

const 솔뫼 = site('솔뫼성지', '대전', '충청남도 당진시 우강면 솔뫼로 132');
const 명동 = site('명동대성당', '서울', '서울시 중구 명동길 74');

describe('siteMatchesQuery — 성지 찾기 자체 매칭', () => {
  const q = (text: string) => normalizeSearchText(text);

  it('한국어 성지명·주소로 찾는다', () => {
    expect(siteMatchesQuery(솔뫼, q('솔뫼'))).toBe(true);
    expect(siteMatchesQuery(솔뫼, q('당진'))).toBe(true);
  });

  it('교구명으로 찾는다 — 「대전」「대전교구」「Daejeon Diocese」 모두', () => {
    expect(siteMatchesQuery(솔뫼, q('대전교구'))).toBe(true);
    expect(siteMatchesQuery(솔뫼, q('Daejeon'))).toBe(true);
    expect(siteMatchesQuery(명동, q('서울대교구'))).toBe(true);
    expect(siteMatchesQuery(명동, q('Seoul Archdiocese'))).toBe(true);
  });

  it('행정지역(시·도)으로 찾는다 — 긴 이름·짧은 이름·로마자', () => {
    expect(siteMatchesQuery(솔뫼, q('충청남도'))).toBe(true);
    expect(siteMatchesQuery(솔뫼, q('충남'))).toBe(true);
    expect(siteMatchesQuery(솔뫼, q('Chungnam'))).toBe(true);
    expect(siteMatchesQuery(명동, q('Seoul'))).toBe(true);
  });

  it('대소문자·공백·하이픈은 무시한다', () => {
    expect(siteMatchesQuery(명동, q('seoul arch diocese'))).toBe(true);
    expect(siteMatchesQuery(명동, q('명동 대성당'))).toBe(true);
  });

  it('맞지 않으면 false, 빈 검색어면 true', () => {
    expect(siteMatchesQuery(명동, q('부산'))).toBe(false);
    expect(siteMatchesQuery(명동, '')).toBe(true);
  });
});

describe('흔히 부르는 이름으로도 찾는다 (2026-10-29)', () => {
  const 답동 = site('답동주교좌성당', '인천', '인천광역시 중구 우현로 50');
  const 해미 = site('해미순교성지', '대전', '충남 서산시 해미면 성지1로 13');
  const 절두산 = site('절두산 순교성지', '서울', '서울 마포구 토정로6');
  const 공세리 = site('공세리성지성당', '대전', '충남 아산시 인주면 공세리성당길 10');

  it.each([
    [명동, '명동성당'],
    [답동, '답동성당'],
    [해미, '해미성지'],
    [절두산, '절두산성지'],
    [공세리, '공세리성당'],
    [공세리, '공세리성지'],
  ])('%j 은(는) 「%s」로 찾아진다', (s, q) => {
    expect(siteMatchesQuery(s, normalizeSearchText(q))).toBe(true);
  });

  it('엉뚱한 곳은 걸리지 않는다', () => {
    expect(siteMatchesQuery(해미, normalizeSearchText('명동성당'))).toBe(false);
    expect(siteMatchesQuery(명동, normalizeSearchText('해미성지'))).toBe(false);
  });

  it('별칭 목록에 정식 이름도 들어 있다', () => {
    expect(nameAliases('명동대성당')).toContain('명동대성당');
    expect(nameAliases('명동대성당')).toContain('명동성당');
  });
});
