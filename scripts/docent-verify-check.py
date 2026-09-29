"""T-050 원고 검증 결과 검사기 — Codex 가 원고의 한국어 문장을 하나도 빠짐없이 사본과 대조했는지 본다.
사용: python scripts/docent-verify-check.py <원고.json> <검증.json>"""
import json, re, sys

def sentences(t):
    return [s.strip() for s in re.split(r'(?<=[.!?])\s+', t or '') if s.strip()]

doc, ver = sys.argv[1], sys.argv[2]
d = json.load(open(doc, encoding='utf-8'))
try:
    v = json.load(open(ver, encoding='utf-8'))
except Exception as e:
    print('FAIL 검증 파일 없음/깨짐:', e); sys.exit(1)

want = sentences(d['intro']['narration']) + sentences(d['outro']['narration'])
for p in d['points']:
    for k in ('narration', 'lookFor', 'forEveryone'):
        want += sentences(p.get(k))
errs = []
got = {x.get('text', '').strip(): x for x in v.get('sentences', [])}
for s in want:
    x = got.get(s)
    if not x: errs.append(f'판정 없음: {s[:30]}'); continue
    if x.get('verdict') not in ('근거있음', '근거없음', '틀림'): errs.append(f'verdict 값 오류: {s[:20]}')
    if x.get('verdict') == '근거있음' and not x.get('evidence'): errs.append(f'근거있음인데 evidence 없음: {s[:20]}')
    if x.get('verdict') in ('근거없음', '틀림') and not x.get('fix'): errs.append(f'고칠 문장인데 fix 없음: {s[:20]}')
if len(v.get('english', [])) < len(d['points']) + 2:
    errs.append(f"영어 대조 {len(v.get('english', []))}개 < 여는말·지점·맺음말 {len(d['points']) + 2}개")
for e in v.get('english', []):
    if e.get('verdict') not in ('일치', '어긋남'): errs.append(f"영어 verdict 값 오류: {e.get('part')}")
    if e.get('verdict') == '어긋남' and not e.get('fix'): errs.append(f"영어 어긋남인데 fix 없음: {e.get('part')}")
if v.get('siteVerdict') not in ('OK', '고칠것'): errs.append(f"siteVerdict 값 오류: {v.get('siteVerdict')}")
if errs:
    print('FAIL', doc); [print('  -', e) for e in errs]; sys.exit(1)
bad = sum(1 for s in want if got[s]['verdict'] != '근거있음')
print(f'OK {doc} — 문장 {len(want)}개 중 고칠 것 {bad}개, siteVerdict={v["siteVerdict"]}')
