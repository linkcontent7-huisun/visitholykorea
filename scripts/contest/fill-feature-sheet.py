# 공모전 「기능 설명서」 공식 양식(pptx)을 채운다. 2026-09-20.
# 사용: PYTHONIOENCODING=utf-8 python scripts/contest/fill-feature-sheet.py <양식.pptx> <스크린샷 폴더> <출력.pptx>
# 양식은 9장 고정. 5장(기능 흐름도)은 해시태그 수만큼 복제한다. 안내문 상자(빨간 박스)는 지운다.
import copy, sys, io
from pptx import Presentation
from pptx.util import Pt, Emu
from pptx.dml.color import RGBColor
from PIL import Image

SRC, SHOTS, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
BLACK = RGBColor(0, 0, 0)
SITES = '206'  # DB 실측 2026-09-19


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
set_text(t.cell(1, 1), ['VisitHolyKorea (한국 천주교 성지순례)'], 18)

# ── 2. 서비스 소개 ───────────────────────────────────────
t = table_of(S[1]).table
rows = [
    ['VisitHolyKorea (visitholykorea.com)'],
    ['웹 서비스 (PWA · 홈 화면 설치 지원) — 같은 코드로 Android/iOS 앱(Capacitor) 빌드'],
    ['① 붐비는 명소 대신 조용한 하루를 원하는 자유여행객·시니어(이용자 조사 응답자 85%가 50대 이상)',
     '② 한국 천주교 성지 순례객과 2027 서울 세계청년대회(WYD) 앞뒤로 방한하는 외국인 순례객(6개 국어)',
     '③ 종교와 무관하게 걷기·사색·역사 여행에 관심 있는 사람'],
    [f'전국 천주교 성지 {SITES}곳을 "오늘 마음"에 맞춰 골라 주고, 한국관광공사 TourAPI 실시간 데이터(집중률·축제·주변 관광지·걷기길)로 '
     '하루 일정을 짜 주며, 현장에서는 6개 국어 오디오 도슨트로 안내하는 순례 여행 서비스'],
    ['지정과제 2번 — 유명 관광지 쏠림(오버투어리즘) 문제 해결'],
    [f'전국에 흩어진 성지 {SITES}곳은 대부분 조용하고 도심 명소·축제와 가까운 곳이 많다. '
     '이 자원을 관광공사 실시간 데이터와 엮으면 "붐비는 곳을 피해 가는 대안"이 아니라 "붐비는 곳 옆에서 쉬어 가는 하루"를 제안할 수 있다. '
     '성지는 관광객을 흡수할 여유가 크고, 순례라는 목적이 체류 시간을 늘리므로 분산 효과가 지속된다고 판단해 2번을 골랐다.'],
]
for i, lines in enumerate(rows):
    set_text(t.cell(i, 1), lines, 13)

# ── 3. 기획 방향 · 해시태그 목록 ────────────────────────
t = table_of(S[2]).table
set_text(t.cell(0, 1), [
    '1) 관광공사 「관광지 집중률 예측」으로 성지 인근 시·군·구의 붐빔을 그날 기준으로 보여 주고, 사용자의 마음·출발지·시간에 맞는 조용한 성지를 고른다.',
    '2) 고른 성지 하나를 축으로 오전 성지 → 점심(주변 식당) → 오후(주변 관광지·걷기길)의 하루 일정을 TourAPI 실시간 조회로 짠다. 응답은 저장하지 않는다.',
    '3) 인근 혼잡도는 집중률 예측 0.7 + 오늘 열리는 축제(searchFestival2) 0.3 으로 조용·보통·붐빔 3단계로만 보여 준다 — 숫자 대신 문장으로, 50대 이상도 한눈에 읽히게.',
    '4) 현장 체류의 질을 높이는 콘텐츠 — 성지마다 직접 쓴 소개글과 지점별 오디오 도슨트(6개 국어), 성지 DB 안에서만 답하는 AI 가이드.',
    '5) 박해사·인물을 축으로 성지를 잇는 순례 코스로 1곳 방문을 여러 곳·여러 날로 늘린다.',
], 13)
set_text(t.cell(1, 1), [
    '#오늘의성지일정  #오디오도슨트  #순례가이드미카엘  #순례코스',
], 16, bold_first=True)

