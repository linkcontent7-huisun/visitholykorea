"""흔한 세례명 카드 — 103위 한국 성인 가운데 같은 이름이 없는 세례명 (2026-11-11 사장님 지시).

기존 카드(gen_cards*.py)는 주교회의 103위 성인 표에서만 값을 가져온다. 클라라·안젤라·노엘처럼 그 표에 없는
세례명은 이을 한국 성인이 없으므로, 성인·순교 칸 대신 **같은 이름의 다른 언어 표기**를 적고
성지 칸에는 「한국의 성지가 기다립니다」를 넣는다. 성인·축일·성지를 지어내지 않는다.

이 스크립트는 그림을 앱 폴더에 바로 쓴다(png 중간 파일 없음):
  public/baptism-cards/{언어}/{영어 세례명}.webp      카드 1080×1350
  public/baptism-cards/og/{언어}/{영어 세례명}.jpg    메신저 미리보기 480×600
  src/features/baptism-card/data/baptism-names.ts     kind: 'plain' 줄을 다시 써넣는다

글꼴: 라틴 글자는 기존 카드와 같은 Georgia·Arial. 한글은 원래 바탕·맑은 고딕(윈도우)인데 맥에는 없어
Noto Serif KR·Noto Sans KR 을 쓴다 — 받아 둔 폴더를 KR_FONT_DIR 로 알려 준다.
  https://github.com/notofonts/noto-cjk (Serif/SubsetOTF/KR, Sans/SubsetOTF/KR — Regular·Bold)
실행: KR_FONT_DIR=/글꼴/폴더 python gen_cards_plain.py
"""

import os
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from make_card import ACCENT, BG, H, MUTED, NAVY, OLIVE, ROOT, SOFT, W, centered, dove, fit, wrap

LANGS = ["ko", "en", "es", "fr", "pt", "it"]

# 한국어 세례명, 영어(= 파일 이름), 스페인어, 프랑스어, 포르투갈어, 이탈리아어
# 표기는 검수 전이다 — 가톨릭 용어는 신자·번역자 확인이 필요하다.
PLAIN = [
    ("클라라", "Clare", "Clara", "Claire", "Clara", "Chiara"),
    ("안젤라", "Angela", "Ángela", "Angèle", "Ângela", "Angela"),
    ("노엘", "Noel", "Noel", "Noël", "Noel", "Natale"),
    ("미카엘", "Michael", "Miguel", "Michel", "Miguel", "Michele"),
    ("가브리엘", "Gabriel", "Gabriel", "Gabriel", "Gabriel", "Gabriele"),
    ("라파엘", "Raphael", "Rafael", "Raphaël", "Rafael", "Raffaele"),
    ("소피아", "Sophia", "Sofía", "Sophie", "Sofia", "Sofia"),
    ("헬레나", "Helena", "Elena", "Hélène", "Helena", "Elena"),
    ("모니카", "Monica", "Mónica", "Monique", "Mônica", "Monica"),
    ("베로니카", "Veronica", "Verónica", "Véronique", "Verônica", "Veronica"),
    ("크리스티나", "Christina", "Cristina", "Christine", "Cristina", "Cristina"),
    ("율리아", "Julia", "Julia", "Julie", "Júlia", "Giulia"),
    ("스텔라", "Stella", "Estela", "Stella", "Estela", "Stella"),
    ("에스텔", "Esther", "Ester", "Esther", "Ester", "Ester"),
    ("그라시아", "Grace", "Gracia", "Grâce", "Graça", "Grazia"),
    ("젬마", "Gemma", "Gema", "Gemma", "Gema", "Gemma"),
    ("요안나", "Joanna", "Juana", "Jeanne", "Joana", "Giovanna"),
    ("마르가리타", "Margaret", "Margarita", "Marguerite", "Margarida", "Margherita"),
    ("비비안나", "Bibiana", "Bibiana", "Bibiane", "Bibiana", "Bibiana"),
    ("다니엘", "Daniel", "Daniel", "Daniel", "Daniel", "Daniele"),
    ("다윗", "David", "David", "David", "Davi", "Davide"),
    ("사무엘", "Samuel", "Samuel", "Samuel", "Samuel", "Samuele"),
    ("마태오", "Matthew", "Mateo", "Matthieu", "Mateus", "Matteo"),
    ("마티아", "Matthias", "Matías", "Matthias", "Matias", "Mattia"),
    ("필립보", "Philip", "Felipe", "Philippe", "Filipe", "Filippo"),
    ("시몬", "Simon", "Simón", "Simon", "Simão", "Simone"),
    ("니콜라오", "Nicholas", "Nicolás", "Nicolas", "Nicolau", "Nicola"),
    ("빈첸시오", "Vincent", "Vicente", "Vincent", "Vicente", "Vincenzo"),
    ("도미니코", "Dominic", "Domingo", "Dominique", "Domingos", "Domenico"),
    ("그레고리오", "Gregory", "Gregorio", "Grégoire", "Gregório", "Gregorio"),
    ("레오", "Leo", "León", "Léon", "Leão", "Leone"),
]

