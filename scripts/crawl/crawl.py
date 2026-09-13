#!/usr/bin/env python3
"""저작권 범위 안의 기사 메타데이터만 수집한다. 원문은 결과 파일에 넣지 않는다."""
import argparse, json, re, time
from datetime import date
from pathlib import Path
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser
from urllib.parse import quote

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'data' / 'research' / 'articles.jsonl'
UA = 'VisitHolyKorea-research/1.0 (+https://github.com/linkcontent7-huisun/visitholykorea)'
KEYWORDS = ('순례', '성지', '성당', '성모상', '스테인드글라스', '성물', '조각', '성미술', '유물', '순교', '도보', '코스', '걷기', '성당 건축', '제대', '십자가의 길', '성화')
TOPIC_WORDS = {'pilgrimage_route': ('코스', '도보', '걷기', '순례길'), 'pilgrimage_record': ('순례기', '탐방', '순례'), 'statue': ('성모상', '성상'), 'stained_glass': ('스테인드글라스', '스테인드 글라스'), 'relic': ('성물', '유물', '유해'), 'sculpture': ('조각',), 'artwork': ('성미술', '성화', '예술'), 'architecture': ('건축', '제대'),}
KIND_WORDS = {'statue': ('성모상', '성상'), 'stained_glass': ('스테인드글라스', '스테인드 글라스'), 'relic': ('성물', '유물'), 'sculpture': ('조각',), 'painting': ('성화', '회화'), 'architecture': ('건축', '제대')}

class PoliteClient:
    def __init__(self): self.session, self.last, self.robots = requests.Session(), 0.0, {}
    def allowed(self, url):
        base = f'{urlparse(url).scheme}://{urlparse(url).netloc}'
        if base not in self.robots:
            rp = RobotFileParser(f'{base}/robots.txt')
            # urllib 기본 User-Agent는 실행 환경의 프록시에서 막힐 수 있다. 실제 기사
            # 요청과 같은 신원으로 robots를 읽어야 정책 판정도 같은 조건이 된다.
            try:
                response = self.session.get(rp.url, headers={'User-Agent': UA}, timeout=25)
                response.raise_for_status()
                rp.parse(response.text.splitlines())
            except requests.RequestException:
                return False
            self.robots[base] = rp
        return self.robots[base].can_fetch(UA, url)
    def get(self, url):
        if not self.allowed(url): raise RuntimeError(f'robots.txt가 허용하지 않은 URL: {url}')
        for attempt in range(3):
            delay = 1.5 - (time.monotonic() - self.last)
            if delay > 0: time.sleep(delay)
            try:
                response = self.session.get(url, headers={'User-Agent': UA}, timeout=25)
                self.last = time.monotonic(); response.raise_for_status(); return response
            except requests.RequestException:
                if attempt == 2: raise
                time.sleep(1.5 * (attempt + 1))

def clean(value): return re.sub(r'\s+', ' ', value or '').strip()
def sentences(text): return [clean(s) for s in re.split(r'(?<=[.!?。])\s+|\n+', text) if len(clean(s)) > 20]
def find_urls(client, sitemap):
    seen, pending, found = set(), [sitemap], []
    while pending and len(found) < 5000:
        url = pending.pop(0)
        if url in seen: continue
        seen.add(url)
        try: soup = BeautifulSoup(client.get(url).content, 'xml')
        except Exception as exc: print(f'사이트맵 건너뜀: {url} ({exc})'); continue
        locs = [clean(n.get_text()) for n in soup.find_all('loc')]
        for loc in locs:
            if loc.endswith('.xml') or 'sitemap' in loc: pending.append(loc)
            else: found.append(loc)
    return found
SEARCH_WORDS = ['성지순례', '순례길', '순교성지', '성모상', '스테인드글라스', '성미술', '성물', '성당 건축', '도보 순례', '순례기']
def find_urls_search(client, max_pages=12):
    """가톨릭뉴스(ND소프트 CMS)의 검색 목록으로 5년치를 찾는다 — 사이트맵은 최신 100건뿐이다."""
    found, seen = [], set()
    for word in SEARCH_WORDS:
        for page in range(1, max_pages + 1):
            url = f'https://www.catholicnews.co.kr/news/articleList.html?sc_word={quote(word)}&view_type=sm&page={page}'
            try: html = client.get(url).text
            except Exception as exc: print(f'검색 건너뜀: {word} p{page} ({exc})'); break
            ids = re.findall(r'articleView\.html\?idxno=(\d+)', html)
            new = [i for i in dict.fromkeys(ids) if i not in seen]
            if not new: break
            for i in new: seen.add(i); found.append(f'https://www.catholicnews.co.kr/news/articleView.html?idxno={i}')
    return found
def text_from(soup):
    for tag in soup.select('script,style,nav,footer,header,aside'): tag.decompose()
    candidates = soup.select('article, .article_body, .article-body, .view_cont, .news_content, #articleBody')
    return clean((candidates[0] if candidates else soup.body).get_text(' ', strip=True))
def site_matches(text, names):
    return [name for name in names if len(name) >= 3 and name in text]
def topics(text):
    picked = [topic for topic, words in TOPIC_WORDS.items() if any(word in text for word in words)]
    return picked or ['shrine_news']