# ── 4. 해시태그 연계 표 ─────────────────────────────────
HASHTAGS = [
    ('#오늘의성지일정', '마음 상태로 고르는 하루 일정',
     ['6개 질문(마음 · 출발지 · 시간)에 답하면 후보 성지 3곳을 보여 주고, 하나를 고르면 오전 성지 → 점심 → 오후 관광지의 하루 일정을 짠다.',
      'TourAPI: 집중률 예측(TatsCnctrRateService) + 오늘 축제로 "인근 지역이 조용해요/보통이에요/붐벼요" 표시, locationBasedList2 로 성지 주변 식당·관광지 실시간 조회.',
      '시간 답(반나절·하루·1박2일)이 출발지 반경(30km·80km·전국)이 되어 이동이 체류보다 길어지지 않게 한다.']),
    ('#오디오도슨트', '성지 소개글 · 지점별 오디오 가이드',
     [f'성지 {SITES}곳마다 3문단 소개글(순교·신앙 역사 / 위치·지리 / 건축)을 6개 국어(한·영·서·이·프·포)로 직접 집필해 DB 에 두었다.',
      '현장 지점 원고(여는 말 → 지점 3~6곳 → 맺음말)는 108곳 작성(2026-09-20 기준), 번역 진행 중. 기기 TTS 로 읽어 주며 속도 조절·챕터 이동이 된다.',
      '모든 원고에 출처 URL 을 붙이고, 관광공사 두루누비 걷기길·무장애 정보 등 주변 관광 콘텐츠와 나란히 보여 준다.']),
    ('#순례가이드미카엘', '성지 DB 범위 안에서만 답하는 AI 가이드',
     ['질문과 관련된 성지 레코드(주소·전화·미사·설명)를 찾아 컨텍스트로 넣고 "자료에 없으면 모른다고 답하라"를 시스템 프롬프트에 고정했다.',
      'Claude(Anthropic) 우선, 실패 시 Gemini 로 넘어가는 이중 구조. 사용 가능한 Gemini 모델 목록은 GitHub Actions 가 매일 갱신한다.',
      '답변에 「참고한 성지」를 표시해 출처를 드러내고, 키는 Supabase Edge Function 에만 두어 브라우저에 노출되지 않는다.']),
    ('#순례코스', '박해사·인물 축 순례 코스',
     ['「내포, 신앙의 못자리 길」 「내포 도보 순례길 ① 솔뫼에서 해미까지(40km)」처럼 사건·인물로 성지 4~6곳을 잇는 코스를 제공한다.',
      '코스와 성지 상세에서 관광공사 두루누비(Durunubi) 걷기길과 무장애 관광정보(KorWithService2)를 실시간으로 함께 보여 준다.',
      '코스 상세에서 각 성지 상세(소개글·도슨트·주변 정보)로 바로 이어진다.']),
]
sh4 = table_of(S[3])
t = sh4.table
# 행을 해시태그 수만큼 늘린다 — python-pptx 에 행 추가가 없어 마지막 행 XML 을 복사한다
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
        ('home-390.png', '홈에서 「오늘의 성지 일정」을 누른다'),
        ('compass-q1-390.png', '지금 마음 · 출발지 · 낼 수 있는 시간을 고른다'),
        ('compass-result-390.png', '반경 안 후보 성지 3곳 — 가까운 곳·소개가 자세한 곳 표시'),
        ('compass-plan-390.png', '오전 성지 → 점심 → 오후 관광지. 집중률로 붐빔 표시'),
    ],
    '#오디오도슨트': [
        ('routes-390.png', '코스 또는 성지 찾기에서 성지를 고른다'),
        ('detail-top-390.png', '「성지 이야기」 3문단 소개글 (6개 국어)'),
        ('detail-docent-390.png', '「오디오 가이드」 여는 말 → 지점 → 맺음말, 속도 조절'),
        ('detail-docent-390.png', '지점마다 「눈여겨보기」와 출처. 상단 KO 버튼으로 언어 전환'),
    ],
    '#순례가이드미카엘': [
        ('home-390.png', '어느 화면에서나 상단 「미카엘」 버튼'),
        ('michael-390.png', '질문 — 예: 공세리 성지 위치와 전화번호'),
        ('michael-en-390.png', '외국어 질문에도 같은 DB 근거로 답한다 (영어 예)'),
        ('michael-mass-390.png', 'DB 에 없는 정보(미사 시간)는 모른다고 답하고 사무실 전화를 안내'),
    ],
    '#순례코스': [
        ('home-390.png', '홈 「순례 코스」'),
        ('routes-390.png', '사건·인물 축 코스 목록 (경유 성지 수·거리·시간)'),
        ('detail-top-390.png', '경유 성지 상세 — 사진·태그·인근 붐빔'),
        ('map-390.png', '지도에서 성지 위치와 주변 걷기길·무장애 정보 확인'),
    ],
}
flow_src = S[4]
flow_slides = [flow_src]
for _ in range(len(HASHTAGS) - 1):
    flow_slides.append(duplicate_slide(prs, flow_src))
