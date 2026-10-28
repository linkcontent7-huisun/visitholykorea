"""영어판 세례명 카드 — gen_cards.py 와 같은 선택 규칙(세례명별 가장 먼저 순교한 성인, 성지는 감옥·빈칸 제외 최대 3곳)을
영어로 찍는다. 쓰는 값은 saints103-merged.tsv(굿뉴스 영문 이름 + 주교회의 순교일·관련성지)뿐이다.
다른 언어판(gen_cards_langs.py)이 이 파일의 틀(card_en)과 이름 만들기를 그대로 가져다 쓴다.

한국인 성인의 성·이름 로마자는 국어 로마자 표기법(음절 단위, 이름 음절 사이 하이픈)으로 기계가 바꾼 것이고,
많이 쓰는 성씨(김·이·박·최·정)만 관용 표기를 쓴다. 외국인 선교사 10분과 성지 영어 이름은 손으로 적었다.
둘 다 공식 영어 표기와 다를 수 있어 확인 전 단계다.
실행: python gen_cards_en.py  → cards-en/*.png , cards-en/index.tsv
"""

import csv
from collections import defaultdict

from make_card import (ACCENT, BG, H, HERE, MUTED, NAVY, OLIVE, ROOT, SOFT, W, centered, dove, fit, font)
from PIL import Image, ImageDraw

# ── 로마자 (국어 로마자 표기법, 음절 단위) ─────────────────────────
INITIAL = ["g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"]
VOWEL = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi",
         "yu", "eu", "ui", "i"]
FINAL = ["", "k", "k", "k", "n", "n", "n", "t", "l", "k", "m", "l", "l", "l", "p", "l", "m", "p", "p", "t", "t",
         "ng", "t", "t", "k", "t", "p", "t"]
SURNAME = {"김": "Kim", "이": "Yi", "박": "Park", "최": "Choi", "정": "Jeong"}