LABELS = {
    "ko": dict(title="세례명으로 만나는 성지", mine="나의 세례명", box="함께 걸어 볼 성지",
               footer="성지 순례 안내 · 6개 국어", world="세계 곳곳에서 불리는 같은 이름", wait="한국의 성지가 기다립니다"),
    "en": dict(title="Holy places, by your baptismal name", mine="My baptismal name", box="Holy sites to visit",
               footer="Korean Catholic pilgrimage guide · 6 languages", world="The same name around the world",
               wait="Korea’s holy sites await you"),
    "es": dict(title="Lugares santos según tu nombre de bautismo", mine="Mi nombre de bautismo", box="Santuarios para visitar",
               footer="Guía de peregrinación católica en Corea · 6 idiomas", world="El mismo nombre en el mundo",
               wait="Los santuarios de Corea te esperan"),
    "fr": dict(title="Les lieux saints selon votre nom de baptême", mine="Mon nom de baptême", box="Lieux saints à visiter",
               footer="Guide du pèlerinage catholique en Corée · 6 langues", world="Le même nom dans le monde",
               wait="Les sanctuaires de Corée vous attendent"),
    "pt": dict(title="Lugares santos pelo seu nome de batismo", mine="Meu nome de batismo", box="Lugares santos para visitar",
               footer="Guia de peregrinação católica na Coreia · 6 idiomas", world="O mesmo nome pelo mundo",
               wait="Os santuários da Coreia esperam por você"),
    "it": dict(title="I luoghi santi dal tuo nome di battesimo", mine="Il mio nome di battesimo", box="Luoghi santi da visitare",
               footer="Guida al pellegrinaggio cattolico in Corea · 6 lingue", world="Lo stesso nome nel mondo",
               wait="I santuari della Corea ti aspettano"),
}

LATIN = Path("/System/Library/Fonts/Supplemental")
KR = Path(os.environ.get("KR_FONT_DIR", ""))


def _f(path: Path):
    return lambda s: ImageFont.truetype(str(path), s)


LATIN_FONTS = dict(serif=_f(LATIN / "Georgia.ttf"), serif_b=_f(LATIN / "Georgia Bold.ttf"),
                   sans=_f(LATIN / "Arial.ttf"), sans_b=_f(LATIN / "Arial Bold.ttf"))
KR_FONTS = dict(serif=_f(KR / "NotoSerifKR-Regular.otf"), serif_b=_f(KR / "NotoSerifKR-Bold.otf"),
                sans=_f(KR / "NotoSansKR-Regular.otf"), sans_b=_f(KR / "NotoSansKR-Bold.otf"))


def others(row: tuple, lang: str) -> list[str]:
    """이 카드의 언어를 뺀 나머지 라틴 표기(겹치는 것은 한 번만). 한글 표기는 라틴 글꼴로 그릴 수 없어 넣지 않는다."""
    own = row[LANGS.index(lang)]
    out = []
    for v in row[1:]:
        if v != own and v not in out:
            out.append(v)
    return out


