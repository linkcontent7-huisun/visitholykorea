"""103위 성인 표(주교회의)에서 세례명별 공유 카드를 찍는다.

쓰는 값은 data/research/saints103-cbck.tsv 의 이름·순교일·관련성지뿐이다 (그 밖의 설명은 넣지 않는다).
감옥(옥사·포청옥·형조전옥)과 빈칸은 앱의 성지가 아니라서 성지 칸에 「정리 중」으로 표시한다.
세례명 카드(43장)에는 같은 세례명 성인을 모두 적고(대표 14분 먼저), 이름이 전해진 한국인 성인은
「김대건 안드레아」처럼 따로 고르는 개인 카드도 찍는다 (2026-11-08 사장님 지시, CPBC 「모두의 세례명」 참고).
실행: python gen_cards.py  → cards/*.png , cards/index.tsv
"""

import csv
from collections import defaultdict
from pathlib import Path

from make_card import HERE, ROOT, card, order_key, personal, short_name

NOT_SITE = {"옥사", "포청옥", "형조전옥", ""}

# 합친 표(굿뉴스+주교회의): 성/성녀 구분은 굿뉴스 값 그대로 쓴다
merged = list(csv.reader(open(ROOT / "data/research/saints103-merged.tsv", encoding="utf-8"), delimiter="\t"))[1:]
KIND = {m[0]: m[2] for m in merged}
rows = list(csv.reader(open(ROOT / "data/research/saints103-cbck.tsv", encoding="utf-8"), delimiter="\t"))[1:]

by_bapt = defaultdict(list)
people = []
for no, name, status, date, *rest in rows:
    site = rest[0] if rest else ""  # 95번은 관련성지 칸이 비어 있다
    main = name.split("(")[0].strip()  # 선교사는 앞의 한국식 이름을 쓴다
    item = (int(no), main, date, site, KIND[no])
    by_bapt[main.split()[-1]].append(item)
    if personal(main, name):
        people.append((item, status))


def died(date: str, site: str) -> str:
    return f"{date[:4]}년 {site if site not in NOT_SITE else '옥중'}에서 순교"


out_dir = HERE / "cards"
out_dir.mkdir(exist_ok=True)
index = []
for bapt, items in sorted(by_bapt.items()):
    items.sort(key=lambda x: order_key(x[1], x[2], x[0]))
    n = len(items)
    full = [f"{kind} {main}" for _, main, _, _, kind in items]
    short = [short_name(main) for _, main, _, _, _ in items]
    sites = []
    for _, _, _, s, _ in items:
        if s not in NOT_SITE and s not in sites:
            sites.append(s)
    _, _, date, site, _ = items[0]
    card(bapt, full, short, died(date, site), f"같은 세례명 성인 {n}분", f"같은 세례명 한국 성인 {n}분",
         sites[:3] if sites else ["정리 중"], out_dir / f"{bapt}.png")
    index.append((bapt, n, "·".join(sites) or "정리 중"))

for (_, main, date, site, kind), status in sorted(people, key=lambda p: p[0][1]):
    card(main, [f"{kind} {main}"], [], f"{status} · {died(date, site)}", "", "",
         [site] if site not in NOT_SITE else ["정리 중"], out_dir / f"{main}.png")
    index.append((main, 1, site if site not in NOT_SITE else "정리 중"))

with open(out_dir / "index.tsv", "w", encoding="utf-8") as f:
    f.write("세례명\t성인수\t관련성지\n")
    for r in index:
        f.write("\t".join(map(str, r)) + "\n")
print(len(index), "cards")
