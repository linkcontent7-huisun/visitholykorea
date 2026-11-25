"""세례명 카드 2판 — 카드 그림 안에 «이름의 뜻 · 이 성인은 누구인가» 칸을 더한 틀 (지시서 9호, 2026-11-25).

1판(make_card.py·gen_cards*.py)과 같은 색·비둘기·순서를 쓰되, 성지 상자 위에 뜻 칸(한두 문장)을 넣으려고
큰 이름·성인 칸을 조금 줄였다. 한글은 맥에서 Noto Serif/Sans KR(1판 흔한 세례명 카드와 같은 글꼴),
라틴 글자는 1판과 같은 Georgia·Arial 이다. 카드 맨 아래에 실제로 참고한 자료를 작게 적는다.

뜻 문장과 근거: docs/40-knowledge/08-세례명뜻/ (공개 사실을 확인해 새로 쓴 문장. cpbc 글은 쓰지 않는다)

지금은 시안 단계다 — 사장님 승낙 전에는 public/ 에 쓰지 않고 OUT_DIR 에만 찍는다.
실행: KR_FONT_DIR=~/visitholykorea-integration/기타/글꼴 OUT_DIR=/임시/폴더 python3 gen_cards_v2.py
"""

import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from make_card import ACCENT, BG, H, MUTED, NAVY, OLIVE, SOFT, W, centered, dove, fit, wrap

LATIN = Path("/System/Library/Fonts/Supplemental")
KR = Path(os.path.expanduser(os.environ.get("KR_FONT_DIR", "")))


def _f(path: Path):
    return lambda s: ImageFont.truetype(str(path), s)


LATIN_FONTS = dict(serif=_f(LATIN / "Georgia.ttf"), serif_b=_f(LATIN / "Georgia Bold.ttf"),
                   sans=_f(LATIN / "Arial.ttf"), sans_b=_f(LATIN / "Arial Bold.ttf"))
KR_FONTS = dict(serif=_f(KR / "NotoSerifKR-Regular.otf"), serif_b=_f(KR / "NotoSerifKR-Bold.otf"),
                sans=_f(KR / "NotoSansKR-Regular.otf"), sans_b=_f(KR / "NotoSansKR-Bold.otf"))

LABELS = {
    "ko": dict(title="세례명으로 만나는 성지", mine="나의 세례명", box="함께 걸어 볼 성지", meaning="이름과 성인",
               footer="성지 순례 안내 · 6개 국어", source="참고: "),
    "en": dict(title="Holy places, by your baptismal name", mine="My baptismal name", box="Holy sites to visit",
               meaning="The name and the saint", footer="Korean Catholic pilgrimage guide · 6 languages",
               source="Sources: "),
}


def wrap_text(d, text: str, f, max_w: int) -> list[str]:
    """띄어쓰기 단위로 줄을 나눈다 (한국어·영어 모두)."""
    lines, cur = [], ""
    for w in text.split():
        t = w if not cur else f"{cur} {w}"
        if not cur or d.textlength(t, font=f) <= max_w:
            cur = t
        else:
            lines.append(cur)
            cur = w
    return lines + [cur]