# 복제한 슬라이드는 맨 뒤에 붙으므로 5장 뒤로 옮긴다
for k, sl in enumerate(flow_slides[1:], 1):
    move_slide(prs, sl, 4 + k)

for sl, (tag, feat, detail) in zip(flow_slides, HASHTAGS):
    for sh in list(sl.shapes):
        if sh.shape_type == 1:
            remove_shape(sh)
    t5 = table_of(sl, '표 5').table
    set_text(t5.cell(0, 1), [tag], 13, bold_first=True)
    set_text(t5.cell(1, 1), [feat], 12)
    set_text(t5.cell(2, 1), [' '.join(detail)], 9)
    sh4f = table_of(sl, '표 4')
    t4 = sh4f.table
    # 사진 칸을 키우고 설명 칸을 줄인다 — 휴대폰 화면이 읽히게
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
imgs = ['home-390.png', 'compass-plan-390.png', 'detail-docent-390.png', 'michael-390.png', 'routes-390.png']
cw = w // len(imgs)
for i, img in enumerate(imgs):
    put_picture(sl, f'{SHOTS}/{img}', left + cw * i, top, cw, h, pad=Emu(40000))

# ── 7. 한국관광공사 OpenAPI ─────────────────────────────
APIS = [
    ('국문 관광정보 서비스 (KorService2)',
     'locationBasedList2 로 성지 주변 관광지·식당(하루 일정 점심·오후, 성지 상세 「주변 관광」), searchFestival2 로 오늘 진행 중인 전국 축제(인근 혼잡도 산식의 30%), '
     'searchKeyword2·areaBasedList2 로 관광지 검색, ldongCode2 로 집중률 조회에 필요한 시·군·구 코드. 매 화면 진입마다 실시간 호출(staleTime 0), DB·서비스워커에 저장하지 않음.'),
    ('관광지 집중률 예측 서비스 (TatsCnctrRateService)',
     '성지 소재 시·군·구의 오늘 집중률(tatsCnctrRatedList)을 받아(혼잡도 산식의 70%) 성지 상세·하루 일정에 「인근 지역이 조용해요 / 보통이에요 / 붐벼요」로 표시. 오버투어리즘 지정과제의 핵심 지표. 코드는 하루, 집중률은 6시간 메모리에만 둔다.'),
    ('두루누비 걷기길 서비스 (Durunubi)',
     'courseList(DNWW)로 성지와 같은 시·군·구의 걷기길을 받아 성지 상세·순례 코스 상세에 「근처 걷기길」로 표시. 순례 후 도보 체류를 늘린다.'),
    ('무장애 관광정보 서비스 (KorWithService2)',
     'locationBasedList 로 성지 반경 5km 무장애 관광지를 받아 성지 상세에 표시. 시니어·휠체어 순례객(주 이용층)을 위한 동선 정보.'),
    ('다국어 관광정보 서비스 (FreService2 · SpnService2)',
     '앱 언어가 프랑스어·스페인어일 때 주변 관광지 조회를 해당 언어 서비스로 보낸다(승인된 언어만). 영어 등 미승인 언어는 국문 서비스로 안전하게 폴백.'),
]
t = table_of(S[6]).table
for i, (name, desc) in enumerate(APIS):
    set_text(t.cell(2 * i, 2), [name], 11, bold_first=True)
    set_text(t.cell(2 * i + 1, 2), [desc], 9)

