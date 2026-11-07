"""세례명 공유 카드 틀 — 1080x1350(인스타 4:5). 값만 바꿔 같은 모양을 찍어 낸다.

왜 코드로 그렸나: AI 그림은 성인·성지를 틀리게 그릴 수 있고(신뢰가 핵심인 앱), 값(세례명·성지)이
달라질 때마다 같은 틀이 필요하다. 색은 src/shared/styles/globals.css 의 브랜드 색을 그대로 썼다.
앱에서 실제로 만들 때는 이 배치(여백·글자 크기 비율)를 브라우저 canvas 로 옮기면 된다.

실행: python make_card.py   → card-sample.png, card-blank.png
주의: 예시 값은 docs/40-knowledge/02-주요순교자/김대건_안드레아.md 의 내용만 썼다.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent

NAVY = "#1f2f55"
SOFT = "#e6eaf3"
OLIVE = "#5a6949"
ACCENT = "#c2703a"
BG = "#f5f3ee"
MUTED = "#5b6475"
W, H = 1080, 1350

FONTS = Path(r"C:\Windows\Fonts")


def font(name: str, size: int, index: int = 0) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / name), size, index=index)


SERIF = lambda s: font("batang.ttc", s)  # noqa: E731
SERIF_B = lambda s: font("HANBatangB.ttf", s)  # noqa: E731
SANS = lambda s: font("malgun.ttf", s)  # noqa: E731
SANS_B = lambda s: font("malgunbd.ttf", s)  # noqa: E731


def centered(d: ImageDraw.ImageDraw, y: int, text: str, f, fill) -> int:
    w = d.textlength(text, font=f)
    d.text(((W - w) / 2, y), text, font=f, fill=fill)
    return y + f.size


def fit(d: ImageDraw.ImageDraw, text: str, maker, start: int, max_w: int):
    """글자가 너무 길면 줄여서 한 줄에 맞춘다 (긴 세례명·성인 이름 대비)."""
    size = start
    while size > 28 and d.textlength(text, font=maker(size)) > max_w:
        size -= 4
    return maker(size)


# CPBC 「모두의 세례명」이 세례명으로 따로 올린 한국 성인 14분 — 같은 세례명 카드에서 이분들을 맨 앞에 둔다.
# 나머지는 순교일 순. (2026-11-08 사장님 지시: 김대건 신부가 「외 1분」에 가려져 있었다)
REPRESENTATIVE = {
    "김대건 안드레아", "정하상 바오로", "유대철 베드로", "임치백 요셉", "전장운 요한", "황석두 루카", "김효주 아녜스",
    "김효임 골룸바", "정정혜 엘리사벳", "이연희 마리아", "박희순 루치아", "권진이 아가타", "김임이 데레사", "홍금주 페르페투아",
}


def order_key(main: str, date: str, no: int):
    return (main not in REPRESENTATIVE, date.replace("?", "9"), no)


def personal(main: str, raw_name: str) -> bool:
    """개인 카드를 만들 분 — 한국인(선교사는 괄호 표기)이고 이름이 전해진 분(「김 바르바라」처럼 성만 있으면 서로 구별이 안 된다)."""
    return "(" not in raw_name and len(main.split()[0]) > 1


def short_name(main: str) -> str:
    """성인이 많은 카드에 쓰는 짧은 이름 — 세례명을 뺀 한국 이름. 성만 전해진 분은 세례명을 붙여 둔다(「조」만으로는 누군지 모른다)."""
    head = main.rsplit(" ", 1)[0]
    return main if len(head) == 1 else head


def wrap(d, words: list[str], f, max_w: int, sep: str = "  ·  ") -> list[str]:
    lines, cur = [], ""
    for w in words:
        t = w if not cur else cur + sep + w
        if not cur or d.textlength(t, font=f) <= max_w:
            cur = t
        else:
            lines.append(cur)
            cur = w
    return lines + [cur]


def draw_big(d, text: str, serif_b) -> None:
    """가운데 큰 글씨(세례명·성인 이름). 길어서 줄어들면 같은 자리 가운데에 오게 내린다."""
    f = fit(d, text, serif_b, 190, W - 220)
    centered(d, 425 + (190 - f.size) // 2, text, f, NAVY)


def draw_saints(d, full: list[str], short: list[str], one: str, note: str, header: str, serif, sans) -> None:
    """구분선 아래 성인 칸 — 1분이면 이름과 순교 한 줄, 2~3분이면 모두 이름으로, 4분 이상이면 「같은 세례명 한국 성인 N분」 아래 이름만."""
    if len(full) == 1:
        centered(d, 730, full[0], fit(d, full[0], serif, 56, W - 200), NAVY)
        centered(d, 810, one, fit(d, one, sans, 36, W - 200), MUTED)
        return
    if len(full) <= 3:
        for size in (52, 46, 40, 36, 32):
            f = serif(size)
            lines = wrap(d, full, f, W - 200)
            if len(lines) * (size + 12) <= 130:
                break
        y = 712 + (130 - len(lines) * (size + 12)) // 2
        for line in lines:
            centered(d, y, line, f, NAVY)
            y += size + 12
        centered(d, 850, note, fit(d, note, sans, 30, W - 200), MUTED)
        return
    centered(d, 712, header, fit(d, header, sans, 32, W - 200), MUTED)
    for size in (40, 36, 32, 30, 28):
        f = serif(size)
        lines = wrap(d, short, f, W - 220)
        if len(lines) * (size + 10) <= 140:
            break
    y = 758
    for line in lines:
        centered(d, y, line, f, NAVY)
        y += size + 10


def dove(size: int) -> Image.Image:
    im = Image.open(ROOT / "public" / "brand" / "dove.png").convert("RGBA")
    # 흰 바탕을 투명으로 — 크림색 카드 위에서 네모가 보이지 않게
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if r > 240 and g > 240 and b > 240:
                px[x, y] = (r, g, b, 0)
    ratio = size / im.width
    return im.resize((size, int(im.height * ratio)), Image.LANCZOS)


def card(baptism: str, full: list[str], short: list[str], one: str, note: str, header: str, sites: list[str], out: Path) -> None:
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)
    # 크림색 안쪽 카드
    d.rounded_rectangle((48, 48, W - 48, H - 48), radius=40, fill=BG)
    d.rounded_rectangle((70, 70, W - 70, H - 70), radius=30, outline="#ddd8cf", width=2)

    bird = dove(150)
    img.paste(bird, ((W - bird.width) // 2, 120), bird)

    centered(d, 300, "세례명으로 만나는 성지", SERIF(40), OLIVE)
    centered(d, 370, "나의 세례명", SANS(34), MUTED)
    draw_big(d, baptism, SERIF_B)

    # 가는 구분선
    d.line((W // 2 - 60, 690, W // 2 + 60, 690), fill=ACCENT, width=4)
    draw_saints(d, full, short, one, note, header, SERIF, SANS)

    # 성지 상자
    top = 910
    d.rounded_rectangle((120, top, W - 120, top + 200), radius=26, fill=SOFT)
    centered(d, top + 28, "함께 걸어 볼 성지", SANS_B(34), OLIVE)
    line = "  ·  ".join(sites)
    f = fit(d, line, SERIF_B, 54, W - 300)
    centered(d, top + 100, line, f, NAVY)

    centered(d, 1148, "visitholykorea.com", SANS_B(46), NAVY)
    centered(d, 1212, "성지 순례 안내 · 6개 국어", SANS(30), MUTED)

    img.save(out)
    print("saved", out.name, img.size)


if __name__ == "__main__":
    card("안드레아", ["성 김대건 안드레아 신부"], [], "한국인 최초의 사제 · 1846년 새남터에서 순교", "", "",
         ["솔뫼", "새남터", "미리내"], HERE / "card-sample.png")
    card("세례명", ["성인 이름"], [], "한 줄 소개 · 순교 연도와 장소", "", "", ["성지 1", "성지 2", "성지 3"], HERE / "card-blank.png")
