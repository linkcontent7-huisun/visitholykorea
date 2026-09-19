#!/usr/bin/env python3
"""한국천주교주교회의 주소록의 공개 기본 정보를 천천히 수집한다."""
import argparse
import json
import re
import time
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qs, urljoin, urlparse

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'data' / 'research' / 'cbck-directory.jsonl'
CACHE = ROOT / 'scripts' / 'crawl' / '.cache' / 'cbck'
UA = 'VisitHolyKorea-research/1.0 (+https://github.com/linkcontent7-huisun/visitholykorea)'
BASE = 'https://directory.cbck.or.kr/OnlineAddress/Catholic/'
GUBN = {'4': '본당', '5': '공소', '16': '성지사적지', '15': '피정의집'}
DIOCESES = {
    '201000011': '서울', '201000013': '춘천', '201000016': '대전', '201000017': '인천',
    '201000018': '수원', '201000019': '원주', '201000020': '의정부', '201000021': '대구',
    '201000022': '부산', '201000023': '청주', '201000024': '마산', '201000025': '안동',
    '201000026': '광주', '201000027': '전주', '201000028': '제주', '201000029': '군종',
}
LABELS = ('소속', '지역/지구', '한글명칭', '영문명칭', '대표주소', '대표주소(영문)',
          '대표 전화 번호', '팩스번호', '주임신부번호', '홈페이지 주소', '전자우편 주소',
          '주임신부', '설립일', '주보', '신자수', '공소수')


def clean(value):
    return re.sub(r'\s+', ' ', value or '').strip() or None


def to_int(value):
    digits = re.sub(r'[^0-9]', '', value or '')
    return int(digits) if digits else None


def founded(value):
    match = re.search(r'(\d{4})\D+(\d{1,2})\D+(\d{1,2})', value or '')
    if not match:
        return None
    try:
        return datetime(*map(int, match.groups())).date().isoformat()
    except ValueError:
        return None


class Client:
    def __init__(self):
        self.session = requests.Session()
        self.last = 0.0

    def get(self, url):
        for attempt in range(3):
            wait = 1.5 - (time.monotonic() - self.last)
            if wait > 0:
                time.sleep(wait)
            try:
                response = self.session.get(url, headers={'User-Agent': UA}, timeout=30)
                self.last = time.monotonic()
                response.raise_for_status()
                return response.content
            except requests.RequestException:
                if attempt == 2:
                    raise
                time.sleep(1.5 * (attempt + 1))


def cached(client, url, filename):
    path = CACHE / filename
    if path.exists():
        return path.read_bytes()
    body = client.get(url)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(body)
    return body


def list_entries(client, gubn, gyogu):
    # Church.aspx 는 gubn 을 무시하고 늘 본당만 준다(2026-09-14 실측: 공소·성지·피정 전부 본당 145곳).
    # 본당은 그 페이지 한 장이면 되고, 나머지 구분은 SearchList.aspx 를 50개씩 넘기며 모은다.
    if gubn == '4':
        url = (f'{BASE}Church.aspx?cgubn=g&gubn={gubn}&gyogu={gyogu}&tbxSearch='
               '&scnt=0&start=1&paged=50&sort=0&gubn2=all&char=all')
        pages = [cached(client, url, f'list-{gubn}-{gyogu}.html')]
    else:
        pages = []
        start = 1
        while True:
            url = (f'{BASE.replace("Catholic/", "")}SearchList.aspx?cgubn=g&gubn={gubn}&gyogu={gyogu}&tbxSearch='
                   f'&start={start}&paged=50&sort=0&char=all')
            html = cached(client, url, f'list-{gubn}-{gyogu}-{start}.html')
            pages.append(html)
            if len(_codes_in(html, gubn)) < 50:
                break
            start += 50
    entries = []
    for html in pages:
        soup = BeautifulSoup(html, 'lxml')
        for link in soup.select('a[href*="DetailInfo.aspx"]'):
            query = parse_qs(urlparse(link['href']).query)
            code = (query.get('code') or [None])[0]
            # 검색 목록에는 주교회의·교황대사관 같은 다른 구분 링크도 섞여 있다 — 요청한 구분·교구만
            if code and (query.get('gubn') or [None])[0] == gubn and (query.get('gyogu') or [None])[0] == gyogu:
                entries.append((code, clean(link.get_text(' ', strip=True))))
    return list(dict.fromkeys(entries))


def _codes_in(html, gubn):
    soup = BeautifulSoup(html, 'lxml')
    codes = set()
    for link in soup.select('a[href*="DetailInfo.aspx"]'):
        query = parse_qs(urlparse(link['href']).query)
        if (query.get('gubn') or [None])[0] == gubn and query.get('code'):
            codes.add(query['code'][0])
    return codes


