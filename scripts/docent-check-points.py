# 지점 원고 JSON 검사 (DB 없이). 소개글 검사(docent-check.ts)의 JSON 판.
import json, io, re, sys, glob, collections, subprocess
tracked = set(subprocess.run(['git','-c','core.quotepath=off','ls-files','data/docent'],capture_output=True,text=True,encoding='utf-8').stdout.splitlines())
ids = {}
for line in io.open('docs/70-agent-workspace/tasks/T-024-지점원고-확장/대상목록.md', encoding='utf-8'):
    m = re.match(r'\| ([0-9a-f-]{36}) \| (.+?) \|', line)
    if m: ids[m.group(1)] = m.group(2)
files = [f for f in glob.glob('data/docent/*.json') if '_템플릿' not in f]
sent = collections.Counter(); fails = 0
def sentences(t): return [s.strip() for s in re.split(r'(?<=[.!?])\s+', t) if len(s.strip()) >= 20]
for f in sorted(files):
    d = json.load(io.open(f, encoding='utf-8')); errs = []
    new = f.replace(chr(92),'/') not in tracked  # 기존 19곳(사장님 검수분)은 틀 문장 집계에만 쓴다
    if new and d.get('siteId') not in ids: errs.append('siteId 가 대상목록에 없음')
    pts = d.get('points', [])
    if not 3 <= len(pts) <= 6: errs.append(f'지점 {len(pts)}개')
    texts = [d.get('intro',{}).get('narration','')] + [p.get('narration','') for p in pts] + [d.get('outro',{}).get('narration','')]
    for i, p in enumerate(pts, 1):
        if 'http' not in (p.get('sourceNote') or ''): errs.append(f'{i}지점 출처 url 없음')
        n = p.get('narration','')
        if re.search(r'(?<![니])다\.\s|[가-힣]자\.\s', n + ' '): errs.append(f'{i}지점 반말')
    # 영어(En 접미사 필드): 하나라도 있으면 여는 말·모든 지점(제목+본문)·맺음말이 전부 있어야 하고 한글이 섞이면 안 된다
    # 번역 필드(En/Es/It/Fr/Pt 접미사): 하나라도 있으면 여는 말·모든 지점(제목+본문)·맺음말이 전부 있어야 하고 한글이 섞이면 안 된다
    for sfx, label in (('En','영어'),('Es','스페인어'),('It','이탈리아어'),('Fr','프랑스어'),('Pt','포르투갈어')):
        k='narration'+sfx
        if not (d.get('intro',{}).get(k) or any(p.get(k) for p in pts)): continue
        tr_texts = [d.get('intro',{}).get(k,'')] + [p.get(k,'') for p in pts] + [d.get('outro',{}).get(k,'')]
        if not all(tr_texts): errs.append(f'{label} 누락(여는 말/지점/맺음말 중 빈 칸)')
        if any(not p.get('title'+sfx) for p in pts): errs.append(f'{label} 제목 누락')
        if any(re.search(r'[가-힣]', t or '') for t in tr_texts + [p.get('title'+sfx,'') or '' for p in pts] + [p.get('lookFor'+sfx,'') or '' for p in pts]): errs.append(f'{label}에 한글 섞임')
        if any(re.search(r'Kim Dae-?geon', t or '') for t in tr_texts): errs.append(f"{label} 표기: Kim Dae-geon → Kim Taegon")
    local = collections.Counter(s for t in texts for s in sentences(t))
    dup = [s for s, c in local.items() if c > 1]
    if dup: errs.append(f'파일 안 반복: {dup[0][:30]}')
    for s in local: sent[s] += 1
    if errs and new: fails += 1; print('  ✗', f.split('/')[-1], '—', ' · '.join(errs))
tmpl = [(s, c) for s, c in sent.items() if c >= 3]
for s, c in tmpl: print('  틀 문장', c, '파일:', s[:60])
print(f'지점 원고 {len(files)}곳 · 실패 {fails} · 틀 문장 {len(tmpl)}종')
sys.exit(1 if fails or tmpl else 0)
