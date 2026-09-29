# 근거 페이지 사본 저장 — Codex 는 인터넷이 막혀 있어(T-048 9/28 실측) 사본만 보고 검증한다.
# 사용: python scripts/save-source-page.py <저장폴더> <이름> <url>  →  <이름>.html · <이름>.txt
import sys, os, re, html, urllib.request, ssl
from html.parser import HTMLParser
out, name, url = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE  # 성당 누리집 중 인증서가 낡은 곳이 있다
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
raw = urllib.request.urlopen(req, timeout=30, context=ctx).read()
m = re.search(rb'charset=["\']?([\w-]+)', raw[:3000])
enc = m.group(1).decode() if m else 'utf-8'
try: text = raw.decode(enc)
except Exception: text = raw.decode('utf-8', 'replace')
class P(HTMLParser):
    def __init__(s): super().__init__(); s.buf=[]; s.skip=0
    def handle_starttag(s,t,a):
        if t in ('script','style','noscript'): s.skip+=1
    def handle_endtag(s,t):
        if t in ('script','style','noscript') and s.skip: s.skip-=1
        if t in ('p','div','br','li','tr','h1','h2','h3','h4'): s.buf.append('\n')
    def handle_data(s,d):
        if not s.skip: s.buf.append(d)
p = P(); p.feed(text)
body = re.sub(r'\n\s*\n+', '\n', html.unescape(''.join(p.buf)))
open(os.path.join(out, name+'.html'), 'w', encoding='utf-8').write(text)
open(os.path.join(out, name+'.txt'), 'w', encoding='utf-8').write(f'출처: {url}\n\n' + body.strip())
print(name, len(body), '자')
