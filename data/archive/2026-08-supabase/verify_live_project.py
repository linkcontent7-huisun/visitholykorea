"""배포된 라이브 사이트가 어느 Supabase 프로젝트를 쓰는지 확인한다.

Vite 는 빌드 시점에 환경변수를 JS 번들에 박아 넣는다.
그래서 Vercel 에서 환경변수만 바꾸고 재배포하지 않으면 예전 값이 그대로 살아 있다.
이 스크립트는 실제 번들을 내려받아 눈으로 확인해 준다.

    python supabase/research/verify_live_project.py

2026-08-10 에 이 방법으로, 라이브 사이트가 구 프로젝트를 쓰고 있다는 걸 찾아냈다.
"""

import re
import sys
import urllib.request

SITE = "https://visitholykorea-app.vercel.app"

KNOWN = {
    "kaahuoqzkgshihypzzyh": "구 프로젝트 (도쿄, 대시보드 접근 불가)",
    "stdmbtyppkyncasplmae": "신 프로젝트 (서울, 대시보드 접근 가능)",
}
EXPECTED = "stdmbtyppkyncasplmae"   # 전환 완료 후 기대값


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "ignore")


def main():
    print(f"대상: {SITE}\n")
    try:
        html = get(SITE)
    except Exception as e:
        sys.exit(f"사이트 접속 실패: {type(e).__name__} {e}")

    bundles = re.findall(r'src="(/assets/[^"]+\.js)"', html)
    if not bundles:
        sys.exit("JS 번들을 찾지 못했습니다. 사이트 구조가 바뀌었을 수 있습니다.")

    print(f"JS 번들 {len(bundles)}개 검사 중…")
    found = set()
    for path in bundles[:8]:
        try:
            code = get(SITE + path)
            found.update(re.findall(r"https://([a-z0-9]{20})\.supabase\.co", code))
        except Exception:
            pass

    print()
    if not found:
        sys.exit("번들에서 Supabase URL 을 찾지 못했습니다.")

    print("라이브 사이트가 실제로 쓰는 프로젝트:")
    for ref in sorted(found):
        print(f"  {ref}  ← {KNOWN.get(ref, '알 수 없는 프로젝트')}")

    print()
    if found == {EXPECTED}:
        print("✅ 전환 완료 — 신 프로젝트만 사용 중입니다.")
    elif EXPECTED in found:
        print("⚠️  신·구가 섞여 있습니다. 코드 어딘가에 옛 URL 이 하드코딩돼 있을 수 있습니다.")
    else:
        print("❌ 아직 전환되지 않았습니다.")
        print("   Vercel 환경변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)를 바꾼 뒤")
        print("   반드시 재배포해야 번들에 반영됩니다.")


if __name__ == "__main__":
    main()
