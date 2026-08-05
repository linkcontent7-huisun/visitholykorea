import { describe, expect, it } from 'vitest';
import { buildMapLinks, formatCoordinates, type Destination } from './map-links';

const HAEMI: Destination = { name: '해미순교성지', lat: 36.7137, lng: 126.5433 };

describe('buildMapLinks — 실제로 쓸 수 있는 것을 먼저 보여준다', () => {
  it('외국어 화면에서는 구글·애플이 앞에 온다', () => {
    const links = buildMapLinks(HAEMI, false);
    expect(links.map((l) => l.provider)).toEqual(['google', 'apple', 'kakao', 'naver']);
  });

  it('한국어 화면에서는 카카오·네이버가 앞에 온다', () => {
    const links = buildMapLinks(HAEMI, true);
    expect(links.map((l) => l.provider)).toEqual(['kakao', 'naver', 'google', 'apple']);
  });

  it('어느 쪽이든 네 개를 모두 준다 — 하나만 주면 앱이 없는 사람이 막힌다', () => {
    expect(buildMapLinks(HAEMI, true)).toHaveLength(4);
    expect(buildMapLinks(HAEMI, false)).toHaveLength(4);
  });
});

describe('링크 형식', () => {
  const links = buildMapLinks(HAEMI, false);
  const byProvider = Object.fromEntries(links.map((l) => [l.provider, l.url]));

  it('구글은 공식 스킴을 쓰고 대중교통을 기본으로 한다 (한국에서 자동차 길찾기가 안 나온다)', () => {
    expect(byProvider.google).toContain('google.com/maps/dir/?api=1');
    expect(byProvider.google).toContain('destination=36.7137,126.5433');
    expect(byProvider.google).toContain('travelmode=transit');
  });

  it('애플 지도는 목적지 좌표를 넘긴다', () => {
    expect(byProvider.apple).toContain('maps.apple.com');
    expect(byProvider.apple).toContain('daddr=36.7137,126.5433');
  });

  it('카카오맵은 이름을 URL 인코딩해 넣는다', () => {
    expect(byProvider.kakao).toContain('map.kakao.com/link/to/');
    expect(byProvider.kakao).toContain('%ED%95%B4%EB%AF%B8'); // 해미
    expect(byProvider.kakao).toContain('36.7137,126.5433');
  });

  it('네이버는 형식이 자주 바뀌는 좌표 길찾기 대신 검색으로 보낸다', () => {
    expect(byProvider.naver).toContain('map.naver.com/p/search/');
  });

  it('이름에 공백이 있어도 링크가 깨지지 않는다', () => {
    const withSpace = buildMapLinks({ ...HAEMI, name: '갈매못 순교성지' }, true);
    for (const link of withSpace) {
      expect(link.url).not.toContain(' ');
    }
  });
});

describe('formatCoordinates', () => {
  it('지도 앱에 붙여넣을 수 있는 형식으로 만든다', () => {
    expect(formatCoordinates(36.7137, 126.5433)).toBe('36.713700, 126.543300');
  });

  it('소수점이 긴 좌표도 6자리로 자른다', () => {
    expect(formatCoordinates(37.876777750874, 127.726904499621)).toBe('37.876778, 127.726904');
  });
});