def card(lang: str, name: str, middle: dict, sites: list[str], meaning: str, source: str) -> Image.Image:
    """middle: {'lines': [성인 이름 또는 다른 언어 표기], 'note': 작은 글씨 한 줄}"""
    L, F = LABELS[lang], (KR_FONTS if lang == "ko" else LATIN_FONTS)
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((48, 48, W - 48, H - 48), radius=40, fill=BG)
    d.rounded_rectangle((70, 70, W - 70, H - 70), radius=30, outline="#ddd8cf", width=2)
    bird = dove(110)
    img.paste(bird, ((W - bird.width) // 2, 96), bird)

    centered(d, 214, L["title"], fit(d, L["title"], F["serif"], 38, W - 200), OLIVE)
    centered(d, 268, L["mine"], fit(d, L["mine"], F["sans"], 30, W - 200), MUTED)
    big = fit(d, name, F["serif_b"], 160, W - 220)
    centered(d, 312 + (160 - big.size) // 2, name, big, NAVY)
    d.line((W // 2 - 60, 530, W // 2 + 60, 530), fill=ACCENT, width=4)

    # 성인(또는 같은 이름의 다른 언어 표기) — 최대 두 줄
    lines_in = middle["lines"]
    latin_only = middle.get("latin", False)
    for size in (46, 42, 38, 34, 30):
        f = (LATIN_FONTS if latin_only else F)["serif"](size)
        lines = wrap(d, lines_in, f, W - 200)
        if len(lines) <= 2:
            break
    y = 550 if len(lines) == 2 else 574
    for line in lines:
        centered(d, y, line, f, NAVY)
        y += size + 10
    centered(d, 664, middle["note"], fit(d, middle["note"], F["sans"], 28, W - 200), MUTED)

    # 뜻 칸 — 휴대폰에서 카드 한 장을 열어도 읽히게 글자를 40px 아래로 줄이지 않는다
    top, bottom = 712, 962
    d.rounded_rectangle((110, top, W - 110, bottom), radius=26, fill="#ffffff", outline="#ddd8cf", width=2)
    centered(d, top + 20, L["meaning"], F["sans_b"](28), OLIVE)
    for size, gap in ((44, 16), (42, 14), (40, 12)):
        f = F["serif"](size)
        lines = wrap_text(d, meaning, f, W - 270)
        if len(lines) * (size + gap) <= bottom - top - 80:
            break
    y = top + 66 + (bottom - top - 80 - len(lines) * (size + gap)) // 2
    for line in lines:
        centered(d, y, line, f, NAVY)
        y += size + gap

    top = 980
    d.rounded_rectangle((120, top, W - 120, top + 132), radius=26, fill=SOFT)
    centered(d, top + 14, L["box"], fit(d, L["box"], F["sans_b"], 28, W - 300), OLIVE)
    line = "  ·  ".join(sites)
    centered(d, top + 58, line, fit(d, line, F["serif_b"], 46, W - 300), NAVY)

    centered(d, 1138, "visitholykorea.com", LATIN_FONTS["sans_b"](42), NAVY)
    centered(d, 1192, L["footer"], fit(d, L["footer"], F["sans"], 28, W - 200), MUTED)
    src = L["source"] + source
    centered(d, 1232, src, fit(d, src, F["sans"], 24, W - 200), MUTED)
    return img


KO_WAIT, EN_WAIT = ["한국의 성지가 기다립니다"], ["Korea’s holy sites await you"]

# 시안 5개 × 한·영. 문장·근거: docs/40-knowledge/08-세례명뜻/2026-11-25-시안-5개.md
DRAFT = [
    ("Matilda", "new",
     dict(name="마틸다", middle=dict(lines=["Matilda", "Matilde", "Mathilde"], note="세계 곳곳에서 불리는 같은 이름", latin=True),
          sites=KO_WAIT, meaning="독일 왕비로 수도원을 세우고 가난한 이를 돌본 성녀. 이름 뜻은 «싸움에 강한 힘».",
          source="굿뉴스 성인 정보 · 위키백과"),
     dict(name="Matilda", middle=dict(lines=["Matilde", "Mathilde"], note="The same name around the world"),
          sites=EN_WAIT, meaning="A German queen who founded convents and cared for the poor. The name means “mighty in battle”.",
          source="Goodnews Catholic saints · Wikipedia")),
    ("Sabina", "new",
     dict(name="사비나", middle=dict(lines=["Sabina", "Sabine"], note="세계 곳곳에서 불리는 같은 이름", latin=True),
          sites=KO_WAIT, meaning="전승에 따르면 로마의 귀부인으로, 하녀 세라피아의 신앙에 감화되어 순교한 성녀.",
          source="바티칸 뉴스 · 위키백과"),
     dict(name="Sabina", middle=dict(lines=["Sabine"], note="The same name around the world"),
          sites=EN_WAIT, meaning="A Roman noblewoman who, tradition says, came to faith through her servant and died a martyr.",
          source="Vatican News · Wikipedia")),
    ("Anne", "old",
     dict(name="안나", middle=dict(lines=["성녀 박 안나", "성녀 김장금 안나"], note="같은 세례명 성인 2분"),
          sites=["서소문 밖"], meaning="전승에 따르면 성모 마리아의 어머니. 요아킴과 함께 기억한다. 이름은 히브리어로 «은총».",
          source="주교회의 103위 성인 · 바티칸 뉴스"),
     dict(name="Anne", middle=dict(lines=["St. Anne Park A-gi", "St. Anne Kim Jang-geum"], note="2 saints share this name"),
          sites=["Outside Seosomun Gate"], meaning="By tradition, mother of the Virgin Mary, honoured with Joachim. The name means “grace” in Hebrew.",
          source="CBCK 103 Martyr Saints · Vatican News")),
    ("Andrew-Kim-Dae-geon", "old",
     dict(name="김대건 안드레아", middle=dict(lines=["성 김대건 안드레아"], note="신부 · 1846년 새남터에서 순교"),
          sites=["새남터"], meaning="한국인 첫 사제. 1846년 새남터에서 순교했다. 한국 교회는 7월 5일에 기념한다.",
          source="주교회의 103위 성인"),
     dict(name="Andrew Kim Dae-geon", middle=dict(lines=["St. Andrew Kim Dae-geon"], note="Martyred in 1846 at Saenamteo"),
          sites=["Saenamteo"], meaning="Korea’s first native priest, martyred at Saenamteo in 1846. Honoured in Korea on 5 July.",
          source="CBCK 103 Martyr Saints")),
    ("Clare", "old",
     dict(name="클라라", middle=dict(lines=["Clare", "Clara", "Claire", "Chiara"], note="세계 곳곳에서 불리는 같은 이름", latin=True),
          sites=KO_WAIT, meaning="아시시에서 프란치스코를 따라 «가난한 자매들의 수도회»를 세운 성녀. 이름은 라틴어로 «맑고 밝은».",
          source="바티칸 뉴스 · 위키백과"),
     dict(name="Clare", middle=dict(lines=["Clara", "Claire", "Chiara"], note="The same name around the world"),
          sites=EN_WAIT, meaning="Founded the Poor Clares in Assisi, following St Francis. The name means “clear, bright” in Latin.",
          source="Vatican News · Wikipedia")),
]


def main() -> None:
    out = Path(os.path.expanduser(os.environ["OUT_DIR"]))
    for slug, _, ko, en in DRAFT:
        for lang, v in (("ko", ko), ("en", en)):
            (out / lang).mkdir(parents=True, exist_ok=True)
            (out / "og" / lang).mkdir(parents=True, exist_ok=True)
            im = card(lang, v["name"], v["middle"], v["sites"], v["meaning"], v["source"])
            im.save(out / lang / f"{slug}.webp", "WEBP", quality=82, method=6)
            im.resize((480, 600), Image.LANCZOS).save(out / "og" / lang / f"{slug}.jpg", "JPEG", quality=72, optimize=True)
    print(len(DRAFT) * 2, "cards →", out)


if __name__ == "__main__":
    main()