def syll(ch: str) -> str:
    n = ord(ch) - 0xAC00
    return INITIAL[n // 588] + VOWEL[(n % 588) // 28] + FINAL[n % 28]


def surname(ch: str) -> str:
    return SURNAME.get(ch) or syll(ch).capitalize()


# ── 손으로 적은 값 ──────────────────────────────────────────────
MISSIONARY = {  # 한국 이름(굿뉴스 괄호 앞) → 영어 이름
    "범 라우렌시오": "St. Lawrence Imbert",
    "나 베드로": "St. Peter Maubant",
    "정 야고보": "St. James Chastan",
    "장 시메온": "St. Simeon Berneux",
    "백 유스토": "St. Justus Ranfer de Bretenières",
    "김 헨리코": "St. Henry Dorie",
    "서 루도비코": "St. Louis Beaulieu",
    "안 안토니오": "St. Anthony Daveluy",
    "민 루카": "St. Luke Huin",
    "오 베드로": "St. Peter Aumaître",
}
SITE_EN = {  # 주교회의 「관련성지」 → (카드 칸 표기, 순교 문장 표기)
    "새남터": ("Saenamteo", "at Saenamteo"),
    "서소문 밖": ("Outside Seosomun Gate", "outside Seosomun Gate"),
    "당고개": ("Danggogae", "at Danggogae"),
    "갈매못": ("Galmaemot", "at Galmaemot"),
    "숲정이": ("Supjeongi", "at Supjeongi"),
    "서천교": ("Seocheongyo", "at Seocheongyo"),
    "평양": ("Pyongyang", "in Pyongyang"),
    "관덕정": ("Gwandeokjeong", "at Gwandeokjeong"),
}
NOT_SITE = {"옥사", "포청옥", "형조전옥", ""}

SERIF = lambda s: font("georgia.ttf", s)  # noqa: E731
SERIF_B = lambda s: font("georgiab.ttf", s)  # noqa: E731
SANS = lambda s: font("arial.ttf", s)  # noqa: E731
SANS_B = lambda s: font("arialbd.ttf", s)  # noqa: E731

EN_LABELS = dict(
    title="Holy places, by your baptismal name",
    mine="My baptismal name",
    box="Holy sites to visit",
    footer="Korean Catholic pilgrimage guide · 6 languages",
)


def name_tail(main: str, bapt_en: str) -> str:
    """「St. {세례명}」 뒤에 붙는 성·이름 (예: 'Kim Dae-geon', 선교사는 'Imbert')."""
    if main in MISSIONARY:
        return MISSIONARY[main].removeprefix(f"St. {bapt_en} ")
    first = main.split()[0]
    if len(first) == 1:  # 「김 바르바라」처럼 이름 없이 성만 전해진 분
        return surname(first)
    return f"{surname(first[0])} " + "-".join(syll(c) for c in first[1:]).capitalize()


def card_en(bapt: str, saint: str, detail: str, sites: list[str], out, L=EN_LABELS) -> None:
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((48, 48, W - 48, H - 48), radius=40, fill=BG)
    d.rounded_rectangle((70, 70, W - 70, H - 70), radius=30, outline="#ddd8cf", width=2)
    bird = dove(150)
    img.paste(bird, ((W - bird.width) // 2, 120), bird)

    centered(d, 300, L["title"], fit(d, L["title"], SERIF, 40, W - 200), OLIVE)
    centered(d, 370, L["mine"], fit(d, L["mine"], SANS, 34, W - 200), MUTED)
    f = fit(d, bapt, SERIF_B, 190, W - 220)
    centered(d, 425, bapt, f, NAVY)
    d.line((W // 2 - 60, 690, W // 2 + 60, 690), fill=ACCENT, width=4)

    f = fit(d, saint, SERIF, 56, W - 200)
    centered(d, 730, saint, f, NAVY)
    f = fit(d, detail, SANS, 36, W - 200)
    centered(d, 810, detail, f, MUTED)

    top = 910
    d.rounded_rectangle((120, top, W - 120, top + 200), radius=26, fill=SOFT)
    centered(d, top + 28, L["box"], fit(d, L["box"], SANS_B, 34, W - 300), OLIVE)
    line = "  ·  ".join(sites)
    f = fit(d, line, SERIF_B, 54, W - 300)
    centered(d, top + 100, line, f, NAVY)

    centered(d, 1148, "visitholykorea.com", SANS_B(46), NAVY)
    centered(d, 1212, L["footer"], fit(d, L["footer"], SANS, 30, W - 200), MUTED)
    img.save(out)


def load_groups():
    """세례명(한국어) → 성인 목록. 영어 표기가 둘로 갈리면 멈춘다."""
    rows = [r + [""] * (10 - len(r)) for r in csv.reader(open(ROOT / "data/research/saints103-merged.tsv", encoding="utf-8"), delimiter="\t")][1:]
    by_bapt = defaultdict(list)
    for no, _, kind, name, _, eng, _, _, date, site in rows:
        main = name.split("(")[0].strip()
        by_bapt[main.split()[-1]].append(dict(main=main, kind=kind, bapt_en=eng.split("(")[0].strip().split()[-1],
                                             date=date, site=site, no=int(no)))
    for items in by_bapt.values():
        items.sort(key=lambda x: (x["date"].replace("?", "9"), x["no"]))
    return by_bapt


def main():
    by_bapt = load_groups()
    out_dir = HERE / "cards-en"
    out_dir.mkdir(exist_ok=True)
    index, seen_en = [], {}
    for bapt_ko, items in sorted(by_bapt.items()):
        ens = {i["bapt_en"] for i in items}
        assert len(ens) == 1, (bapt_ko, ens)
        bapt_en = ens.pop()
        assert bapt_en not in seen_en, (bapt_en, bapt_ko, seen_en[bapt_en])
        seen_en[bapt_en] = bapt_ko
        first, n = items[0], len(items)
        year = first["date"][:4]
        name = f"St. {bapt_en} {name_tail(first['main'], bapt_en)}".strip()
        saint = name + (f" and {n - 1} more" if n > 1 else "")
        sites = []
        for i in items:
            if i["site"] not in NOT_SITE and SITE_EN[i["site"]][0] not in sites:
                sites.append(SITE_EN[i["site"]][0])
        if n == 1:
            where = SITE_EN[first["site"]][1] if first["site"] not in NOT_SITE else "in prison"
            detail = f"Martyred in {year} {where}"
        else:
            detail = f"{n} saints share this name · earliest martyred {year}"
        card_en(bapt_en, saint, detail, sites[:3] if sites else ["Being researched"], out_dir / f"{bapt_en}.png")
        index.append((bapt_ko, bapt_en, n, name, " · ".join(sites) or "Being researched"))

    with open(out_dir / "index.tsv", "w", encoding="utf-8") as f:
        f.write("세례명\tEnglish\t성인수\t대표 성인(영어)\t성지(영어)\n")
        for r in index:
            f.write("\t".join(map(str, r)) + "\n")
    print(len(index), "cards")


if __name__ == "__main__":
    main()
