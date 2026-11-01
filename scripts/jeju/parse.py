"""제주교구 본당 페이지 → 본당별 사실(JSON). 2026-11-02 일회성.
출력: .scratch/jeju/parishes.json
"""
import html, json, re, sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
HERE = Path(__file__).parent
PAGES = HERE / "pages"
LABELS = ["소 재 지", "주보성인", "관할구역", "관할공소", "주임신부", "사 제 관", "수 녀 원", "사 무 실", "Fax", "홈페이지"]
DAYS = ["주일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"]
DAY_SHORT = {"주일": "주일", "월요일": "월", "화요일": "화", "수요일": "수", "목요일": "목", "금요일": "금", "토요일": "토"}


def cell_text(c: str) -> str:
    c = re.sub(r"(?i)<br\s*/?>", " ", c)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", c))).strip()


def parse(slug: str) -> dict | None:
    page = (PAGES / f"{slug}.html").read_text(encoding="utf-8")
    title = re.search(r"(?is)<title>(.*?)</title>", page)
    name = html.unescape(title.group(1)).strip() if title else slug
    lines = (PAGES / f"{slug}.txt").read_text(encoding="utf-8").splitlines()
    start = max(i for i, l in enumerate(lines) if l == "소 재 지")
    tokens = [l for l in lines[start:] if l != "|"]
    info: dict[str, str] = {}
    cur = None
    history = ""
    for tok in tokens:
        if tok in LABELS:
            cur = tok
            info[cur] = ""
            continue
        if tok == "시간":
            break
        if cur == "홈페이지" and info.get(cur) and len(tok) > 60:
            history = tok
            cur = None
            continue
        if cur:
            info[cur] = (info[cur] + " " + tok).strip()
        elif len(tok) > 60:
            history = (history + " " + tok).strip()

    # 미사 시간 — 표의 줄마다 요일 + 시간들
    mass: list[str] = []
    seen: set[str] = set()
    for row in re.findall(r"(?is)<tr[^>]*>(.*?)</tr>", page):
        cells = [cell_text(c) for c in re.findall(r"(?is)<t[dh][^>]*>(.*?)</t[dh]>", row)]
        # 같은 요일이 다시 나오면 두 번째 표(교리 시간)다 — 첫 표만 미사 시간
        if not cells or cells[0] not in DAYS or cells[0] in seen:
            continue
        seen.add(cells[0])
        times = [c for c in cells[1:] if re.search(r"\d{1,2}:\d{2}", c)]
        if times:
            mass.append(f"{DAY_SHORT[cells[0]]} " + " · ".join(times))
    mass.sort(key=lambda m: 0 if m.startswith("주일") else 1)

    founded = None
    m = re.search(r"(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일", history)
    if m:
        founded = f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    order = re.search(r"제주교구의\s*(첫|두|세|네|다섯|여섯|일곱|여덟|아홉|열)\s*번째\s*본당", history)

    homepage = info.get("홈페이지", "").strip()
    if homepage and not homepage.startswith("http"):
        homepage = ""
    return {
        "slug": slug,
        "title": name,
        "address": info.get("소 재 지"),
        "patron": info.get("주보성인") or None,
        "area": info.get("관할구역") or None,
        "missions": info.get("관할공소") or None,
        "office": info.get("사 무 실") or None,
        "homepage": homepage or None,
        "history": history or None,
        "founded": founded,
        "order": order.group(0) if order else None,
        "mass": mass,
    }


out = []
for f in sorted(PAGES.glob("church_*0*.html")):
    try:
        r = parse(f.stem)
    except ValueError:
        print("건너뜀", f.stem)
        continue
    if r:
        out.append(r)
(HERE / "parishes.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
for r in out:
    print(r["title"], "|", r["patron"], "|", r["founded"], "|", r["homepage"], "|", len(r["mass"]), "줄 |", (r["missions"] or "-")[:30])