def pairs(html):
    # 사이트 표 구조가 조금 달라도 태그 사이를 |로 바꾼 텍스트에서 라벨 다음 값을 읽는다.
    text = BeautifulSoup(html, 'lxml').get_text('|', strip=True)
    parts = [clean(p) for p in text.split('|')]
    found = {}
    for index, part in enumerate(parts):
        if part in LABELS:
            found[part] = parts[index + 1] if index + 1 < len(parts) and parts[index + 1] not in LABELS else None
    return found


def detail_row(client, code, gubn, gyogu, list_name):
    url = (f'{BASE}DetailInfo.aspx?cgubn=g&gubn={gubn}&gyogu={gyogu}&code={code}'
           '&gubn2=all&char=all')
    values = pairs(cached(client, url, f'detail-{code}.html'))
    address = values.get('대표주소')
    zip_match = re.match(r'\s*(\d{5})\s+(.*)', address or '')
    diocese = clean(values.get('소속'))
    if diocese and diocese.endswith('교구'):
        diocese = diocese[:-2]
    district = clean(values.get('지역/지구'))
    if district and '/' in district:
        district = clean(district.rsplit('/', 1)[-1])
    pastor_value = values.get('주임신부')
    pastor, pastor_en = pastor_value, None
    if pastor_value and ' / ' in pastor_value:
        pastor, pastor_en = (clean(p) for p in pastor_value.split(' / ', 1))
    return {
        'cbck_code': code, 'gubn': int(gubn), 'kind': GUBN[gubn], 'diocese': diocese,
        'district': district, 'name': values.get('한글명칭') or list_name,
        'name_en': values.get('영문명칭'), 'address': zip_match.group(2) if zip_match else address,
        'zipcode': zip_match.group(1) if zip_match else None, 'address_en': values.get('대표주소(영문)'),
        'phone': values.get('대표 전화 번호'), 'fax': values.get('팩스번호'),
        'pastor_phone': values.get('주임신부번호'), 'homepage': values.get('홈페이지 주소'),
        'email': values.get('전자우편 주소'), 'pastor': pastor, 'pastor_en': pastor_en,
        'founded_on': founded(values.get('설립일')), 'patron': values.get('주보'),
        'members_count': to_int(values.get('신자수')), 'mission_count': to_int(values.get('공소수')),
        'fetched_at': datetime.now(timezone.utc).isoformat(), '_detail_url': url,
    }


def load_existing():
    if not OUT.exists():
        return {}, []
    rows = [json.loads(line) for line in OUT.read_text(encoding='utf-8').splitlines() if line.strip()]
    return {row['cbck_code']: row for row in rows}, rows


def write_summary(rows):
    counts = Counter((row['kind'], row['diocese'] or '미상') for row in rows)
    kinds = list(GUBN.values())
    dioceses = list(DIOCESES.values())
    lines = ['# CBCK 주소록 수집 요약', '', '| 구분 | 교구 | 건수 |', '| --- | --- | ---: |']
    for kind in kinds:
        for diocese in dioceses:
            if counts[kind, diocese]:
                lines.append(f'| {kind} | {diocese} | {counts[kind, diocese]} |')
    lines.extend(['', f'총 {len(rows):,}곳', f'전화 없는 곳: {sum(not row.get("phone") for row in rows):,}곳',
                  f'홈페이지 있는 곳: {sum(bool(row.get("homepage")) for row in rows):,}곳', ''])
    (ROOT / 'data' / 'research' / 'cbck-요약.md').write_text('\n'.join(lines), encoding='utf-8')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--gubn', choices=GUBN, required=True)
    parser.add_argument('--gyogu', choices=(*DIOCESES, 'all'), required=True)
    args = parser.parse_args()
    existing, rows = load_existing()
    client = Client()
    dioceses = list(DIOCESES) if args.gyogu == 'all' else [args.gyogu]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    for gyogu in dioceses:
        entries = list_entries(client, args.gubn, gyogu)
        print(f'{GUBN[args.gubn]} {DIOCESES[gyogu]}: 목록 {len(entries)}곳', flush=True)
        for code, name in entries:
            if code in existing:
                continue
            try:
                row = detail_row(client, code, args.gubn, gyogu, name)
                existing[code] = row
                rows.append(row)
                with OUT.open('a', encoding='utf-8') as output:
                    output.write(json.dumps(row, ensure_ascii=False) + '\n')
                print(f'  수집: {row["name"]} ({code})', flush=True)
            except Exception as error:
                print(f'  건너뜀: {name} ({code}) — {error}', flush=True)
    write_summary(rows)
    print(f'완료: 전체 {len(rows)}곳')


if __name__ == '__main__':
    main()
