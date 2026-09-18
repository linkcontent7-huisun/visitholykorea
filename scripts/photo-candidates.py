# 사진 없는 성지의 저작권 자유 사진 후보를 위키미디어 공용 API 로 찾는다 (T-024 B).
# 사용: python scripts/photo-candidates.py  → docs/.../사진후보.md 갱신
import io, re, json, time, urllib.parse, urllib.request
SRC = 'docs/70-agent-workspace/tasks/T-024-지점원고-확장/대상목록.md'
OUT = 'docs/70-agent-workspace/tasks/T-024-지점원고-확장/사진후보.md'
API = 'https://commons.wikimedia.org/w/api.php'
UA = {'User-Agent': 'VisitHolyKorea/1.0 (photo sourcing; linkcontent7@gmail.com)'}

def api(params):
    q = urllib.parse.urlencode({**params, 'format': 'json'})
    req = urllib.request.Request(f'{API}?{q}', headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r: return json.load(r)

def search(term, n=6, must=()):
    try:
        d = api({'action': 'query', 'list': 'search', 'srsearch': term, 'srnamespace': 6, 'srlimit': n})
    except Exception as e: return []
    titles = [x['title'] for x in d.get('query', {}).get('search', []) if re.search(r'\.(jpe?g|png|webp)$', x['title'], re.I)]
    if not titles: return []
    d = api({'action': 'query', 'titles': '|'.join(titles), 'prop': 'imageinfo', 'iiprop': 'url|extmetadata', 'iiextmetadatafilter': 'LicenseShortName|ImageDescription|Artist'})
    out = []
    for p in d.get('query', {}).get('pages', {}).values():
        ii = (p.get('imageinfo') or [{}])[0]; m = ii.get('extmetadata', {})
        desc = re.sub(r'<[^>]+>', '', m.get('ImageDescription', {}).get('value', ''))[:60].replace('|', '/')
        hay = (p.get('title','') + ' ' + m.get('ImageDescription', {}).get('value', '')).lower()
        if must and not any(t.lower() in hay for t in must): continue
        out.append((ii.get('descriptionurl', ''), m.get('LicenseShortName', {}).get('value', '표시 없음'), desc))
    return out

# B 표만 읽는다
rows = []; inB = False
for line in io.open(SRC, encoding='utf-8'):
    if line.startswith('## B.'): inB = True
    m = re.match(r'\| ([0-9a-f-]{36}) \| (.+?) \| (.*?) \|', line)
    if inB and m: rows.append(m.groups())

lines = ['# T-024 사진 후보 (위키미디어 공용 API 실측 ' + time.strftime('%Y-%m-%d %H:%M') + ')', '',
         '검색어: 성지 이름 → 이름에서 "성지·성당·순교" 등을 뺀 핵심어 → 지역명+성당. 라이선스는 API 의 LicenseShortName 값 그대로. **사진이 그 성지가 맞는지는 사람이 눌러 확인해야 한다.**', '',
         '| siteId | 성지 | 후보 URL | 출처 | 라이선스 | 설명(원문 앞 60자) | 검색어 |', '|---|---|---|---|---|---|---|']
found = 0
for sid, name, loc in rows:
    core = re.sub(r'\(.*?\)', '', name)
    core2 = re.sub(r'(순교|성지|성당|사적지|기념관|기념성당|묘|터|공소)', ' ', core).strip()
    region = (loc.split()[1] if len(loc.split()) > 1 else '')
    terms = [core, core2, f'{region} {core2}'.strip(), f'{name} 천주교']
    hits = []
    for t in terms:
        if not t.strip(): continue
        toks = [w for w in re.split(r'\s+', core2) if len(w) >= 2]
        hits = search(t, must=toks or [core])
        if hits: break
        time.sleep(0.3)
    if hits:
        found += 1
        for url, lic, desc in hits[:3]:
            lines.append(f'| {sid} | {name} | {url} | 위키미디어 공용 | {lic} | {desc} | {t} |')
    else:
        lines.append(f'| {sid} | {name} | 후보 없음 | — | — | — | {" / ".join(terms)} |')
    time.sleep(0.3)
lines.append(''); lines.append(f'대상 {len(rows)}곳 · 후보 있음 {found}곳 · 없음 {len(rows)-found}곳')
io.open(OUT, 'w', encoding='utf-8', newline='\n').write('\n'.join(lines))
print(f'대상 {len(rows)} · 후보 있음 {found}')
