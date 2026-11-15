import http.server, os, re, sys
OUT = sys.argv[1]
class H(http.server.BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()
    def do_POST(self):
        name = re.sub(r'[^a-zA-Z0-9_.-]', '', self.path.strip('/')) or 'x.bin'
        n = int(self.headers.get('Content-Length', 0))
        with open(os.path.join(OUT, name), 'wb') as f:
            left = n
            while left > 0:
                b = self.rfile.read(min(left, 1 << 20))
                if not b: break
                f.write(b); left -= len(b)
        self.send_response(200); self._cors(); self.end_headers()
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', 5299), H).serve_forever()
