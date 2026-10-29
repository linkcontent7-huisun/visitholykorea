"""미카엘 챗봇 회귀 시험 (2026-10-29). 사용: python scripts/qa/michael-regression.py [함수이름]

운영 ai-guide 에 실제 질문 39개를 보내 답에 있어야 할 말·없어야 할 말을 본다. 유료 AI 를 부르니 하루 몇 번만.
Anthropic 크레딧이 없으면 안내 카드로 답이 와서 FAIL 이 난다 — 그때는 잔액부터 본다.
.env.local 의 VITE_SUPABASE_URL · VITE_SUPABASE_ANON_KEY(공개 값)를 쓴다."""
import json, os, sys, time, urllib.request

FN = sys.argv[1] if len(sys.argv) > 1 else "ai-guide"
HERE = os.path.dirname(os.path.abspath(__file__))
sys.stdout.reconfigure(encoding="utf-8")
env = {}
for line in open(os.path.join(HERE, "..", "..", ".env.local"), encoding="utf-8"):
    if "=" in line and not line.startswith("#"):
        k, v = line.strip().split("=", 1)
        env[k] = v.strip('"')
url = env["VITE_SUPABASE_URL"] + "/functions/v1/" + FN
key = env["VITE_SUPABASE_ANON_KEY"]

# (질문, 직전 대화, 답에 있어야 할 말 중 하나 이상, 답에 없어야 할 말)
H1 = [{"role": "user", "text": "절두산 순교성지 소개해줘"}, {"role": "bot", "text": "절두산 순교성지는 서울 마포구 한강변 양화진 잠두봉에 있는 곳이에요."}]
H2 = [{"role": "user", "text": "해미순교성지 알려줘"}, {"role": "bot", "text": "해미순교성지는 충남 서산시에 있어요."}]
CASES = [
    ("절두산 순교성지 소개해줘", [], ["절두산"], []),
    ("김대건 신부님 탄생지가 어디야", [], ["솔뫼"], []),
    ("다블뤼 주교는 누구야", [], ["다블뤼"], ["잘 모르겠어요"]),
    ("해미읍성 미사 시간 알려줘", [], ["해미"], []),
    ("교황님 다녀가신 성지", [], ["해미", "광화문", "시복", "교황"], ["찾지 못했어요"]),
    ("아이랑 갈 만한 성지", [], ["성지", "성당"], []),
    ("성지순례 처음인데 어디부터 가야 해?", [], ["절두산", "명동", "솔뫼", "해미", "배론", "전동"], []),
    ("거기 어떻게 가요?", H1, ["절두산", "합정", "양화"], []),
    ("미사 시간은?", H2, ["해미", "homepage", "haemi", "041", "홈페이지", "전화", "문의"], []),
    ("Which shrine should I visit in Jeju?", [], ["Jeju", "제주"], ["퍄냣", "찾으셨나요"]),
    ("¿Qué santuario puedo visitar en Seúl?", [], ["Seúl", "Seul", "서울", "Seoul"], ["no tengo información"]),
    ("Tell me about Jeoldusan Martyrs' Shrine", [], ["Jeoldusan"], ["찾으셨나요"]),
    ("audehdtjdekd", [], ["명동"], []),
    ("오늘 점심 뭐 먹지", [], [], []),
    ("명동성당 근처 숙소 추천", [], ["명동"], []),
    ("공세리성당 주변 볼 만한 곳", [], ["공세리"], []),
    ("서울에서 당일치기 성지순례 코스 추천해줘", [], ["서울", "절두산", "새남터", "명동"], []),
    ("부산에 있는 성지는 어디야?", [], ["부산", "오륜대"], []),
    ("성지순례 처음인데 어디부터 가야 해?", [], ["절두산", "명동", "솔뫼", "해미", "배론", "전동", "새남터", "치명자산"], []),
    ("배론성지는 어떤 곳이에요?", [], ["배론"], []),
    ("최양업 신부님 묘소는 어디예요", [], ["배론"], []),
    ("황사영 백서가 뭐예요", [], ["백서"], ["잘 모르겠어요"]),
    ("정약종은 누구야", [], ["정약종"], []),
    ("새남터 순교성지 가는 방법", [], ["새남터", "이촌", "용산"], []),
    ("전주 성지 추천해줘", [], ["전동", "치명자산", "전주"], []),
    ("제주도 용수성지 위치", [], ["용수", "제주"], []),
    ("대구에서 갈 만한 성지 알려줘", [], ["대구"], []),
    ("휠체어로 갈 수 있는 성지", [], ["성지"], []),
    ("Où se trouve le sanctuaire de Jeoldusan ?", [], ["Jeoldusan", "절두산"], []),
    ("Dove si trova il santuario di Haemi?", [], ["Haemi", "해미"], []),
    ("Onde fica o santuário de Myeongdong?", [], ["Myeongdong", "명동"], []),
    ("미사 시간 어떻게 알아봐?", [], ["홈페이지", "문의", "전화", "성당"], []),
    ("그곳 근처에 볼 만한 곳은?", H2, ["해미", "읍성"], []),
    ("안녕", [], [], []),
    ("성지가 뭐예요?", [], ["성지"], []),
    ("서소문 밖 네거리 순교성지는 왜 중요해?", [], ["서소문"], []),
    ("천진암은 어떤 곳이야", [], ["천진암"], []),
    ("Which shrine near Busan?", [], ["Busan", "부산", "Oryundae", "오륜대"], ["퍄"]),
    ("가장 오래된 성당은?", [], ["답동", "성당"], ["확인하지 못한 상태"]),
]
bad = 0
for q, hist, want, forbid in CASES:
    body = json.dumps({"mode": "ask", "question": q, "history": hist}, ensure_ascii=False).encode()
    req = urllib.request.Request(url, data=body, headers={"Authorization": "Bearer " + key, "apikey": key, "Content-Type": "application/json; charset=utf-8"})
    t = time.time()
    try:
        r = json.load(urllib.request.urlopen(req, timeout=120))
        a = r.get("text", "")
    except Exception as e:
        r, a = {}, f"ERROR {e}"
    ok = (not want or any(w.lower() in a.lower() for w in want)) and not any(f.lower() in a.lower() for f in forbid) and not a.startswith("ERROR")
    bad += 0 if ok else 1
    print(("PASS" if ok else "FAIL"), f"[{time.time()-t:.1f}s]", q, "| sources:", r.get("sources"), "| fb:", r.get("fallbackFrom"))
    print("   ", a[:230].replace("\n", " "))
print("FAILED:", bad, "/", len(CASES))
