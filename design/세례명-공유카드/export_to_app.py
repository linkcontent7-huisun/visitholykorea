"""만든 카드(6개 언어 × 43장)를 앱이 쓰는 모양으로 내보낸다.

- public/baptism-cards/{언어}/{영어 세례명}.webp  — PWA 사전 저장 대상(png·svg…)에서 빠지도록 webp 로 둔다
  (vite.config.ts 의 globPatterns 에 webp 가 없다 — 258장이 첫 방문 때 통째로 내려받아지지 않게).
- src/features/baptism-card/data/baptism-names.ts — 세례명 43개의 언어별 표기 (화면 목록용, 이 스크립트가 만든다).
파일 이름은 영어 세례명으로 통일한다 — 한글·악센트 파일명은 주소에서 깨지기 쉽다.
실행: python export_to_app.py
"""

import csv
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
LANGS = ["ko", "en", "es", "fr", "pt", "it"]
FOLDER = {"ko": "cards", "en": "cards-en", "es": "cards-es", "fr": "cards-fr", "pt": "cards-pt", "it": "cards-it"}


def read_index(lang: str) -> dict[str, str]:
    """한국어 세례명 → 그 언어의 세례명(= 카드 파일 이름)"""
    with open(HERE / FOLDER[lang] / "index.tsv", encoding="utf-8") as f:
        rows = list(csv.reader(f, delimiter="\t"))[1:]
    return {r[0]: (r[0] if lang == "ko" else r[1]) for r in rows if r}


names = {lang: read_index(lang) for lang in LANGS}
slug_of = names["en"]  # 한국어 → 영어 = 파일 이름
assert len(slug_of) == 43 and all(set(names[l]) == set(slug_of) for l in LANGS)

out_root = ROOT / "public" / "baptism-cards"
total = 0
for lang in LANGS:
    d = out_root / lang
    d.mkdir(parents=True, exist_ok=True)
    for ko, loc in names[lang].items():
        im = Image.open(HERE / FOLDER[lang] / f"{loc}.png").convert("RGB")
        im.save(d / f"{slug_of[ko]}.webp", "WEBP", quality=82, method=6)
        total += 1
print(total, "images")

ts = ROOT / "src" / "features" / "baptism-card" / "data" / "baptism-names.ts"
ts.parent.mkdir(parents=True, exist_ok=True)
lines = [
    "/**",
    " * 세례명 카드 43종의 언어별 표기. design/세례명-공유카드/export_to_app.py 가 만든 파일이라 손으로 고치지 않는다.",
    " * 영어 외 표기는 검수 전이다(가톨릭 용어는 신자·번역자 확인 필요).",
    " */",
    "import type { Language } from '@/shared/i18n/dictionary';",
    "",
    "export interface BaptismName {",
    "  /** 카드 이미지 파일 이름(영어 세례명) */",
    "  slug: string;",
    "  names: Record<Language, string>;",
    "}",
    "",
    "export const BAPTISM_NAMES: readonly BaptismName[] = [",
]
for ko in sorted(slug_of):
    inner = ", ".join(f"{l}: '{names[l][ko]}'" for l in LANGS)
    lines.append(f"  {{ slug: '{slug_of[ko]}', names: {{ {inner} }} }},")
lines.append("];")
ts.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("wrote", ts.relative_to(ROOT))
