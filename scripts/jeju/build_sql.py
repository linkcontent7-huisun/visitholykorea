"""parishes.json + 기관 표 → catholic_directory 갱신 SQL. 2026-11-02 일회성.
- 본당: 설명(사실 문장 + 교구 연혁, 출처 표기) · 주보성인 · 설립일 · 홈페이지 · 미사 시간
- 공소: 어느 본당 관할인지
- 피정의집 · 사회복지 · 교육기관: 교구 홈페이지 표의 구분·홈페이지
출력: .scratch/jeju/update.sql, match-report.txt
"""
import html, json, re, sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
HERE = Path(__file__).parent
SRC = "천주교 제주교구 홈페이지(diocesejeju.or.kr), 2026-11-02 확인"
DISTRICT = {"eastcity": "시동부지구", "westcity": "시서부지구", "southsite": "남부지구", "westsite": "서부지구"}
ORDER = {"첫": "첫 번째", "두": "두 번째", "세": "세 번째", "네": "네 번째"}

directory = json.loads((HERE / "directory.json").read_text(encoding="utf-8"))
parishes = json.loads((HERE / "parishes.json").read_text(encoding="utf-8"))


def norm(s: str) -> str:
    s = re.sub(r"\(.*?\)", "", s)
    for w in ("주교좌", "준본당", "본당", "성당", " "):
        s = s.replace(w, "")
    return s


def q(v):
    if v is None:
        return "null"
    return "$q$" + str(v).replace("$q$", "") + "$q$"


by_norm = {}
for d in directory:
    by_norm.setdefault(norm(d["name"]), []).append(d)

sql, report = [], []
mission_owner = {}

for p in parishes:
    key = norm(p["title"])
    hits = [d for d in by_norm.get(key, []) if d["category"] == "본당"]
    if len(hits) != 1:
        report.append(f"본당 연결 실패: {p['title']} → {len(hits)}건")
        continue
    d = hits[0]
    area = DISTRICT[re.match(r"church_([a-z]+)", p["slug"]).group(1)]
    sent = [f"{p['title']}은 천주교 제주교구 {area}에 속한 본당입니다."]
    if p["founded"] and not p["history"]:
        y, m, dd = p["founded"].split("-")
        sent.append(f"{y}년 {int(m)}월 {int(dd)}일에 설립되었습니다.")
    if p["order"] and not p["history"]:
        k = re.search(r"(첫|두|세|네)", p["order"])
        if k:
            sent.append(f"제주교구에서 {ORDER[k.group(1)]}로 세워진 본당입니다.")
    if p["patron"]:
        sent.append(f"주보성인은 {p['patron']}입니다.")
    missions = None
    if p["missions"]:
        missions = [re.split(r"[:(]", m)[0].strip() for m in re.split(r"[,/·]", p["missions"])]
        missions = [m for m in missions if "공소" in m]
        if missions:
            sent.append(f"관할 공소로 {', '.join(missions)}가 있습니다.")
            for m in missions:
                mission_owner[norm(m)] = p["title"]
    desc = " ".join(sent)
    if p["history"]:
        desc += "\n\n" + p["history"].rstrip(".").rstrip() + "."
    desc += f"\n\n출처: {SRC}"
    homepage = None
    if p["homepage"]:
        homepage = re.match(r"https?://\S+", p["homepage"]).group(0)
    mass = " / ".join(p["mass"]) + f" (출처: {SRC})" if p["mass"] else None
    sql.append(
        f"update public.catholic_directory set description = {q(desc)}, patron = {q(p['patron'])}, "
        f"founded_on = {q(p['founded'])}, homepage = coalesce(homepage, {q(homepage)}), "
        f"mass_times = {q(mass)}, source_url = coalesce(source_url, {q('https://www.diocesejeju.or.kr/' + p['slug'])}) "
        f"where id = '{d['id']}';"
    )
    report.append(f"본당 ✓ {p['title']} ↔ {d['name']}")

