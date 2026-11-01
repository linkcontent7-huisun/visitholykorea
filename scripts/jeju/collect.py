"""제주교구 홈페이지의 본당·성지 페이지 본문을 모은다 (2026-11-02, 일회성 수집).
결과: .scratch/jeju/pages/<slug>.txt (UTF-8 본문), index.tsv (slug·제목)
"""
import html, re, sys, time, urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
BASE = "https://www.diocesejeju.or.kr/"
OUT = Path(__file__).parent / "pages"
OUT.mkdir(exist_ok=True)

slugs = ["church_main"]
for area, n in (("eastcity", 8), ("westcity", 7), ("southsite", 9), ("westsite", 7)):
    slugs += [f"church_{area}{i:02d}" for i in range(1, n + 1)]
slugs += [f"holy_{i:02d}" for i in range(1, 8)]


def fetch(slug: str) -> str:
    req = urllib.request.Request(BASE + slug, headers={"User-Agent": "Mozilla/5.0"})
    raw = urllib.request.urlopen(req, timeout=30).read()
    m = re.search(rb'charset=["\']?([\w-]+)', raw[:3000])
    enc = (m.group(1).decode() if m else "utf-8").lower()
    if enc in ("euc-kr", "ks_c_5601-1987"):
        enc = "cp949"
    return raw.decode(enc, "replace")


def text_of(page: str) -> str:
    page = re.sub(r"(?is)<(script|style|noscript)[^>]*>.*?</\1>", "", page)
    page = re.sub(r"(?i)<br\s*/?>|</(p|div|li|tr|h\d)>", "\n", page)
    page = re.sub(r"(?i)</t[dh]>", " | ", page)
    t = html.unescape(re.sub(r"<[^>]+>", "", page))
    lines = [re.sub(r"[ \t ]+", " ", l).strip() for l in t.splitlines()]
    return "\n".join(l for l in lines if l)


index = []
for slug in slugs:
    try:
        page = fetch(slug)
    except Exception as e:  # noqa: BLE001
        print(slug, "실패", e)
        continue
    title = re.search(r"(?is)<title>(.*?)</title>", page)
    body = text_of(page)
    (OUT / f"{slug}.txt").write_text(body, encoding="utf-8")
    # 원본 HTML 도 남긴다 — 이미지 주소를 다시 찾을 때 쓴다
    (OUT / f"{slug}.html").write_text(page, encoding="utf-8")
    index.append(f"{slug}\t{html.unescape(title.group(1)).strip() if title else ''}\t{len(body)}")
    time.sleep(0.5)

(Path(__file__).parent / "index.tsv").write_text("\n".join(index), encoding="utf-8")
print("\n".join(index))
