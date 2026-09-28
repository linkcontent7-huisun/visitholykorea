"""T-049 검증 결과 검사기 — Codex 가 10곳을 빠짐없이, 문장 단위로 판정했는지 본다."""
import json
import os
import re
import sys

BASE = os.path.join(os.path.dirname(__file__), "..", "data", "research", "missing-sites")
drafts = json.load(open(os.path.join(BASE, "drafts.json"), encoding="utf-8"))["sites"]
path = os.path.join(BASE, "_verify.json")
errs = []
if not os.path.exists(path):
    print("FAIL _verify.json 없음")
    sys.exit(1)
v = json.load(open(path, encoding="utf-8"))
got = {s.get("cbck_code"): s for s in v.get("sites", [])}

for d in drafts:
    c = d["cbck_code"]
    s = got.get(c)
    if not s:
        errs.append(f"{c} 판정 없음")
        continue
    if s.get("verdict") not in ("OK", "고칠것", "확인불가"):
        errs.append(f"{c} verdict 값 오류: {s.get('verdict')}")
    if s.get("verdict") == "고칠것" and not s.get("problems"):
        errs.append(f"{c} 고칠것인데 problems 비어 있음")
    # 문장 수는 마침표 기준 — 소개가 있으면 문장마다 판정이 있어야 한다
    if d.get("description"):
        n = len([x for x in re.split(r"(?<=다\.)\s*", d["description"]) if x.strip()])
        sent = s.get("sentences") or []
        if len(sent) < n:
            errs.append(f"{c} 문장 판정 {len(sent)}개 < 소개 문장 {n}개")
        for x in sent:
            if x.get("verdict") not in ("근거있음", "근거없음", "틀림"):
                errs.append(f"{c} 문장 verdict 값 오류: {x.get('verdict')}")
            if x.get("verdict") == "근거있음" and not x.get("evidence"):
                errs.append(f"{c} 근거있음인데 evidence 없음: {x.get('text', '')[:20]}")

if errs:
    print("FAIL")
    for e in errs:
        print("  -", e)
    sys.exit(1)
print("OK", len(drafts), "곳")
