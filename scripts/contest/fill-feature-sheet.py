# 공모전 「기능 설명서」 공식 양식(pptx)을 채운다. 2026-09-20 작성 · 2026-09-21 내용 갱신(순례 기록 축·6개 국어 완비·분산 세 축).
# 사용: PYTHONIOENCODING=utf-8 python scripts/contest/fill-feature-sheet.py <양식.pptx> <스크린샷 폴더> <출력.pptx>
# 양식은 9장 고정. 5장(기능 흐름도)은 해시태그 수만큼 복제한다. 안내문 상자(빨간 박스)는 지운다.
import copy, sys, io
from pptx import Presentation
from pptx.util import Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from PIL import Image

SRC, SHOTS, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
BLACK = RGBColor(0, 0, 0)
SITES = '206'  # DB 실측 2026-09-20 (소개글 206×6개 국어 · 오디오 가이드 108×6)


def set_text(cell_or_shape, lines, size=14, bold_first=False, align=None):
    """셀(또는 도형)의 안내문을 지우고 줄 단위로 채운다. 글꼴은 테마(+mn-lt)를 그대로 물려받는다."""
    tf = cell_or_shape.text_frame
    tf.word_wrap = True
    first = tf.paragraphs[0]
    for p in list(tf.paragraphs)[1:]:
        p._p.getparent().remove(p._p)
    for r in list(first.runs):
        r._r.getparent().remove(r._r)
    for i, line in enumerate(lines):
        p = first if i == 0 else tf.add_paragraph()
        if align is not None:
            p.alignment = align
        run = p.add_run()
        run.text = line
        run.font.size = Pt(size)
        run.font.color.rgb = BLACK
        run.font.bold = bold_first and i == 0


def remove_shape(shape):
    shape._element.getparent().remove(shape._element)


def table_of(slide, name=None):
    for sh in slide.shapes:
        if sh.has_table and (name is None or sh.name == name):
            return sh
    raise KeyError(name)


def cell_box(shape, r, c):
    """표 안 (r,c) 셀의 절대 위치·크기(EMU). 사진은 표 셀에 못 넣으므로 그 위에 겹쳐 놓는다."""
    t = shape.table
    left = shape.left + sum(col.width for col in list(t.columns)[:c])
    top = shape.top + sum(row.height for row in list(t.rows)[:r])
    return left, top, t.columns[c].width, t.rows[r].height


