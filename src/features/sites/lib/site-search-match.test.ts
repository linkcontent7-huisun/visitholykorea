import { describe, expect, it } from 'vitest';
import type { HolySite } from '@/shared/types/domain';
import { normalizeSearchText, siteMatchesQuery } from './site-search-match';

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
