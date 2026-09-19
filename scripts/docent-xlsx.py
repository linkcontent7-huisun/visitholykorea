"""
도슨트 소개글 번역 작업지 — 엑셀 내보내기 / 가져오기

  python scripts/docent-xlsx.py export            # data/docent/소개글/*.md → data/docent/번역-작업지.xlsx (한국어 칸 채움)
  python scripts/docent-xlsx.py import <파일.xlsx> # 채워진 en·it·fr·pt·es 칸 → data/docent/소개글/<언어>/<성지>.md

사장님이 AI 에 복붙해 번역하고 다시 붙여 넣는 흐름(2026-09-17). 표 한 장이 곧 진행표다 — 빈 칸 = 아직 안 함.
번호·siteId 는 고정이라 줄이 늘어도 섞이지 않는다. export 를 다시 돌리면 이미 채운 번역 칸은 보존한다.
"""
import glob, io, os, re, sys
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'data', 'docent', '소개글')
XLSX = os.path.join(ROOT, 'data', 'docent', '번역-작업지.xlsx')
LANGS = ['en', 'it', 'fr', 'pt', 'es']
LANG_NAME = {'en': '영어', 'it': '이탈리아어', 'fr': '프랑스어', 'pt': '포르투갈어', 'es': '스페인어'}
HEAD = ['번호', '성지', 'siteId', '상태', '한국어'] + LANGS + ['메모']
PROMPT = ('AI 에 붙여 넣을 문장: "다음 한국어 성지 소개글을 {언어}로 번역해 줘. 큰따옴표로 감싼 3문단 구조를 그대로 유지하고, '
          '문단을 합치거나 늘리지 마. 고유명사(성인·신부 이름, 지명)는 가톨릭 {언어} 표기를 따라." — 번역 결과를 그 언어 칸에 그대로 붙여 넣는다.')


def parse(path):
    text = io.open(path, encoding='utf-8').read()
    m = re.match(r'^---\n(.*?)\n---\n(.*)$', text, re.S)
    head, body = m.group(1), m.group(2).strip()
    meta = dict(re.findall(r'^(\w+):\s*(.+)$', head, re.M))
    sources = re.findall(r'^\s+- label:\s*(.+)$(?:\n\s+url:\s*(.+)$)?', head, re.M)
    return meta, body, head


def export():
    files = sorted(glob.glob(os.path.join(SRC, '*.md')))
    old = {}
    if os.path.exists(XLSX):
        ws0 = load_workbook(XLSX).active
        for row in ws0.iter_rows(min_row=3, values_only=True):
            if row and row[2]:
                old[row[2]] = {l: row[5 + i] for i, l in enumerate(LANGS)} | {'memo': row[10]}
    wb = Workbook(); ws = wb.active; ws.title = '소개글'
    ws.append([PROMPT]); ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(HEAD))
    ws['A1'].alignment = Alignment(wrap_text=True, vertical='top'); ws.row_dimensions[1].height = 48
    ws.append(HEAD)
    for c in ws[2]: c.font = Font(bold=True); c.fill = PatternFill('solid', fgColor='E6EAF3')
    for i, f in enumerate(files, 1):
        meta, body, _ = parse(f)
        sid = meta.get('siteId', '')
        prev = old.get(sid, {})
        ws.append([i, meta.get('siteName', os.path.basename(f)[:-3]), sid, meta.get('status', 'draft'), body]
                  + [prev.get(l) or '' for l in LANGS] + [prev.get('memo') or ''])
    widths = {'A': 5, 'B': 22, 'C': 14, 'D': 9, 'E': 60, 'K': 18}
    for col in range(1, len(HEAD) + 1):
        L = get_column_letter(col); ws.column_dimensions[L].width = widths.get(L, 50)
    for row in ws.iter_rows(min_row=3):
        for c in row: c.alignment = Alignment(wrap_text=True, vertical='top')
        row[3].fill = PatternFill('solid', fgColor='E9EDE3' if row[3].value == 'reviewed' else 'F5EBD7')
    ws.freeze_panes = 'F3'
    wb.save(XLSX)
    print(f'내보냄: {XLSX} — {len(files)}곳 (기존 번역 칸 {sum(1 for v in old.values() if any(v.get(l) for l in LANGS))}줄 보존)')


def import_(path):
    ws = load_workbook(path).active
    n = 0; skipped = []
    for row in ws.iter_rows(min_row=3, values_only=True):
        if not row or not row[2]: continue
        num, name, sid, status, ko = row[:5]
        src_file = next((f for f in glob.glob(os.path.join(SRC, '*.md')) if sid in io.open(f, encoding='utf-8').read()), None)
        if not src_file: skipped.append(f'{name} (한국어 파일 없음)'); continue
        meta, _, head = parse(src_file)
        for i, lang in enumerate(LANGS):
            val = row[5 + i]
            if not val or not str(val).strip(): continue
            body = str(val).strip()
            paras = [p.strip() for p in re.split(r'\n\s*\n|\n', body) if p.strip()]
            if len(paras) != 3 or not all(p.startswith('"') and p.endswith('"') for p in paras):
                skipped.append(f'{name} {lang} — 3문단·큰따옴표 형식이 아님 (문단 {len(paras)})'); continue
            out_dir = os.path.join(SRC, lang); os.makedirs(out_dir, exist_ok=True)
            new_head = re.sub(r'^language:.*$', f'language: {lang}', head, flags=re.M)
            new_head = re.sub(r'^status:.*$', 'status: draft', new_head, flags=re.M)
            new_head = re.sub(r'^writtenBy:.*$', f'writtenBy: 사장님 번역 작업지(AI 번역, {LANG_NAME[lang]})', new_head, flags=re.M)
            io.open(os.path.join(out_dir, os.path.basename(src_file)), 'w', encoding='utf-8', newline='\n').write(
                f'---\n{new_head}\n---\n\n' + '\n\n'.join(paras) + '\n')
            n += 1
    print(f'가져옴: {n}편 → data/docent/소개글/<언어>/')
    for s in skipped: print('  건너뜀:', s)
    print('다음: npm run docent:check → npm run docent:load')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'export'
    if cmd == 'export': export()
    elif cmd == 'import': import_(sys.argv[2] if len(sys.argv) > 2 else XLSX)
    else: print(__doc__)