def artwork_facts(text):
    found = []
    for kind, words in KIND_WORDS.items():
        if any(word in text for word in words): found.append({'title': next(word for word in words if word in text), 'artist': None, 'kind': kind})
    return found
def parse_article(client, source, url, names, since):
    soup = BeautifulSoup(client.get(url).content, 'lxml')
    title = clean((soup.select_one('meta[property="og:title"]') or soup.select_one('h1') or soup.title).get('content') if soup.select_one('meta[property="og:title"]') else (soup.select_one('h1') or soup.title).get_text())
    if not title or not any(word in f'{title} {url}' for word in KEYWORDS): return None
    body = text_from(soup)
    if not any(word in body for word in KEYWORDS): return None
    dates = re.findall(r'20(?:2[1-9]|3\d)[.\-/년\s]+\d{1,2}(?:[.\-/월\s]+\d{1,2})?', body[:3000])
    # 날짜를 확인할 수 없는 글은 최근 5년 조건을 증명할 수 없으므로 넣지 않는다.
    if not dates: return None
    parts = re.findall(r'\d+', dates[0]); published = '-'.join([parts[0], parts[1].zfill(2), (parts[2] if len(parts)>2 else '01').zfill(2)])
    if published < since.isoformat(): return None
    matched = site_matches(f'{title} {body}', names)
    core = next((s for s in sentences(body) if any(name in s for name in matched)), sentences(body)[0] if sentences(body) else '')
    excerpt = core[:200]
    summary = f'이 기사는 {", ".join(matched[:3]) or "가톨릭 성지"}와 관련한 {", ".join(topics(f"{title} {body}")[:2])} 내용을 소개한다. 기사에 제시된 장소·인물·예술 요소는 후속 감수 때 원문 URL로 다시 확인해야 한다.'
    author_node = soup.select_one('[class*=author], [class*=writer], .byline')
    years = sorted(set(re.findall(r'\b(?:18|19|20)\d{2}\b', body)))
    people = sorted(set(re.findall(r'([가-힣]{2,4}(?:\s?(?:신부|주교|수녀|추기경|복자|성인))?)', body)))[:20]
    return {'source': source, 'url': url, 'title': title[:500], 'published_at': published, 'author': clean(author_node.get_text())[:100] if author_node else None, 'summary': summary[:300], 'excerpt': excerpt, 'topics': topics(f'{title} {body}'), 'facts': {'sites': matched, 'people': people, 'years': years, 'artworks': artwork_facts(body), 'route_stops': matched if 'pilgrimage_route' in topics(f'{title} {body}') else []}}

def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--source', required=True, choices=('catholicnews', 'cpbc', 'manual')); parser.add_argument('--since', default='2021-09-01'); parser.add_argument('--limit', type=int, default=300); parser.add_argument('--ids', help='가톨릭뉴스 기사 번호 범위 FROM-TO (예: 35369-28000, 큰 번호부터)'); args = parser.parse_args()
    since = date.fromisoformat(args.since); names = [r['name'] for r in json.loads((ROOT / 'scripts/crawl/site-names.json').read_text(encoding='utf-8'))]
    existing = {json.loads(line)['url'] for line in OUT.read_text(encoding='utf-8').splitlines() if line.strip()} if OUT.exists() else set()
    client = PoliteClient()
    if args.ids:
        # 검색·목록 페이지가 JS 의존이라 못 쓴다 → 순번 기사 번호를 거꾸로 훑는다 (1.5초 간격, robots 허용)
        hi, lo = (int(x) for x in args.ids.split('-'))
        urls = [f'https://www.catholicnews.co.kr/news/articleView.html?idxno={i}' for i in range(hi, lo - 1, -1)]
    else:
        urls = [line.strip() for line in (ROOT / 'scripts/crawl/manual-urls.txt').read_text(encoding='utf-8').splitlines() if line.strip() and not line.startswith('#')] if args.source == 'manual' else (find_urls_search(client) + find_urls(client, 'https://www.catholicnews.co.kr/sitemap.xml') if args.source == 'catholicnews' else find_urls(client, 'https://news.cpbc.co.kr/seo?type=news_sitemap'))
    rows = []
    for url in urls:
        if len(rows) >= args.limit: break
        # 사이트맵은 대개 숫자 URL만 제공한다. 먼저 제목을 읽어 후보를 가린 뒤,
        # 본문 추출은 제목·URL 중 하나가 키워드인 경우에만 진행한다.
        if url in existing: continue
        try:
            row = parse_article(client, args.source if args.source != 'manual' else 'catholictimes', url, names, since)
            if row:
                rows.append(row); existing.add(url); print(f'수집: {row["title"]}', flush=True)
                OUT.parent.mkdir(parents=True, exist_ok=True)
                with OUT.open('a', encoding='utf-8') as output: output.write(json.dumps(row, ensure_ascii=False) + chr(10))
        except Exception as exc:
            if 'get_text' not in str(exc): print(f'기사 건너뜀: {url} ({exc})', flush=True)
    rows_saved, rows = rows, []
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open('a', encoding='utf-8') as output:
        for row in rows: output.write(json.dumps(row, ensure_ascii=False) + '\n')
    print(f'완료: 새 기사 {len(rows_saved)}건')
if __name__ == '__main__': main()
