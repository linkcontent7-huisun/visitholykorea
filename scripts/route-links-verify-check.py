"""T-050 검증 검사기 — found 항목을 빠짐없이 판정했는지 본다."""
import json, os, sys
B = os.path.join(os.path.dirname(__file__), "..", "data", "research", "route-links")
d = json.load(open(os.path.join(B, "links.json"), encoding="utf-8"))
items = d["ourCourses"] + d["nationwide"]
want = {i for i, x in enumerate(items) if x["status"] == "found"}
p = os.path.join(B, "_verify.json")
if not os.path.exists(p):
    print("FAIL _verify.json 없음"); sys.exit(1)
v = {x.get("i"): x for x in json.load(open(p, encoding="utf-8")).get("items", [])}
errs = [f"{i} 판정 없음" for i in sorted(want - set(v))]
errs += [f"{i} verdict 오류: {x.get('verdict')}" for i, x in v.items() if x.get("verdict") not in ("OK", "다른페이지", "확인불가")]
errs += [f"{i} reason 없음" for i, x in v.items() if not x.get("reason")]
if errs:
    print("FAIL"); [print("  -", e) for e in errs]; sys.exit(1)
print("OK", len(want), "개")
