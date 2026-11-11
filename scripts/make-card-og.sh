#!/bin/sh
# 세례명 카드의 메신저 미리보기용 JPG 를 만든다 (맥 전용 — sips 사용).
#   public/baptism-cards/<언어>/<이름>.webp  →  public/baptism-cards/og/<언어>/<이름>.jpg (480×600)
# 카카오톡 등 미리보기 수집기가 webp 를 못 읽는 경우가 있어 JPG 를 따로 둔다. 카드를 다시 만들면 이것도 다시 돌린다.
#   sh scripts/make-card-og.sh
set -e
cd "$(dirname "$0")/.."
for dir in public/baptism-cards/??; do
  lang=$(basename "$dir")
  [ "$lang" = og ] && continue
  mkdir -p "public/baptism-cards/og/$lang"
  for f in "$dir"/*.webp; do
    out="public/baptism-cards/og/$lang/$(basename "$f" .webp).jpg"
    sips -s format jpeg -s formatOptions 70 -Z 600 "$f" --out "$out" >/dev/null
  done
  echo "$lang: $(ls "public/baptism-cards/og/$lang" | wc -l | tr -d ' ')장"
done
du -sh public/baptism-cards/og
