# 사본 폴더에서 본문다운 줄(긴 줄)만 뽑아 보여준다 — 메뉴·목록 잡음을 걷어내고 원고 근거를 읽기 위해.
import sys, glob, io, os
seen = set()
for f in sorted(glob.glob(os.path.join(sys.argv[1], '*.txt'))):
    lines = [l.strip() for l in io.open(f, encoding='utf-8')]
    body = [l for l in lines if len(l) >= int(sys.argv[2] if len(sys.argv) > 2 else 60) and l not in seen]
    seen.update(body)
    if body:
        print(f'### {os.path.basename(f)} — {lines[0]}')
        for l in body: print('-', l[:900])
