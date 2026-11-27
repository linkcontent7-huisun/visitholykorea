import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  cardMeta,
  faqMeta,
  regionMeta,
  renderPage,
  robotsTxt,
  routeMeta,
  siteMeta,
  sitemapXml,
  type SeoSite,
} from '../scripts/lib/seo-pages';

const template = readFileSync('index.html', 'utf-8');

const site: SeoSite = {
  id: '05cc24b2-c528-41c4-8c9d-467ac597c3df',
  name: '서짓골 성지',
  seoTitle: '서짓골 성지 - 15년을 떠돈 순교자의 유해',
  seoDescription: '충남 보령 서짓골성지, 다블뤼 주교 등 순교자들의 유해가 머물렀던 곳.',
  description: '본문 <설명>',
  location: '충청남도 보령시 미산면 평라리 438-3',
  regionProvince: '충남',
  lat: 36.23,
  lng: 126.65,
  imageUrl: null,
};

describe('renderPage — 실제 index.html 로', () => {
  const html = renderPage(template, siteMeta(site));

  it('제목·설명·OG 가 성지 것으로 바뀐다 (원래 앱 소개 문구가 남지 않는다)', () => {
    expect(html).toContain(
      '<title>서짓골 성지 - 15년을 떠돈 순교자의 유해 | 천주교 성지순례 · 비지트홀리코리아</title>',
    );
    expect(html).toMatch(/name="description"\s+content="충남 보령 서짓골성지/);
    expect(html).toMatch(/og:title" content="서짓골 성지 - 15년/);
    expect(html).toMatch(/og:description"\s+content="충남 보령/);
    expect(html).not.toContain('<title>Visit Holy Korea - 길 위에서');
  });

  it('canonical·구조화 데이터·크롤러용 본문이 들어간다', () => {
    expect(html).toContain(
      `<link rel="canonical" href="https://visitholykorea.com/sites/${site.id}" />`,
    );
    expect(html).toContain('"@type":["TouristAttraction","PlaceOfWorship"]');
    expect(html).toContain('"latitude":36.23');
    expect(html).toContain('<div id="root"><h1>서짓골 성지</h1>');
    expect(html).toContain('본문 &lt;설명&gt;'); // HTML 이스케이프
  });

  it('JSON 안의 </script> 가 태그를 닫지 못한다', () => {
    const evil = renderPage(template, siteMeta({ ...site, name: '</script><b>' }));
    // index.html 에도 사이트 이름 블록(WebSite)이 있어 페이지 것은 맨 끝에 붙는다(2026-11-07)
    const ld = evil.split('application/ld+json">').at(-1)!.split('</script>')[0]!;
    expect(ld).toContain('\\u003c/script>');
  });
});

describe('seo 보조', () => {
  it('seo_title 이 없으면 성지 이름을 쓴다', () => {
    expect(siteMeta({ ...site, seoTitle: null }).title).toBe(
      '서짓골 성지 | 천주교 성지순례 · 비지트홀리코리아',
    );
  });

  it('코스 메타', () => {
    const m = routeMeta({ slug: 'naepo-walk', title: '내포 길', subtitle: null, description: 'd' });
    expect(m.path).toBe('/routes/naepo-walk');
    expect(m.jsonLd['@type']).toBe('TouristTrip');
  });

  it('sitemap 은 한글 주소를 인코딩한다, robots 는 sitemap 을 가리킨다', () => {
    expect(sitemapXml(['/region/서울'])).toContain('/region/%EC%84%9C%EC%9A%B8</loc>');
    expect(robotsTxt()).toContain('Sitemap: https://visitholykorea.com/sitemap.xml');
  });
});

describe('cardMeta — 공유받은 세례명 카드의 미리보기', () => {
  const html = renderPage(template, cardMeta('ko', 'Andrew', '안드레아'));

  it('주소·제목·그림이 그 카드 것이다', () => {
    expect(html).toContain(
      '<link rel="canonical" href="https://visitholykorea.com/card/ko/Andrew" />',
    );
    expect(html).toContain('<title>「안드레아」 세례명 카드 | Visit Holy Korea</title>');
    expect(html).toContain(
      '<meta property="og:image" content="https://visitholykorea.com/baptism-cards/og/ko/Andrew.jpg" />',
    );
  });

  it('모르는 언어는 영어 문구로 떨어진다', () => {
    expect(cardMeta('xx', 'Andrew', 'Andrew').title).toBe(
      'Baptismal name card: Andrew | Visit Holy Korea',
    );
  });
});

describe('공유 미리보기 그림 (v7.0)', () => {
  it('사진이 없는 성지는 로고 대신 이름·지역 카드 그림을 쓴다', () => {
    const image = siteMeta(site).image;
    expect(image).not.toContain('logo.png');
    const q = new URL(image).searchParams;
    expect(new URL(image).pathname).toBe('/api/og');
    expect(q.get('title')).toBe('서짓골 성지');
    expect(q.get('sub')).toBe('충남');
  });

  it('사진이 있는 성지는 사진을 그대로 쓴다', () => {
    expect(siteMeta({ ...site, imageUrl: 'https://x/p.jpg' }).image).toBe('https://x/p.jpg');
  });
});

describe('guideMeta — 성지순례 안내 글', () => {
  it("제목에 '성지순례' 가 앞에 오고 본문이 HTML 에 들어간다", async () => {
    const { guideMeta } = await import('../scripts/lib/seo-pages');
    const meta = guideMeta();
    expect(meta.path).toBe('/guide');
    expect(meta.title.startsWith('성지순례')).toBe(true);
    expect(meta.bodyHtml).toContain('<h1>성지순례, 처음이라면</h1>');
    expect(meta.bodyHtml).toContain('미사 시간');
  });
});

describe('카드·지역·자주 묻는 질문 쪽 (2026-11-21 지시서 3호)', () => {
  it('영어 카드는 <html lang="en"> 이고 본문이 화면의 그림 설명·버튼 글이다', () => {
    const html = renderPage(template, cardMeta('en', 'Cecilia', 'Cecilia'));
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<h1>Card for the baptismal name Cecilia</h1>');
    expect(html).toContain('>Open visitholykorea.com</a>');
  });

  it('성지 쪽은 lang 을 따로 주지 않아 ko 그대로다', () => {
    expect(renderPage(template, siteMeta(site))).toContain('<html lang="ko">');
  });

  it('지역 쪽은 45km 안 성지만 가까운 순으로 넣고 제목이 첫 화면과 다르다', () => {
    const near: SeoSite = { ...site, id: 'a', name: '가까운 성지', lat: 37.57, lng: 126.98 };
    const mid: SeoSite = { ...site, id: 'b', name: '중간 성지', lat: 37.7, lng: 127.1 };
    const far: SeoSite = { ...site, id: 'c', name: '먼 성지', lat: 35.1, lng: 129.0 };
    const meta = regionMeta('서울', [far, mid, near]);
    expect(meta.title).toBe('서울에서 떠나는 성지순례 | Visit Holy Korea');
    expect(meta.bodyHtml.indexOf('가까운 성지')).toBeLessThan(meta.bodyHtml.indexOf('중간 성지'));
    expect(meta.bodyHtml).not.toContain('먼 성지');
    expect(meta.bodyHtml).toContain('2곳 · 서울에서 45km 안 · 전국 3곳 중');
  });

  it('자주 묻는 질문 쪽은 두 탭의 문답을 모두 넣고 FAQPage 구조화 데이터를 단다', () => {
    const meta = faqMeta();
    expect(meta.title).toBe('자주 묻는 질문 | Visit Holy Korea');
    expect(meta.bodyHtml).toContain('<h2>회원가입 및 로그인</h2>');
    expect(meta.bodyHtml).toContain('<h2>서비스 이용</h2>');
    expect(meta.jsonLd['@type']).toBe('FAQPage');
    expect((meta.jsonLd.mainEntity as unknown[]).length).toBeGreaterThan(4);
  });
});
