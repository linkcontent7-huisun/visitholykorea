"""T-048 순례길 조사 결과 검사기.

Codex 는 검사 없는 산출물을 대충 채우는 버릇이 있어(9/18 실측), 완료 판정을
Codex 의 말이 아니라 이 검사기로 한다. 형식만 본다 — 내용이 공식 페이지와
맞는지는 Claude 가 따로 대조한다.

사용: python scripts/trail-research-check.py data/research/trails/<slug>.json [...]
"""

import json
import sys

REQUIRED = ["slug", "name", "operator", "operatorType", "region", "officialUrl",
            "urlWorks", "summary", "courses", "unknowns", "sources"]
OPERATOR_TYPES = {"diocese", "local", "other"}


def check(path: str) -> list[str]:
    try:
        with open(path, encoding="utf-8") as f:
            d = json.load(f)
    except Exception as e:  # 파일 없음·JSON 깨짐
        return [f"읽기 실패: {e}"]

    errs = [f"필수 칸 없음: {k}" for k in REQUIRED if k not in d]
    if errs:
        return errs

    if d["operatorType"] not in OPERATOR_TYPES:
        errs.append(f"operatorType 값 오류: {d['operatorType']}")
    if not isinstance(d["summary"], str) or len(d["summary"]) > 200:
        errs.append("summary 가 문자열이 아니거나 200자 초과")
    sources = set(d["sources"] or [])
    if not sources:
        errs.append("sources 가 비어 있음")
    if d["officialUrl"] not in sources and d["urlWorks"]:
        errs.append("officialUrl 이 sources 에 없음 (실제로 열었는가?)")
    if not d["urlWorks"] and d["courses"]:
        errs.append("urlWorks=false 인데 courses 가 있음")

    for ci, c in enumerate(d["courses"] or []):
        tag = f"courses[{ci}]"
        for k in ["name", "distanceKm", "duration", "courseUrl", "stops"]:
            if k not in c:
                errs.append(f"{tag} 칸 없음: {k}")
        if c.get("courseUrl") and c["courseUrl"] not in sources:
            errs.append(f"{tag} courseUrl 이 sources 에 없음")
        orders = [s.get("order") for s in c.get("stops") or []]
        if orders and orders != list(range(1, len(orders) + 1)):
            errs.append(f"{tag} stops.order 가 1부터 연속이 아님: {orders}")
        for si, s in enumerate(c.get("stops") or []):
            if not s.get("name"):
                errs.append(f"{tag}.stops[{si}] 이름 없음")
            if s.get("sourceUrl") not in sources:
                errs.append(f"{tag}.stops[{si}] sourceUrl 이 sources 에 없음")
    return errs


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")  # 윈도 콘솔(cp949)에서 한글이 깨지지 않게
    bad = 0
    for path in sys.argv[1:]:
        errs = check(path)
        if errs:
            bad += 1
            print(f"FAIL {path}")
            for e in errs:
                print(f"  - {e}")
        else:
            print(f"OK   {path}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
