"""굿뉴스 103위 표 + 주교회의 103위 표 → saints103-merged.tsv

맞추는 기준(번호는 두 표가 달라서 못 쓴다): 성씨 + 세례명 + 순교 연도(굿뉴스 생몰년의 끝 해)
→ 그래도 여럿이면 신분 말(동정·과부·부인), 그래도 여럿이면 「애매」로 표시하고 합치지 않는다.
주교회의 이름이 줄여 적혀 있어도(「김 아가타」=김아기 아가타) 같은 기준으로 맞춘다.
"""

import csv
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent


def read(name):
    with open(HERE / name, encoding="utf-8") as f:
        return list(csv.reader(f, delimiter="\t"))[1:]


good = []
for no, kind, name, hanja, eng, status, years in read("saints103-goodnews.tsv"):
    end = re.findall(r"\d{4}", years)[-1]
    main = name.split("(")[0].strip()
    good.append(dict(no=no, kind=kind, name=name, main=main, hanja=hanja, eng=eng,
                     status=status, years=years, end=end,
                     fam=main[0], bapt=main.split()[-1]))

used = set()
out, problems = [], []
for no, name, status, date, *rest in read("saints103-cbck.tsv"):
    site = rest[0] if rest else ""
    main = name.split("(")[0].strip()
    fam, bapt = main[0], main.split()[-1]
    year = date[:4]
    cands = [g for g in good if g["no"] not in used and g["fam"] == fam and g["bapt"] == bapt and g["end"] == year]
    if len(cands) > 1:
        exact = [g for g in cands if g["main"] == main]
        if exact:
            cands = exact
    if len(cands) > 1:
        for kw in ("동정", "과부", "부인"):
            if kw in status:
                narrowed = [g for g in cands if kw in g["status"]]
                if narrowed:
                    cands = narrowed
                break
    if len(cands) == 1:
        g = cands[0]
        used.add(g["no"])
        out.append([no, g["no"], g["kind"], g["name"], g["hanja"], g["eng"], g["status"], g["years"], date, site])
    else:
        problems.append((no, name, date, [c["name"] for c in cands]))

with open(HERE / "saints103-merged.tsv", "w", encoding="utf-8") as f:
    f.write("주교회의번호\t굿뉴스번호\t구분\t이름_세례명\t한자\t영문\t신분(굿뉴스)\t생몰년\t순교일\t관련성지\n")
    for r in out:
        f.write("\t".join(r) + "\n")

print("합친 것", len(out), "/ 못 합친 것", len(problems))
for p in problems:
    print(p)
print("굿뉴스에서 안 쓰인 것", [g["name"] for g in good if g["no"] not in used])
