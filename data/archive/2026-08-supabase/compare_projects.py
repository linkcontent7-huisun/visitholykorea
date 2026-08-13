"""두 Supabase 프로젝트의 데이터가 같은지 비교한다.

전환하기 전에 "신 프로젝트에 데이터가 온전히 있는가"를 확인하는 용도.

사용법
------
1. .env.local 에 신 프로젝트 정보를 임시로 추가한다.

       NEW_SUPABASE_URL=https://stdmbtyppkyncasplmae.supabase.co
       NEW_SUPABASE_ANON_KEY=<신 프로젝트 anon 키>

2. 실행

       python supabase/research/compare_projects.py

읽기만 하므로 어느 쪽 데이터도 바뀌지 않는다.
"""

import json
import os
import sys
import urllib.error
import urllib.request

# 이 파일 기준으로 앱 루트 찾기 (supabase/research/ 안에 있다)
APP_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ENV_PATH = os.path.join(APP_ROOT, ".env.local")

TABLES = ["holy_sites", "catholic_directory", "pilgrimage_stamps"]
KEY_COLUMN = "name"  # 행을 대조할 기준 컬럼


def load_env(path):
    env = {}
    if not os.path.exists(path):
        sys.exit(f"환경파일이 없습니다: {path}")
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def fetch_all(url, key, table):
    """PostgREST 페이지네이션으로 테이블 전체를 가져온다."""
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    rows, step = [], 1000
    while True:
        req = urllib.request.Request(
            f"{url}/rest/v1/{table}?select=*&limit={step}&offset={len(rows)}",
            headers=headers,
        )
        with urllib.request.urlopen(req, timeout=60) as r:
            batch = json.loads(r.read().decode())
        rows.extend(batch)
        if len(batch) < step:
            return rows


def compare_table(table, old, new):
    print(f"\n{'=' * 58}")
    print(f"  {table}")
    print("=" * 58)

    results = {}
    for label, (url, key) in {"구(kaahuo)": old, "신(stdmbty)": new}.items():
        try:
            results[label] = fetch_all(url, key, table)
        except urllib.error.HTTPError as e:
            print(f"  {label:14s} 읽기 불가 (HTTP {e.code})")
            results[label] = None
        except Exception as e:
            print(f"  {label:14s} 오류 {type(e).__name__}")
            results[label] = None

    a, b = results.get("구(kaahuo)"), results.get("신(stdmbty)")
    if a is None or b is None:
        print("  → 한쪽을 못 읽어 비교를 건너뜁니다.")
        return

    print(f"  행수   구 {len(a):>6d}   신 {len(b):>6d}   "
          f"{'일치' if len(a) == len(b) else f'차이 {abs(len(a)-len(b))}행'}")

    if not a and not b:
        print("  → 양쪽 다 비어 있음")
        return

    if KEY_COLUMN not in (a[0] if a else b[0]):
        print(f"  → '{KEY_COLUMN}' 컬럼이 없어 행 단위 대조는 건너뜁니다.")
        return

    names_a = {r.get(KEY_COLUMN) for r in a}
    names_b = {r.get(KEY_COLUMN) for r in b}

    only_a = sorted(names_a - names_b)
    only_b = sorted(names_b - names_a)

    if only_a:
        print(f"\n  구에만 있음 ({len(only_a)}건) — 전환 시 사라진다:")
        for n in only_a[:20]:
            print(f"     {n}")
        if len(only_a) > 20:
            print(f"     … 외 {len(only_a) - 20}건")
    if only_b:
        print(f"\n  신에만 있음 ({len(only_b)}건):")
        for n in only_b[:20]:
            print(f"     {n}")
        if len(only_b) > 20:
            print(f"     … 외 {len(only_b) - 20}건")

    # 양쪽에 다 있는 행의 내용 차이
    if not only_a and not only_b:
        by_a = {r[KEY_COLUMN]: r for r in a}
        by_b = {r[KEY_COLUMN]: r for r in b}
        diff_fields = {}
        for n in names_a:
            ra, rb = by_a[n], by_b[n]
            for col in ra:
                if col in ("id", "created_at"):   # 재삽입 시 달라지는 게 정상
                    continue
                if ra.get(col) != rb.get(col):
                    diff_fields.setdefault(col, []).append(n)
        if diff_fields:
            print("\n  같은 행인데 내용이 다른 컬럼:")
            for col, names in sorted(diff_fields.items(), key=lambda x: -len(x[1])):
                print(f"     {col:20s} {len(names):>4d}건  (예: {names[0]})")
        else:
            print("\n  → 내용까지 완전히 일치")


def main():
    env = load_env(ENV_PATH)

    old_url = env.get("VITE_SUPABASE_URL", "").rstrip("/")
    old_key = env.get("VITE_SUPABASE_ANON_KEY", "")
    new_url = env.get("NEW_SUPABASE_URL", "").rstrip("/")
    new_key = env.get("NEW_SUPABASE_ANON_KEY", "")

    if not (old_url and old_key):
        sys.exit("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 .env.local 에 없습니다.")
    if not (new_url and new_key):
        sys.exit(
            "NEW_SUPABASE_URL / NEW_SUPABASE_ANON_KEY 가 .env.local 에 없습니다.\n"
            "신 프로젝트 대시보드 > Settings > API 에서 복사해 아래처럼 추가하세요.\n\n"
            "  NEW_SUPABASE_URL=https://stdmbtyppkyncasplmae.supabase.co\n"
            "  NEW_SUPABASE_ANON_KEY=..."
        )

    print("비교 대상")
    print(f"  구: {old_url}")
    print(f"  신: {new_url}")

    for t in TABLES:
        compare_table(t, (old_url, old_key), (new_url, new_key))

    print(f"\n{'=' * 58}")
    print("  '구에만 있음' 이 0건이어야 안전하게 전환할 수 있다.")
    print("=" * 58)


if __name__ == "__main__":
    main()
