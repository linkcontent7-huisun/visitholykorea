"""
번역 묶음 → 언어별 소개글 파일.  python scripts/docent-translate-apply.py <묶음.json>

묶음 형식 (Claude 가 쓴다):
{
  "language": "en",
  "items": { "<한국어 파일명(.md 제외)>": ["문단1", "문단2", "문단3"], ... }
}
한국어 파일의 머리말(siteId·siteName·sources)을 그대로 쓰고 language·status·writtenBy 만 바꿔
data/docent/소개글/<language>/<같은 파일명>.md 로 쓴다. 문단은 큰따옴표로 감싼다.
이미 있으면 덮어쓴다(감수 반영). 그 뒤 `npm run docent:check` · `npm run docent:load` 를 돌린다.
"""
import io, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'data', 'docent', '소개글')
NAME = {'en': '영어', 'it': '이탈리아어', 'fr': '프랑스어', 'pt': '포르투갈어', 'es': '스페인어'}

bundle = json.load(io.open(sys.argv[1], encoding='utf-8'))
lang = bundle['language']; out_dir = SRC if lang == 'ko' else os.path.join(SRC, lang); os.makedirs(out_dir, exist_ok=True)  # ko 는 원본 자리(다시 쓰기)
n = 0; missing = []
for key, paras in bundle['items'].items():
    src = os.path.join(SRC, key + '.md')
    if not os.path.exists(src): missing.append(key); continue
    text = io.open(src, encoding='utf-8').read()
    head = re.match(r'^---\n(.*?)\n---\n', text, re.S).group(1)
    head = re.sub(r'^language:.*$', f'language: {lang}', head, flags=re.M)
    head = re.sub(r'^status:.*$', 'status: draft', head, flags=re.M)
    head = re.sub(r'^writtenBy:.*$', 'writtenBy: Claude 다시 씀 (검사기 실패분, 2026-09-18)' if lang == 'ko' else f'writtenBy: Claude 번역+감수 ({NAME.get(lang, lang)})', head, flags=re.M)
    body = '\n\n'.join('"' + p.strip().strip('"') + '"' for p in paras)
    io.open(os.path.join(out_dir, key + '.md'), 'w', encoding='utf-8', newline='\n').write(f'---\n{head}\n---\n\n{body}\n')
    n += 1
print(f'{lang}: {n}편 씀 → data/docent/소개글/{lang}/')
for m in missing: print('  한국어 파일 없음:', m)
