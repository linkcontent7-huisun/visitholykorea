import { describe, expect, it } from 'vitest';
import { buildMapLinks, formatCoordinates, type Destination } from './map-links';

const HAEMI: Destination = { name: '해미순교성지', lat: 36.7137, lng: 126.5433 };

describe('buildMapLinks — 국내 실사용 순, 구글·애플은 안 준다(2026-09-19)', () => {
  it('언어와 무관하게 카카오·티맵·네이버 순서로 고정한다', () => {
    expect(buildMapLinks(HAEMI, false).map((l) => l.provider)).toEqual(['kakao', 'tmap', 'naver']);
    expect(buildMapLinks(HAEMI, true).map((l) => l.provider)).toEqual(['kakao', 'tmap', 'naver']);
  });

  it('세 개만 준다 — 구글·애플은 국내에서 안 쓰여 뺐다', () => {
    expect(buildMapLinks(HAEMI, true)).toHaveLength(3);
    expect(buildMapLinks(HAEMI, false)).toHaveLength(3);
  });
});

describe('링크 형식', () => {
  const links = buildMapLinks(HAEMI, false);
  const byProvider = Object.fromEntries(links.map((l) => [l.provider, l.url]));

  it('카카오맵은 이름을 URL 인코딩해 넣는다', () => {
    expect(byProvider.kakao).toContain('map.kakao.com/link/to/');
    expect(byProvider.kakao).toContain('%ED%95%B4%EB%AF%B8'); // 해미
    expect(byProvider.kakao).toContain('36.7137,126.5433');
  });

  it('네이버는 형식이 자주 바뀌는 좌표 길찾기 대신 검색으로 보낸다', () => {
    expect(byProvider.naver).toContain('map.naver.com/p/search/');
  });

  it('티맵은 공식 딥링크 스킴에 목적지 이름·좌표를 넣는다', () => {
    expect(byProvider.tmap).toContain('tmap://route?');
    expect(byProvider.tmap).toContain(`goalx=${HAEMI.lng}`);
    expect(byProvider.tmap).toContain(`goaly=${HAEMI.lat}`);
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
