# T-051 원고의 siteId 가 targets.json(DB 실측) 과 맞는지 검사·교정 — 10/2 삼성산 원고에 지어낸 id 가 들어간 사고 뒤 추가
import json,io,glob,os,sys
T={r['name']:r['id'] for r in json.load(io.open('data/research/docent-gap/targets.json',encoding='utf-8'))}
bad=0
for f in sorted(glob.glob('data/research/docent-gap/docent/*.json')):
    d=json.load(io.open(f,encoding='utf-8')); real=T.get(d.get('siteName'))
    if real is None: print('✗',os.path.basename(f),'siteName 이 대상 목록에 없음:',d.get('siteName')); bad+=1; continue
    if real!=d.get('siteId'):
        d['siteId']=real; json.dump(d,io.open(f,'w',encoding='utf-8'),ensure_ascii=False,indent=2)
        print('교정',os.path.basename(f),'→',real); bad+=1
print('siteId 검사', len(T), '대상 중 원고', len(glob.glob('data/research/docent-gap/docent/*.json')), '곳 · 교정/오류', bad)
sys.exit(1 if bad else 0)