# ── 8. 기타 데이터 ─────────────────────────────────────
OTHERS = [
    (f'자체 구축 성지 DB (holy_sites · docent_scripts, {SITES}곳)',
     f'교구 홈페이지·굿뉴스 성지 안내·현장 취재로 직접 수집한 성지 {SITES}곳의 주소·연락처·미사 시간·역사와, 성지마다 6개 국어 소개글 + 지점별 오디오 도슨트 원고. 대표 사진은 직접 촬영·교구 홍보국 제공분(출처·라이선스 표기). Supabase(PostgreSQL) 저장.'),
    ('한국천주교주소록 (CBCK, catholic_directory 5,918건)',
     '한국천주교중앙협의회 공개 주소록을 수집해 본당·피정의집·수도회 정보로 확장(주변 미사·피정 안내 예정).'),
    ('AI API — Anthropic Claude, Google Gemini',
     '「순례 가이드 미카엘」 답변 생성. 성지 DB 레코드를 컨텍스트로 넣고 범위 밖 질문은 모른다고 답하도록 제한. Supabase Edge Function 에서만 호출(키 비노출).'),
]
sl = S[7]
t = table_of(sl).table
for i, (name, desc) in enumerate(OTHERS):
    set_text(t.cell(2 * i, 2), [name], 11, bold_first=True)
    set_text(t.cell(2 * i + 1, 2), [desc], 9)
for sh in list(sl.shapes):
    if sh.shape_type == 1:
        remove_shape(sh)

# ── 9. 차별성 · 발전계획 ───────────────────────────────
t = table_of(S[8]).table
set_text(t.cell(0, 1), [
    '• 「대체 관광지 추천」이 아니라 「오늘의 하루 일정」 — 집중률·오늘 축제·주변 관광지를 그날 실시간으로 조합해 붐빔을 피하면서도 붐비는 곳 옆에 머물게 한다.',
    f'• 콘텐츠를 직접 만들었다 — 성지 {SITES}곳 소개글 6개 국어, 지점별 오디오 도슨트 원고, 출처 URL 을 모든 원고에 표기. 기존 관광 앱이 다루지 않는 종교 유산 층위.',
    '• AI 가 지어내지 않는다 — 미카엘은 성지 DB 안에서만 답하고 참고한 성지를 밝힌다. 종교·역사 정보의 신뢰가 서비스의 생명이라는 판단.',
    '• 시니어·외국인 접근성 — 큰 글자 모드, 6개 국어 UI, 기기 TTS, 홈 화면 설치(PWA), 카카오·네이버·구글 간편 로그인.',
    '• 관광공사 데이터 원칙 준수 — TourAPI 응답을 DB·캐시에 저장하지 않고 매 요청 실시간 호출(ADR 0002 로 문서화, 코드로 강제).',
], 11)
set_text(t.cell(1, 1), [
    '• 2026 Q4: 지점 원고 6개 국어 완성(현재 108곳 작성·번역 진행), 대표 사진 전 성지 확보(현재 102곳), 1박2일 일정(2일차) 추가.',
    '• 2027 상반기: 2027 서울 WYD 대비 — 교구·본당 미사 시간 연동(CBCK 주소록), 순례 여권·스탬프 복원, 단체 순례 일정 공유.',
    '• 지자체·교구 연계: 시·도 랜딩 페이지(/region/대전 등)로 지역 관광과 협업, 대전교구와 진행 중인 사진·자료 제공 모델을 다른 교구로 확장.',
    '• Android/iOS 스토어 출시(Capacitor 빌드), 타 종교·해외 성지로 확장 가능한 데이터 모델.',
], 11)

prs.save(OUT)
print('saved', OUT, 'slides', len(prs.slides))
