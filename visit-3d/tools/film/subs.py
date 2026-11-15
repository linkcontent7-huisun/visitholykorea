# 녹화 로그(rec.mjs 출력의 film: {...marks}) → finish.swift 용 자막 JSON
# 사용: python3 subs.py <take.log> <subs.json> [음악 출처 문구]
import json, re, sys
log, out = sys.argv[1], sys.argv[2]
credit = sys.argv[3] if len(sys.argv) > 3 else '음악: "New Horizon" — Soundrider/Dope (CC BY 3.0)'
m = re.search(r'film: (\{.*\})', open(log, encoding='utf-8').read())
marks = json.loads(m.group(1))['marks']
TEXT = {
    '0-aerial': '명동대성당 · 3D 가상 순례',
    '1-stairs': '언덕 돌계단을 오르다',
    '2-facade': '정면과 종탑',
    '3-grotto': '성모 동굴 — 초를 봉헌하다',
    '4-door': '정문이 열리다',
    '4b-bell': '종 줄을 끌어내려 종을 울리다',
    '4d-font': '성수를 찍고 십자성호를 긋다',
    '4c-stations': '십자가의 길 — 처마다 기도하다',
    '5-nave': '햇살 드는 신랑(Nave)',
    '6-altar': '제대 앞 봉헌초',
    '7-exterior': '옆면에서 뒷면까지',
}
END = marks[-1]['t']; CREDIT_T0 = END - 4.8
subs = []
for i, mk in enumerate(marks):
    if mk['name'] not in TEXT: continue
    nxt = marks[i + 1]['t'] if i + 1 < len(marks) else mk['t'] + 6
    t0 = mk['t'] + min(0.9, 0.25 * (nxt - mk['t']))
    t1 = min(nxt - 0.6, t0 + 4.2, CREDIT_T0 - 0.4)  # 마지막 장면 자막은 출처 자막과 겹치지 않게 먼저 끝낸다
    if t1 > t0 + 0.9: subs.append({'t0': round(t0, 2), 't1': round(t1, 2), 'text': TEXT[mk['name']]})
# 마지막 4.5초: 출처·안내(오른쪽 아래 작게) — 음악 CC BY 표기 의무, OSM ODbL, 실측 복제 아님 — 와 주소(가운데, 조금 위)
subs.append({'t0': round(CREDIT_T0, 2), 't1': round(END - 0.3, 2), 'pos': 'corner', 'size': 24,
             'text': credit + '\n지도 자료: © OpenStreetMap contributors (ODbL) · 시범 모델 — 실측 복제·공식 콘텐츠 아님'})
subs.append({'t0': round(CREDIT_T0, 2), 't1': round(END - 0.3, 2), 'text': 'visitholykorea.com/visit', 'size': 40, 'y': 150})
json.dump(subs, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(subs), 'subs, end', END)
