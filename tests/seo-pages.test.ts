import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
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
      '<title>서짓골 성지 - 15년을 떠돈 순교자의 유해 | Visit Holy Korea</title>',
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
    const ld = evil.split('application/ld+json">')[1]!.split('</script>')[0]!;
    expect(ld).toContain('\\u003c/script>');
  });
});

describe('seo 보조', () => {
  it('seo_title 이 없으면 성지 이름을 쓴다', () => {
    expect(siteMeta({ ...site, seoTitle: null }).title).toBe('서짓골 성지 | Visit Holy Korea');
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
