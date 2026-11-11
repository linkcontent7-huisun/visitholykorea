import { describe, expect, it } from 'vitest';
import { buildMapLinks, formatCoordinates, type Destination } from './map-links';

const HAEMI: Destination = { name: '해미순교성지', lat: 36.7137, lng: 126.5433 };

describe('buildMapLinks — 국내 실사용 순 뒤에 구글지도 (2026-11-12 구글을 되살렸다)', () => {
  it('언어와 무관하게 카카오·티맵·네이버·구글 순서로 고정한다', () => {
    expect(buildMapLinks(HAEMI, false).map((l) => l.provider)).toEqual([
      'kakao',
      'tmap',
      'naver',
      'google',
    ]);
    expect(buildMapLinks(HAEMI, true).map((l) => l.provider)).toEqual([
      'kakao',
      'tmap',
      'naver',
      'google',
    ]);
  });

  it('네 개만 준다 — 애플 지도는 주지 않는다', () => {
    expect(buildMapLinks(HAEMI, true)).toHaveLength(4);
    expect(buildMapLinks(HAEMI, false)).toHaveLength(4);
  });

  it('구글지도 이름은 한국어 화면에서 구글지도, 그 밖에서는 Google Maps', () => {
    expect(buildMapLinks(HAEMI, true).at(-1)?.label).toBe('구글지도');
    expect(buildMapLinks(HAEMI, false).at(-1)?.label).toBe('Google Maps');
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

  it('데스크톱(앱 없음)에서 네이버는 웹 검색으로 보낸다', () => {
    expect(byProvider.naver).toContain('map.naver.com/p/search/');
  });

  it('데스크톱 티맵은 공식 딥링크 스킴에 목적지 이름·좌표를 넣는다', () => {
    expect(byProvider.tmap).toContain('tmap://route?');
    expect(byProvider.tmap).toContain(`goalx=${HAEMI.lng}`);
    expect(byProvider.tmap).toContain(`goaly=${HAEMI.lat}`);
  });

  it('구글지도는 공식 길찾기 주소에 좌표를 넣고 대중교통으로 연다', () => {
    expect(byProvider.google).toBe(
      `https://www.google.com/maps/dir/?api=1&destination=${HAEMI.lat},${HAEMI.lng}&travelmode=transit`,
    );
  });

  it('이름에 공백이 있어도 링크가 깨지지 않는다', () => {
    const withSpace = buildMapLinks({ ...HAEMI, name: '갈매못 순교성지' }, true);
    for (const link of withSpace) {
      expect(link.url).not.toContain(' ');
    }
  });
});

describe('휴대폰에서는 모든 앱을 좌표로 연다 (2026-10-13 — 이름 검색은 엉뚱한 곳이 나온다)', () => {
  it('안드로이드 네이버: 공식 스킴(nmap) 인텐트에 위도·경도·이름, 앱 없으면 웹 지도로', () => {
    const naver = buildMapLinks(HAEMI, true, 'android').find((l) => l.provider === 'naver')!;
    expect(naver.url).toMatch(/^intent:\/\/route\/public\?/);
    expect(naver.url).toContain(`dlat=${HAEMI.lat}&dlng=${HAEMI.lng}`);
    expect(naver.url).toContain('scheme=nmap');
    expect(naver.url).toContain('package=com.nhn.android.nmap');
    expect(naver.url).toContain(
      'S.browser_fallback_url=https%3A%2F%2Fmap.naver.com%2Fp%2Fsearch%2F',
    );
    expect(naver.url).toContain('appname=https%3A%2F%2Fvisitholykorea.com');
    expect(naver.appUrl).toBeUndefined();
  });

  it('iOS 네이버: href 는 웹 지도, appUrl 로 앱을 먼저 시도한다', () => {
    const naver = buildMapLinks(HAEMI, true, 'ios').find((l) => l.provider === 'naver')!;
    expect(naver.url).toContain('map.naver.com/p/search/');
    expect(naver.appUrl).toMatch(/^nmap:\/\/route\/public\?/);
    expect(naver.appUrl).toContain(`dlat=${HAEMI.lat}&dlng=${HAEMI.lng}`);
  });

  it('안드로이드 티맵: 인텐트로 감싸 앱이 없으면 스토어가 뜬다 (전에는 무반응)', () => {
    const tmap = buildMapLinks(HAEMI, true, 'android').find((l) => l.provider === 'tmap')!;
    expect(tmap.url).toMatch(/^intent:\/\/route\?goalname=/);
    expect(tmap.url).toContain(`goalx=${HAEMI.lng}&goaly=${HAEMI.lat}`);
    expect(tmap.url).toContain('scheme=tmap');
    expect(tmap.url).toContain('package=com.skt.tmap');
  });

  it('iOS 티맵은 스킴 그대로', () => {
    const tmap = buildMapLinks(HAEMI, true, 'ios').find((l) => l.provider === 'tmap')!;
    expect(tmap.url).toMatch(/^tmap:\/\/route\?/);
  });

  it('구글지도는 플랫폼과 무관하게 같은 주소 — 앱이 있으면 앱, 없으면 웹', () => {
    const urls = (['android', 'ios', 'other'] as const).map(
      (p) => buildMapLinks(HAEMI, true, p).find((l) => l.provider === 'google')!.url,
    );
    expect(new Set(urls).size).toBe(1);
  });

  it('카카오맵은 플랫폼과 무관하게 같은 주소 — 하나로 웹·앱이 다 열린다', () => {
    const urls = (['android', 'ios', 'other'] as const).map(
      (p) => buildMapLinks(HAEMI, true, p).find((l) => l.provider === 'kakao')!.url,
    );
    expect(new Set(urls).size).toBe(1);
  });

  it('휴대폰 링크에도 공백·한글이 날것으로 남지 않는다', () => {
    for (const platform of ['android', 'ios'] as const) {
      for (const link of buildMapLinks({ ...HAEMI, name: '갈매못 순교성지' }, true, platform)) {
        expect(link.url).not.toContain(' ');
        expect(link.appUrl ?? '').not.toContain(' ');
      }
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
