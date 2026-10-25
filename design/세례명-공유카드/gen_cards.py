"""103위 성인 표(주교회의)에서 세례명별 공유 카드를 찍는다.

쓰는 값은 data/research/saints103-cbck.tsv 의 이름·순교일·관련성지뿐이다 (그 밖의 설명은 넣지 않는다).
감옥(옥사·포청옥·형조전옥)과 빈칸은 앱의 성지가 아니라서 성지 칸에 「정리 중」으로 표시한다.
실행: python gen_cards.py  → cards/*.png , cards/index.tsv
"""

import csv
from collections import defaultdict
from pathlib import Path

from make_card import HERE, ROOT, card

NOT_SITE = {"옥사", "포청옥", "형조전옥", ""}

# 합친 표(굿뉴스+주교회의): 성/성녀 구분은 굿뉴스 값 그대로 쓴다
merged = list(csv.reader(open(ROOT / "data/research/saints103-merged.tsv", encoding="utf-8"), delimiter="\t"))[1:]
KIND = {m[0]: m[2] for m in merged}
rows = list(csv.reader(open(ROOT / "data/research/saints103-cbck.tsv", encoding="utf-8"), delimiter="\t"))[1:]

by_bapt = defaultdict(list)
for no, name, status, date, *rest in rows:
    site = rest[0] if rest else ""  # 95번은 관련성지 칸이 비어 있다
    main = name.split("(")[0].strip()  # 선교사는 앞의 한국식 이름을 쓴다
    by_bapt[main.split()[-1]].append((int(no), main, date, site, KIND[no]))

out_dir = HERE / "cards"
out_dir.mkdir(exist_ok=True)
index = []
for bapt, items in sorted(by_bapt.items()):
    items.sort(key=lambda x: (x[2].replace("?", "9"), x[0]))
    no, main, date, site, kind = items[0]
    year = date[:4]
    prefix = kind
    n = len(items)
    saint = f"{prefix} {main}" + (f" 외 {n - 1}분" if n > 1 else "")
    sites = []
    for _, _, _, s, _ in items:
        if s not in NOT_SITE and s not in sites:
            sites.append(s)
    where = site if site not in NOT_SITE else "옥중"
    detail = f"{year}년 {where}에서 순교" if n == 1 else f"같은 세례명 성인 {n}분 · 가장 먼저 {year}년"
    card(bapt, saint, detail, sites[:3] if sites else ["정리 중"], out_dir / f"{bapt}.png")
    index.append((bapt, n, "·".join(sites) or "정리 중"))

with open(out_dir / "index.tsv", "w", encoding="utf-8") as f:
    f.write("세례명\t성인수\t관련성지\n")
    for r in index:
        f.write("\t".join(map(str, r)) + "\n")
print(len(index), "cards")