# 공소 — 어느 본당 관할인지
for d in directory:
    if d["category"] != "공소":
        continue
    owner = mission_owner.get(norm(d["name"]))
    if not owner:
        report.append(f"공소 관할 못 찾음: {d['name']}")
        continue
    desc = f"{d['name']}는 천주교 제주교구 {owner} 관할 공소입니다. 미사·전례 일정은 {owner}에 문의하세요.\n\n출처: {SRC}"
    sql.append(f"update public.catholic_directory set description = {q(desc)} where id = '{d['id']}' and description is null;")
    report.append(f"공소 ✓ {d['name']} ← {owner}")


# 기관 표 (교육기관 · 사회사업 · 피정센터)
def rows(n):
    page = (HERE / "pages" / f"organization0{n}.html").read_text(encoding="utf-8")
    out = []
    for row in re.findall(r"(?is)<tr[^>]*>(.*?)</tr>", page):
        cells = [re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", c))).strip()
                 for c in re.findall(r"(?is)<t[dh][^>]*>(.*?)</t[dh]>", row)]
        out.append([c for c in cells if c])
    return out


org = []  # (이름, 구분, 홈페이지, 표 이름)
kind = None
for r in [r for r in rows(2)[1:] if r]:
    if len(r) >= 3 and not re.match(r"^[\d국]", r[1]):
        kind = r[0]
        r = r[1:]
    name = r[0]
    hp = next((c for c in r if c.startswith("http")), None)
    org.append((name, kind, hp, "사회사업"))
for r in rows(1)[1:]:
    if r and not r[0].startswith(("교장", "행정", "Fax")):
        org.append((r[0], "학교" if "학교" in r[0] else "유치원·어린이집", None, "교육기관"))
for r in rows(3)[1:]:
    if r and r[0] != "팩시밀리":
        org.append((r[0], "피정의 집", None, "피정센터"))

MANUAL = {"성 이시돌 회관 (피정의 집)": "성이시돌 피정의 집", "성 이시돌 어린이집 (신창)": "신창 성 이시돌 어린이집", "여성긴급전화 1366센터": "여성긴급전화 『1366』 제주센터 (여성)"}
for name, k, hp, table in org:
    if name in MANUAL:
        hits = [d for d in directory if d["name"] == MANUAL[name]]
        if len(hits) == 1:
            d = hits[0]
            desc = f"{d['name']}은 천주교 제주교구 홈페이지 「{table}」 목록에 실린 {k} 기관입니다.\n\n출처: {SRC}"
            sql.append(f"update public.catholic_directory set description = coalesce(description, {q(desc)}), homepage = coalesce(homepage, {q(hp)}) where id = '{d['id']}';")
            report.append(f"기관 ✓(수동) {name} ↔ {d['name']}")
            continue
    key = norm(name)
    hits = [d for d in directory if d["category"] != "본당" and (norm(d["name"]) in key or key in norm(d["name"]))]
    if len(hits) != 1:
        report.append(f"기관 연결 실패: {name} → {[h['name'] for h in hits]}")
        continue
    d = hits[0]
    desc = f"{d['name']}은 천주교 제주교구 홈페이지 「{table}」 목록에 실린 {k} 기관입니다.\n\n출처: {SRC}"
    sql.append(
        f"update public.catholic_directory set description = coalesce(description, {q(desc)}), "
        f"homepage = coalesce(homepage, {q(hp)}) where id = '{d['id']}';"
    )
    report.append(f"기관 ✓ {name} ↔ {d['name']} ({k})")

(HERE / "update.sql").write_text("begin;\n" + "\n".join(sql) + "\ncommit;\n", encoding="utf-8")
(HERE / "match-report.txt").write_text("\n".join(report), encoding="utf-8")
print("\n".join(report))
print("SQL", len(sql), "줄")
