# 대전교구 홍보국 NAS(시놀로지) 공유 폴더 내려받기 — T-025 사진 정리용.
# 쿠키는 사장님이 브라우저에서 잠금을 푼 세션(sharing_sid)을 $TMP/nas-cookie.txt 에 둔 것.
# 사진·문서 → 저장소 옆 폴더(.gitignore 됨), 영상 → USB. RAW(nef/dng)·zip 은 받지 않는다(공간).
# 사용: python scripts/nas-download.py list | go
import io, os, sys, json, time, urllib.request, urllib.parse

BASE = 'https://hong-data.djcatholic.or.kr:5001/sharing/webapi/entry.cgi'
SHARE = 'qoc2mpAAk'
ROOT = '/02-교구성지사진'
PHOTO = os.path.join(r'C:\Users\noh hui sun\visitholykorea app', '대전교구사진-크란시아자매님', '원본')
VIDEO = os.path.join(r'F:\TOSHIBA', '대전교구성지-영상')
IMG = {'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tif', 'tiff', 'webp', 'hwp', 'hwpx', 'pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'mp3'}
VID = {'mp4', 'mov', 'avi', 'mts', 'm4v'}
COOKIE = io.open(os.path.join(os.environ['TMP'], 'nas-cookie.txt'), encoding='utf-8').read().strip()
H = {'Cookie': COOKIE, 'User-Agent': 'Mozilla/5.0', 'Referer': f'https://hong-data.djcatholic.or.kr:5001/sharing/{SHARE}'}


def post(o):
    data = urllib.parse.urlencode(o).encode('utf-8')
    with urllib.request.urlopen(urllib.request.Request(BASE, data=data, headers=H), timeout=60) as r:
        return json.load(r)


def ls(path):
    r = post({'api': 'SYNO.FolderSharing.List', 'method': 'list', 'version': '2', 'offset': '0', 'limit': '2000',
              'action': '"enum"', 'additional': '["size"]', 'filetype': '"all"',
              'folder_path': json.dumps(path, ensure_ascii=False), '_sharing_id': f'"{SHARE}"'})
    if not r.get('success'):
        raise SystemExit(f'list 실패 {path}: {r}')
    return r['data']['files']


def walk(path):
    for f in ls(path):
        p = f.get('path') or path + '/' + f['name']
        if f['isdir']:
            yield from walk(p)
        else:
            yield p, f['additional']['size']


def dest_of(p):
    e = p.rsplit('.', 1)[-1].lower()
    return PHOTO if e in IMG else (VIDEO if e in VID else None)


mode = sys.argv[1] if len(sys.argv) > 1 else 'list'
files = list(walk(ROOT))
print(f'파일 {len(files)}개 · {sum(s for _, s in files) / 2**30:.2f} GB', flush=True)
if mode == 'list':
    for p, s in files:
        print(f'{s / 2**20:8.1f}MB  {p}')
    sys.exit()

targets = [(p, s) for p, s in files if dest_of(p)]
# 대표사진 후보 폴더(사진 없는 성지)를 먼저, 성거산(117GB)과 영상은 마지막에 받는다
FIRST = ('성지대표사진', '신평원머리', '진산', '도앙골', '작은재줄무덤', '황무실', '정산성지', '배나드리', '지석리')
def prio(t):
    folder = t[0][len(ROOT) + 1:].split('/')[0]
    return (0 if folder in FIRST else 2 if folder == '성거산' else 1, dest_of(t[0]) == VIDEO, t[0])
targets.sort(key=prio)
print(f'대상 {len(targets)}개 · {sum(s for _, s in targets) / 2**30:.1f} GB', flush=True)
done = skipped = failed = 0
for i, (p, s) in enumerate(targets, 1):
    out = os.path.join(dest_of(p), *p[len(ROOT) + 1:].split('/'))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    if os.path.exists(out) and os.path.getsize(out) == s:
        skipped += 1
        continue
    q = urllib.parse.urlencode({'api': 'SYNO.FolderSharing.Download', 'method': 'download', 'version': '2',
                                'mode': '"download"', 'path': json.dumps([p], ensure_ascii=False), '_sharing_id': f'"{SHARE}"'})
    ok = False
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(BASE + '?' + q, headers=H), timeout=300) as r, open(out + '.part', 'wb') as w:
                while True:
                    b = r.read(1 << 20)
                    if not b:
                        break
                    w.write(b)
            got = os.path.getsize(out + '.part')
            if got != s:
                raise IOError(f'크기 불일치 {got}!={s}')
            os.replace(out + '.part', out)
            ok = True
            break
        except Exception as e:
            print(f'재시도 {attempt + 1}: {p} — {e}', flush=True)
            time.sleep(5)
    done += ok
    failed += (not ok)
    if i % 25 == 0:
        print(f'... {i}/{len(targets)} (완료 {done} · 있음 {skipped} · 실패 {failed})', flush=True)
print(f'끝: 대상 {len(targets)} · 완료 {done} · 건너뜀(이미 있음) {skipped} · 실패 {failed}')
