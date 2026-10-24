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


def card(baptism: str, saint: str, detail: str, sites: list[str], out: Path) -> None:
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)
    # 크림색 안쪽 카드
    d.rounded_rectangle((48, 48, W - 48, H - 48), radius=40, fill=BG)
    d.rounded_rectangle((70, 70, W - 70, H - 70), radius=30, outline="#ddd8cf", width=2)

    bird = dove(150)
    img.paste(bird, ((W - bird.width) // 2, 120), bird)

    centered(d, 300, "세례명으로 만나는 성지", SERIF(40), OLIVE)
    centered(d, 370, "나의 세례명", SANS(34), MUTED)
    f = fit(d, baptism, SERIF_B, 190, W - 220)
    centered(d, 425, baptism, f, NAVY)

    # 가는 구분선
    d.line((W // 2 - 60, 690, W // 2 + 60, 690), fill=ACCENT, width=4)

    f = fit(d, saint, SERIF, 56, W - 200)
    centered(d, 730, saint, f, NAVY)
    f = fit(d, detail, SANS, 36, W - 200)
    centered(d, 810, detail, f, MUTED)

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
    card(
        "안드레아",
        "성 김대건 안드레아 신부",
        "한국인 최초의 사제 · 1846년 새남터에서 순교",
        ["솔뫼", "새남터", "미리내"],
        HERE / "card-sample.png",
    )
    card(
        "세례명",
        "성인 이름",
        "한 줄 소개 · 순교 연도와 장소",
        ["성지 1", "성지 2", "성지 3"],
        HERE / "card-blank.png",
    )