def card(row: tuple, lang: str) -> Image.Image:
    L, F = LABELS[lang], (KR_FONTS if lang == "ko" else LATIN_FONTS)
    name = row[LANGS.index(lang)]
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((48, 48, W - 48, H - 48), radius=40, fill=BG)
    d.rounded_rectangle((70, 70, W - 70, H - 70), radius=30, outline="#ddd8cf", width=2)
    bird = dove(150)
    img.paste(bird, ((W - bird.width) // 2, 120), bird)

    centered(d, 300, L["title"], fit(d, L["title"], F["serif"], 40, W - 200), OLIVE)
    centered(d, 370, L["mine"], fit(d, L["mine"], F["sans"], 34, W - 200), MUTED)
    big = fit(d, name, F["serif_b"], 190, W - 220)
    centered(d, 425 + (190 - big.size) // 2, name, big, NAVY)
    d.line((W // 2 - 60, 690, W // 2 + 60, 690), fill=ACCENT, width=4)

    # 성인 칸 자리: 같은 이름의 다른 언어 표기 (라틴 글자라 언제나 Georgia 로 그린다)
    forms = others(row, lang)
    if forms:
        for size in (52, 46, 40, 36, 32):
            f = LATIN_FONTS["serif"](size)
            lines = wrap(d, forms, f, W - 200)
            if len(lines) * (size + 12) <= 130:
                break
        y = 712 + (130 - len(lines) * (size + 12)) // 2
        for line in lines:
            centered(d, y, line, f, NAVY)
            y += size + 12
        centered(d, 850, L["world"], fit(d, L["world"], F["sans"], 30, W - 200), MUTED)

    top = 910
    d.rounded_rectangle((120, top, W - 120, top + 200), radius=26, fill=SOFT)
    centered(d, top + 28, L["box"], fit(d, L["box"], F["sans_b"], 34, W - 300), OLIVE)
    centered(d, top + 100, L["wait"], fit(d, L["wait"], F["serif_b"], 54, W - 300), NAVY)

    centered(d, 1148, "visitholykorea.com", LATIN_FONTS["sans_b"](46), NAVY)
    centered(d, 1212, L["footer"], fit(d, L["footer"], F["sans"], 30, W - 200), MUTED)
    return img


def main() -> None:
    ts = ROOT / "src" / "features" / "baptism-card" / "data" / "baptism-names.ts"
    text = ts.read_text(encoding="utf-8")
    taken = set(re.findall(r"slug: '([^']+)', kind: '(?:name|saint)'", text))
    taken_ko = set(re.findall(r"kind: '(?:name|saint)', names: \{ ko: '([^']+)'", text))
    slugs = [r[1] for r in PLAIN]
    assert len(set(slugs)) == len(slugs) and not (set(slugs) & taken), set(slugs) & taken
    assert not ({r[0] for r in PLAIN} & taken_ko), {r[0] for r in PLAIN} & taken_ko

    root = ROOT / "public" / "baptism-cards"
    for lang in LANGS:
        (root / lang).mkdir(parents=True, exist_ok=True)
        (root / "og" / lang).mkdir(parents=True, exist_ok=True)
        for row in PLAIN:
            im = card(row, lang)
            im.save(root / lang / f"{row[1]}.webp", "WEBP", quality=82, method=6)
            im.resize((480, 600), Image.LANCZOS).save(root / "og" / lang / f"{row[1]}.jpg", "JPEG", quality=72, optimize=True)
    print(len(PLAIN) * len(LANGS), "cards")

    # baptism-names.ts: 예전에 넣은 plain 줄을 지우고 다시 넣는다 (목록 끝, 닫는 ]; 바로 앞)
    kept = [ln for ln in text.split("\n") if "kind: 'plain'" not in ln]
    end = max(i for i, ln in enumerate(kept) if ln.strip() == "];")
    rows = []
    for row in sorted(PLAIN, key=lambda r: r[0]):
        inner = ", ".join(f"{lang}: '{row[i]}'" for i, lang in enumerate(LANGS))
        rows.append(f"  {{ slug: '{row[1]}', kind: 'plain', names: {{ {inner} }} }},")
    ts.write_text("\n".join(kept[:end] + rows + kept[end:]), encoding="utf-8")
    print("wrote", ts.relative_to(ROOT), f"(+{len(rows)} plain)")


if __name__ == "__main__":
    main()