def put_picture(slide, path, left, top, w, h, pad=Emu(60000)):
    """상자 안에 비율 유지로 맞춰 가운데 놓는다."""
    iw, ih = Image.open(path).size
    bw, bh = w - 2 * pad, h - 2 * pad
    scale = min(bw / iw, bh / ih)
    pw, ph = int(iw * scale), int(ih * scale)
    slide.shapes.add_picture(path, left + (w - pw) // 2, top + (h - ph) // 2, pw, ph)


def duplicate_slide(prs, src):
    """python-pptx 에 복제가 없어 도형 XML 을 통째로 복사한다. 그림은 뒤에 새로 넣으므로 표·텍스트만 복사한다."""
    dst = prs.slides.add_slide(src.slide_layout)
    for sh in list(dst.shapes):
        remove_shape(sh)
    for sh in src.shapes:
        dst.shapes._spTree.append(copy.deepcopy(sh._element))
    return dst


def move_slide(prs, slide, new_index):
    lst = prs.slides._sldIdLst
    el = [e for e in lst if e.rId == prs.part.relate_to(slide.part, 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide')][0]
    lst.remove(el)
    lst.insert(new_index, el)


prs = Presentation(SRC)
S = list(prs.slides)

# ── 1. 표지 ─────────────────────────────────────────────
t = S[0].shapes[0].table
set_text(t.cell(0, 1), ['visitholykorea'], 18)
set_text(t.cell(1, 1), ['VisitHolyKorea — 길 위에서 나를 만나는 성지순례'], 18)

# ── 2. 서비스 소개 ───────────────────────────────────────
t = table_of(S[1]).table
rows = [
    ['VisitHolyKorea (visitholykorea.com)'],
    ['반응형 웹 — 휴대폰(하단 탭 5개)과 PC(상단 메뉴·넓은 본문)를 한 코드로, 1024px 기준 자동 전환. 홈 화면 설치(PWA)로 앱처럼 실행, 같은 코드로 Android/iOS 앱(Capacitor) 빌드'],
    ['① 붐비는 명소 대신 조용한 하루를 원하는 자유여행객·시니어(이용자 조사 응답자 85%가 50대 이상)',
     '② 한국 천주교 성지 순례객과 2027 서울 세계청년대회(WYD) 앞뒤로 방한하는 외국인 순례객(6개 국어)',
     '③ 종교와 무관하게 걷기·사색·역사 여행에 관심 있는 사람'],
    [f'전국 천주교 성지 {SITES}곳을 "오늘 마음·출발지·시간"에 맞춰 골라 주고, 한국관광공사 TourAPI 실시간 데이터(관광지 집중률 예측·주변 관광지·걷기길)로 '
     '하루 일정을 짜 주며, 현장에서는 6개 국어 성지 이야기와 오디오 가이드로 안내하고, 다녀온 기록을 남기는 순례 여행 서비스'],
    ['지정과제 2번 — 유명 관광지 쏠림(오버투어리즘) 문제 해결'],
    [f'성지 {SITES}곳 중 140곳(68%, 2026-09-21 DB 실측)이 비수도권에 있고 대부분 조용하다. 순례자는 목적지가 정해진 여행자라 "명동 성당 다음엔 어디"로 물으면 동선을 바꿀 수 있다. '
     '관광공사 집중률 예측을 실시간으로 엮어 붐비는 날·곳을 피해 같은 지역의 조용한 성지와 주변 볼거리를 제안하면, '
     '유명 성지 열 곳에 몰리던 순례를 공간(206곳)·시간(30일 예측)·체류(주변 식당·걷기길)로 펼칠 수 있다고 판단해 2번을 골랐다.'],
]
for i, lines in enumerate(rows):
    set_text(t.cell(i, 1), lines, 13)

# ── 3. 기획 방향 · 해시태그 목록 ────────────────────────
t = table_of(S[2]).table
set_text(t.cell(0, 1), [
    f'1) 문제와 범위 — 성지 순례는 유명 성지 열 곳·주말·수도권에 몰린다. 우리는 일반 관광객이 아니라 순례자의 동선을 수도권 밖·붐비는 날 밖으로 넓히는 것을 목표로 잡았다. 성지 {SITES}곳 중 140곳(68%)이 비수도권이라(2026-09-21 DB 실측) 목적지 목록 자체가 분산을 돕는다.',
    '2) 공간 분산(어디로) — 관광공사 「관광지 집중률 예측」을 매 요청 실시간으로 받아 성지마다 「주변 밀집도 상·중·하」를 보여 준다(숫자 대신 세 단계, 50대 이상도 한눈에). 「오늘의 성지 일정」은 마음·출발지·시간(질문 3개)에 맞는 후보 중 밀집도 낮은 성지에 「인근이 조용해요」를 붙여 앞세우고, 오후가 붐빌 예정이면 같은 지역의 다른 관광지를 대신 제안한다.',
    '3) 체류(얼마나 오래) — 고른 성지를 축으로 오전 성지 → 점심(주변 식당) → 오후(주변 관광지·걷기길) 하루 일정을 TourAPI 실시간 조회로 짠다(응답 저장 안 함). 박해사·인물을 잇는 순례 코스 11개로 1곳 방문을 여러 곳·여러 날로 늘린다.',
    f'4) 현장 콘텐츠 — 성지 {SITES}곳 소개글과 108곳 지점별 오디오 가이드를 6개 국어로 직접 집필하고, 성지 DB 안에서만 답하는 AI 가이드를 두어 지방의 덜 알려진 성지도 "갈 만한 곳"이 되게 한다.',
    '5) 시간 분산(언제)과 측정 — 집중률 예측 30일치를 성지 상세 「한적한 날」 카드로 펼쳐 "주말 말고 이 날에"를 보여 준다. 「순례 기록」(한 줄·사진)을 서비스 중심에 두고, 저장 때 「그날 붐볐나요?」 한 칸을 받아 관광공사 예측을 실측으로 보정하며, 기록의 성지 → 지역으로 비수도권 방문 비율을 잴 수 있게 했다.',
], 13)
set_text(t.cell(1, 1), [
    '#오늘의성지일정  #오디오가이드  #순례가이드미카엘  #순례기록',
], 16, bold_first=True)

# ── 4. 해시태그 연계 표 ─────────────────────────────────
HASHTAGS = [
    ('#오늘의성지일정', '마음 상태로 고르는 하루 일정 (오버투어리즘 대응의 중심)',
     ['질문 3개(마음 · 출발지 · 시간)에 답하면 반경 안 후보 성지 3곳을 보여 주고, 하나를 고르면 오전 성지 → 점심 → 오후 관광지의 하루 일정을 짠다.',
      'TourAPI: 관광지 집중률 예측(TatsCnctrRateService)으로 「인근 지역이 조용해요/보통이에요/붐벼요」와 「인근이 조용해요」 후보 표시, locationBasedList2 로 성지 주변 식당·관광지 실시간 조회. 오후가 붐빌 예정이면 머무르기 또는 대안 관광지 제안.',
      '시간 답(반나절·하루·1박2일)이 출발지 반경(20km·60km·180km)이 되어 이동이 체류보다 길어지지 않게 한다. 성지 상세에서도 같은 집중률로 「주변 밀집도 상·중·하」와 앞으로 30일 중 조용한 날짜를 고른 「한적한 날」 카드를 보여 준다 — 붐비는 날을 피하는 시간 분산.']),
    ('#오디오가이드', '성지 이야기 · 지점별 오디오 가이드 (6개 국어)',
     [f'성지 {SITES}곳마다 위치·역사·건축과 주변 이야기를 담은 3문단 소개글을 6개 국어로 직접 집필해 DB 에 두었다(2026-09-21 실측 {SITES}곳 × 6개 국어 완비).',
      '현장 지점 원고(여는 말 → 지점 3~6곳 → 맺음말)는 108곳 × 6개 국어. 기기 TTS 로 읽어 주며 속도 조절·챕터 이동이 되고, 원고가 없는 성지는 소개·역사 낭독으로 대체한다.',
      '성지 이야기는 교구 공식 자료·굿뉴스 성지 안내 등 확인된 출처를 화면에 표시하고, 지점 원고는 교구 제공 자료와 문헌을 대조해 작성했다. 관광공사 두루누비 걷기길·주변 관광지(둘러볼 곳)와 나란히 보여 주며, 상단 지구본 버튼으로 언어를 바꾸면 화면·이야기·가이드가 함께 바뀐다.']),
    ('#순례가이드미카엘', '성지 DB 범위 안에서만 답하는 AI 가이드',
     ['어느 화면에서나 상단 「미카엘」로 열린다. 질문과 관련된 성지 레코드(주소·전화·미사·설명)를 찾아 컨텍스트로 넣고 "자료에 없으면 모른다고 답하라"를 시스템 프롬프트에 고정했다.',
      'Claude(Anthropic) 우선, 실패 시 Gemini 로 넘어가는 이중 구조. 사용 가능한 Gemini 모델 목록은 GitHub Actions 가 매일 갱신한다. 키는 Supabase Edge Function 에만 두어 브라우저에 노출되지 않는다.',
      '답변에 「참고한 성지」를 표시해 출처를 드러내고, 로그인하면 대화가 계정에 저장돼 이어진다(「대화 지우기」로 전부 삭제). 6개 국어 질문에 같은 DB 근거로 답한다.']),
    ('#순례기록', '함께 만드는 순례 기록 — 내 한 줄이 다음 순례자의 안내가 된다',
     ['성지 상세의 「순례 기록 남기기」로 방문일·한 줄 메모·사진(최대 3장)을 남긴다. 기록은 그 성지 상세 페이지 아래에 다른 순례자의 후기로 쌓여 「순례 기록 (N)」이 된다 — 운영자가 쓰는 안내가 아니라 모두가 함께 만들어 가는 순례 안내. 익명 공개, 신고로 걸러진다.',
      '하단 탭 가운데 「기록」에서 내 기록과 즐겨찾는 성지를 모아 보고 수정·삭제한다. 순례 코스 상세는 기록을 기준으로 「n화까지 기록」 진행을 보여 준다. 지금은 성지당 기록 1개이며, 재방문도 기록할 수 있게 같은 성지를 여러 번 기록하는 구조로 확장한다.',
      '기록 저장 때 「그날 붐볐나요?」(한적·보통·붐빔) 한 칸을 받는다 — 관광공사 예측을 실측으로 보정하는 재료. 기록은 우리 데이터로 남아 성지 → 지역으로 비수도권 방문 비율을 잴 수 있다.']),
]
sh4 = table_of(S[3])
t = sh4.table
while len(t.rows) < 1 + len(HASHTAGS):
    t._tbl.append(copy.deepcopy(t._tbl.tr_lst[-1]))
for i, (tag, feat, detail) in enumerate(HASHTAGS, 1):
    t.rows[i].height = Emu(int(4543492 / len(HASHTAGS)))
    set_text(t.cell(i, 0), [tag], 13, bold_first=True)
    set_text(t.cell(i, 1), [feat], 12)
    set_text(t.cell(i, 2), detail, 10)
for sh in list(S[3].shapes):
    if sh.shape_type == 1:  # 빨간 안내 상자
        remove_shape(sh)

# ── 5. 기능 흐름도 — 해시태그마다 한 장 ──────────────────
FLOWS = {
    '#오늘의성지일정': [
        ('home-390.png', '홈 입구 카드 「오늘의 성지 일정」'),
        ('compass-q1-390.png', '지금 마음 → 출발지(현재 위치·시도) → 낼 수 있는 시간'),
        ('compass-result-390.png', '반경 안 후보 3곳 — 가장 가까움·인근이 조용함·소개가 자세함 표시'),
        ('detail-quietdays-390.png', '성지 상세 「한적한 날」 — 30일 예측 중 조용한 날짜. 일정 결과는 오전 성지 → 점심 → 오후'),
    ],
    '#오디오가이드': [
        ('detail-top-390.png', '성지 상세 — 사진·분류·주변 밀집도 상/중/하·태그'),
        ('detail-docent-390.png', '「오디오 가이드」 여는 말 → 지점 → 맺음말, 속도 조절, 눈여겨보기'),
        ('detail-docent-en-390.png', '지구본 버튼으로 언어를 바꾸면 가이드도 그 언어로 (영어 예)'),
        ('detail-nearby-390.png', '「둘러볼 곳」 — 관광공사 실시간 식당·볼거리로 체류 연장'),
    ],
    '#순례가이드미카엘': [
        ('michael-390.png', '질문 — 공세리 성지 위치와 전화번호. 「참고한 성지」 표시'),
        ('michael-en-390.png', '외국어 질문에도 같은 DB 근거로 답한다 (영어 예)'),
        ('michael-mass-390.png', 'DB 에 없는 정보는 지어내지 않고 사무실 확인을 안내'),
        ('michael-empty-390.png', '어느 화면에서나 상단 「미카엘」 버튼 — 로그인하면 대화가 이어진다'),
    ],
    '#순례기록': [
        ('detail-record-390.png', '성지 상세 「순례 기록」 — 다녀온 사람들의 후기가 쌓이는 자리, 사진 최대 3장'),
        ('crowded-q-390.png', '기록 남기기의 「그날 붐볐나요?」 — 예측을 검증할 실측 한 칸'),
        ('login-390.png', '카카오·네이버·구글 간편 로그인, 이메일 가입(확인 메일은 화면 언어로)'),
        ('route-detail-390.png', '순례 코스 상세 — 기록 기준 「n화까지 기록」 진행'),
    ],
}
flow_src = S[4]
flow_slides = [flow_src]
for _ in range(len(HASHTAGS) - 1):
    flow_slides.append(duplicate_slide(prs, flow_src))
for k, sl in enumerate(flow_slides[1:], 1):
    move_slide(prs, sl, 4 + k)

for sl, (tag, feat, detail) in zip(flow_slides, HASHTAGS):
    for sh in list(sl.shapes):
        if sh.shape_type == 1:
            remove_shape(sh)
    t5 = table_of(sl, '표 5').table
    n = HASHTAGS.index((tag, feat, detail)) + 1
    for r, head in enumerate(['해시태그', '연계기능', '기능설명']):
        set_text(t5.cell(r, 0), [f'{head}{n}'], 14, bold_first=True, align=PP_ALIGN.CENTER)
        for para in t5.cell(r, 0).text_frame.paragraphs:
            for run in para.runs:
                run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    set_text(t5.cell(0, 1), [tag], 13, bold_first=True)
    set_text(t5.cell(1, 1), [feat], 12)
    set_text(t5.cell(2, 1), [' '.join(detail)], 9)
    sh4f = table_of(sl, '표 4')
    t4 = sh4f.table
    t4.rows[1].height = Emu(2900000)
    t4.rows[2].height = Emu(560000)
    for c, (img, step) in enumerate(FLOWS[tag]):
        set_text(t4.cell(1, c), [''], 8)
        left, top, w, h = cell_box(sh4f, 1, c)
        put_picture(sl, f'{SHOTS}/{img}', left, top, w, h)
        set_text(t4.cell(2, c), [f'{c + 1}. {step}'], 10)

# ── 6. 서비스 관련 이미지 ───────────────────────────────
sl = S[5]
sh6 = table_of(sl)
t = sh6.table
set_text(t.cell(0, 1), [''], 8)
set_text(t.cell(1, 1), [''], 8)
left, top, w, h = cell_box(sh6, 0, 1)
put_picture(sl, 'public/logo.png', left, top, w, h, pad=Emu(300000))
left, top, w, h = cell_box(sh6, 1, 1)
# 왼쪽 55% 는 PC 화면(반응형 강조), 오른쪽은 휴대폰 3장 — 같은 코드가 두 폭에서 어떻게 보이는지
pc_w = int(w * 0.55)
put_picture(sl, f'{SHOTS}/detail-desktop-1440.png', left, top, pc_w, h, pad=Emu(40000))
imgs = ['detail-top-390.png', 'compass-plan-390.png', 'michael-390.png']
cw = (w - pc_w) // len(imgs)
for i, img in enumerate(imgs):
    put_picture(sl, f'{SHOTS}/{img}', left + pc_w + cw * i, top, cw, h, pad=Emu(40000))

# ── 7. 한국관광공사 OpenAPI ─────────────────────────────
APIS = [
    ('관광지 집중률 예측 서비스 (TatsCnctrRateService)',
     '성지 소재 시·군·구의 관광지 집중률 예측(tatsCnctrRatedList, 오늘부터 30일)을 받아 성지 상세 「주변 밀집도 상·중·하」와 하루 일정의 「인근 지역이 조용해요 / 보통이에요 / 붐벼요」, 후보 성지의 「인근이 조용해요」 표시에 쓴다. 오버투어리즘 지정과제의 핵심 지표. 메모리에만 잠깐 두고 저장하지 않는다.'),
    ('국문 관광정보 서비스 (KorService2)',
     'locationBasedList2 로 성지 주변 관광지·식당(하루 일정 점심·오후, 성지 상세 「둘러볼 곳」), searchKeyword2·areaBasedList2 로 관광지 검색, ldongCode2 로 집중률 조회에 필요한 시·군·구 코드. 매 화면 진입마다 실시간 호출(staleTime 0), DB·서비스워커에 저장하지 않음.'),
    ('지역 허브 관광지 · 연관 관광지 (LocgoHubTarService1 · TarRlteTarService1)',
     '하루 일정의 오후가 붐빌 예정일 때 같은 시·군·구의 대안 관광지를 고르는 데 쓴다 — 붐비는 곳 대신 근처의 다른 곳으로 공간 분산.'),
    ('두루누비 걷기길 서비스 (Durunubi)',
     'courseList(DNWW)로 성지와 같은 시·군·구의 걷기길을 받아 성지 상세에 「이 근처 걷기길」로 표시. 순례 후 도보 체류를 늘린다.'),
    ('다국어 관광정보 서비스 (SpnService2 · FreService2)',
     '앱 언어가 스페인어·프랑스어일 때 주변 관광지 조회를 해당 언어 서비스로 보낸다(승인된 언어만). 결과가 비면 국문 서비스로 폴백. 영문 서비스(EngService2)는 활용신청 진행.'),
]
t = table_of(S[6]).table
for i, (name, desc) in enumerate(APIS):
    set_text(t.cell(2 * i, 2), [name], 11, bold_first=True)
    set_text(t.cell(2 * i + 1, 2), [desc], 9)

# ── 8. 기타 데이터 ─────────────────────────────────────
OTHERS = [
    (f'자체 구축 성지 DB (holy_sites · holy_site_translations · docent_scripts, {SITES}곳)',
     f'각 교구 홈페이지·굿뉴스 성지 안내·가톨릭 언론의 공개 자료와 현장에서 수집한 주보·안내문을 대조해 직접 쓴 성지 {SITES}곳의 주소·연락처·미사 시간·역사, 성지마다 6개 국어 소개글({SITES}곳 × 6)과 지점별 오디오 가이드 원고(108곳 × 6). 대전교구 성지는 교구 홍보국 제공 자료를 함께 참고. 성지 이야기에 출처 링크 표시. 대표 사진은 직접 촬영·교구 제공분(출처·라이선스 표기). Supabase(PostgreSQL) 저장.'),
    ('한국천주교주소록 (CBCK, catholic_directory 5,918건)',
     '한국천주교중앙협의회 공개 주소록을 수집해 성지 상세·시도 화면의 「주변 성당·공소」(가까운 미사)로 표시. 외국어 화면에서는 이름·주소를 자동 로마자로.'),
    ('순례 기록 (pilgrimage_stamps · 이용자 생성)',
     '이용자가 남긴 방문일·한 줄·사진(최대 3장). 우리 데이터라 분석 가능 — 비수도권 방문 비율 측정, 다음 성지 제안, 집중률 예측 보정(발전계획)의 재료.'),
    ('AI API — Anthropic Claude, Google Gemini',
     '「순례 가이드 미카엘」 답변 생성. 성지 DB 레코드를 컨텍스트로 넣고 범위 밖 질문은 모른다고 답하도록 제한. Supabase Edge Function 에서만 호출(키 비노출).'),
]
sl = S[7]
t = table_of(sl).table
for i, (name, desc) in enumerate(OTHERS):
    if 2 * i + 1 >= len(t.rows):
        break
    set_text(t.cell(2 * i, 2), [name], 11, bold_first=True)
    set_text(t.cell(2 * i + 1, 2), [desc], 9)
for sh in list(sl.shapes):
    if sh.shape_type == 1:
        remove_shape(sh)

# ── 9. 차별성 · 발전계획 ───────────────────────────────
t = table_of(S[8]).table
set_text(t.cell(0, 1), [
    '• 웹 구현 — 반응형(휴대폰 하단 탭·PC 상단 메뉴를 한 코드로, 1024px 자동 전환), PWA 홈 화면 설치, 6개 국어 화면·이야기·가이드, 큰 글자 모드, 접근성(WCAG 2.1 AA) 감사 반영, 카카오·네이버·구글 로그인.',
    f'• 「대체 관광지 추천」이 아니라 「오늘의 하루 일정」+「한적한 날」 — 집중률 예측·주변 관광지를 그날 실시간으로 조합해 붐빔을 피하면서도 그 지역에 머물게 하고, 30일 예측으로 붐비는 날도 피하게 한다. 성지 68%(140/{SITES})가 비수도권이라 분산이 구조적으로 일어난다.',
    f'• 콘텐츠를 직접 만들었다 — 성지 {SITES}곳 소개글과 108곳 오디오 가이드를 6개 국어로, 성지 이야기에 출처 링크. 기존 관광 앱이 다루지 않는 종교 유산 층위.',
    '• AI 가 지어내지 않는다 — 미카엘은 성지 DB 안에서만 답하고 참고한 성지를 밝힌다.',
    '• 함께 만드는 순례 기록 — 다녀온 사람의 한 줄과 사진이 다음 순례자의 안내가 되고, 쌓일수록 분산 효과를 재고 예측을 보정한다.',
    '• 관광공사 데이터 원칙 준수 — TourAPI 응답을 저장하지 않고 매 요청 실시간 호출(ADR 0002, 코드로 강제).',
], 10)
set_text(t.cell(1, 1), [
    '• 예측 보정 — 「그날 붐볐나요?」 실측이 쌓이면 성지별로 관광공사 예측과 실제의 차이를 계산해 밀집도 표시를 보정한다(쓸수록 정확해지는 구조). 전례력(순교자 성월·성지 축일 미사)을 「한적한 날」에 함께 표시. 같은 성지 재방문 기록 허용.',
    '• 공간 분산 측정·유도 — 기록의 성지 → 지역으로 비수도권 방문 비율 대시보드. 기록이 수도권에 몰린 이용자에게 「다음은 갈매못·솔뫼 어떠세요」 개인화 제안. 교구별 완주 배지(성지가 적은 교구부터).',
    '• 지방 체류 — 지방 성지 1박 2일 묶음(2일차 일정)과 대중교통·순례버스 접근 정보(차 없는 시니어를 위해). 오디오 가이드 나머지 98곳 집필, 대표 사진 전 성지 확보(현재 102곳).',
    '• 확장 — 2027 서울 WYD 대비 교구·본당 미사 시간 연동(CBCK 주소록), 시·도 랜딩 페이지로 지자체·교구 협업, Android/iOS 스토어 출시.',
], 10)

prs.save(OUT)
print('saved', OUT, 'slides', len(prs.slides))
