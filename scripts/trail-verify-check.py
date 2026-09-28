"""T-048 2차 검증 결과 검사기.

검증도 검사가 없으면 대충 「일치」로 채운다 — 그래서 1차 결과의 모든 항목과
자동 대조의 모든 쌍을 다뤘는지(빠짐 없음)를 센다. 판정이 옳은지는 Claude 가 본다.

사용: python scripts/trail-verify-check.py data/research/trails/_verify/<slug>.verify.json [...]
"""

import json
import os
import sys

VERDICTS = {"일치", "불일치", "확인불가"}
MATCH_VERDICTS = {"맞음", "틀림", "애매"}
BASE = os.path.join("data", "research", "trails")


def expected_items(research: dict) -> set[str]:
    items = set()
    for ci, c in enumerate(research["courses"]):
        for k in ("name", "distanceKm", "duration"):
            items.add(f"courses[{ci}].{k}")
        for si, _ in enumerate(c["stops"]):
            items.add(f"courses[{ci}].stops[{si}].name")
    return items


def check(path: str) -> list[str]:
    try:
        v = json.load(open(path, encoding="utf-8"))
    except Exception as e:
        return [f"읽기 실패: {e}"]
    errs = [f"필수 칸 없음: {k}" for k in
            ("slug", "pageOpened", "openNote", "checks", "missing", "matchReview", "recommendationComment")
            if k not in v]
    if errs:
        return errs

    research = json.load(open(os.path.join(BASE, f"{v['slug']}.json"), encoding="utf-8"))
    done = {c.get("item") for c in v["checks"]}
    lost = sorted(expected_items(research) - done)
    if lost:
        errs.append(f"checks 에서 빠진 항목 {len(lost)}개: {lost[:5]}")
    for c in v["checks"]:
        if c.get("verdict") not in VERDICTS:
            errs.append(f"checks verdict 값 오류: {c.get('item')} → {c.get('verdict')}")
        if c.get("verdict") == "불일치" and not c.get("official"):
            errs.append(f"불일치인데 official 없음: {c.get('item')}")
    if not v["pageOpened"] and any(c.get("verdict") != "확인불가" for c in v["checks"]):
        errs.append("페이지를 못 열었는데 확인불가가 아닌 판정이 있음")

    pairs = json.load(open(os.path.join(BASE, "_verify", "matches.json"), encoding="utf-8"))
    want = {(p["stop"], p["ourSite"]) for p in pairs if p["slug"] == v["slug"]}
    got = {(m.get("stop"), m.get("ourSite")) for m in v["matchReview"]}
    if want - got:
        errs.append(f"matchReview 에서 빠진 쌍 {len(want - got)}개: {sorted(want - got)[:3]}")
    for m in v["matchReview"]:
        if m.get("verdict") not in MATCH_VERDICTS or not m.get("reason"):
            errs.append(f"matchReview 판정·근거 오류: {m.get('stop')}")
    if not v["recommendationComment"]:
        errs.append("recommendationComment 비어 있음")
    return errs


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")  # 윈도 콘솔(cp949)에서 한글이 깨지지 않게
    bad = 0
    for path in sys.argv[1:]:
        errs = check(path)
        print(("FAIL " if errs else "OK   ") + path)
        for e in errs:
            print(f"  - {e}")
        bad += bool(errs)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
