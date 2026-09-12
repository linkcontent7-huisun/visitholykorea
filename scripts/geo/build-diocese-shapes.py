"""시군구 GeoJSON → 교구 15개 폴리곤 → 앱 조망도 좌표계의 SVG path.
출력: src/features/map/data/diocese-shapes.json  [{diocese, path, label:[x,y]}]
"""
import io, json, math, os, sys
from shapely.geometry import shape, MultiPolygon, Polygon
from shapely.ops import unary_union

# 입력: 통계청 2018 시군구 GeoJSON (southkorea/southkorea-maps kostat/2018/json/skorea-municipalities-2018-geo.json)
# 을 이 파일 옆에 sigungu.json 으로 두고 실행한다. 18MB 라 저장소에는 넣지 않는다.
S = os.path.dirname(os.path.abspath(__file__))
OUT = r"C:\Users\noh hui sun\visitholykorea app\src\features\map\data\diocese-shapes.json"

# 앱의 projection.ts 와 같은 값
MIN_LAT, MAX_LAT, MIN_LNG, MAX_LNG = 32.9, 38.7, 124.5, 130.0
LNG_SCALE = math.cos(((MIN_LAT + MAX_LAT) / 2) * math.pi / 180)
LAT_SPAN = MAX_LAT - MIN_LAT
LNG_SPAN = (MAX_LNG - MIN_LNG) * LNG_SCALE
ASPECT = LNG_SPAN / LAT_SPAN
W = 1000; H = round(1000 / ASPECT)
def proj(lng, lat):
    return ((lng - MIN_LNG) * LNG_SCALE * W / LNG_SPAN, (MAX_LAT - lat) * H / LAT_SPAN)

# 교구 배정 — 시도 코드 + 시군구 이름 (2018 행정구역 기준, 교구 관할은 천주교 주소록 기준)
UIJEONGBU = {"의정부시","고양시덕양구","고양시일산동구","고양시일산서구","파주시","양주시","동두천시","포천시","연천군","구리시","남양주시","가평군"}
INCHEON_GG = {"부천시","김포시"}
CHUNCHEON = {"춘천시","철원군","화천군","양구군","인제군","홍천군","속초시","고성군","양양군"}
ANDONG = {"안동시","영주시","상주시","문경시","의성군","청송군","영양군","영덕군","예천군","봉화군","울진군"}
BUSAN_GN = {"김해시","양산시","밀양시"}

def diocese_of(code, name):
    p = code[:2]
    if p == "11": return "서울"
    if p in ("21", "26"): return "부산"
    if p == "22": return "대구"
    if p == "23": return "인천"
    if p in ("24", "36"): return "광주"
    if p in ("25", "29", "34"): return "대전"
    if p == "31":
        if name in UIJEONGBU: return "의정부"
        if name in INCHEON_GG: return "인천"
        return "수원"
    if p == "32": return "춘천" if name in CHUNCHEON else "원주"
    if p == "33": return "청주"
    if p == "35": return "전주"
    if p == "37": return "안동" if name in ANDONG else "대구"
    if p == "38": return "부산" if name in BUSAN_GN else "마산"
    if p == "39": return "제주"
    raise ValueError((code, name))

d = json.load(io.open(os.path.join(S, "sigungu.json"), encoding="utf-8"))
groups = {}
for f in d["features"]:
    p = f["properties"]
    groups.setdefault(diocese_of(p["code"], p["name"]), []).append(shape(f["geometry"]).buffer(0))

MIN_ISLAND = 0.0015  # deg² — 작은 섬은 지운다 (강화·거제·진도·울릉·제주는 남는다)
result = []
for name, geoms in groups.items():
    u = unary_union(geoms).buffer(0.002).buffer(-0.002)   # 시군구 사이 미세 틈 메움
    u = u.simplify(0.006, preserve_topology=True)
    polys = list(u.geoms) if isinstance(u, MultiPolygon) else [u]
    polys = [pg for pg in polys if pg.area >= MIN_ISLAND]
    parts = []
    for pg in polys:
        rings = [pg.exterior] + list(pg.interiors)
        for ring in rings:
            pts = [proj(x, y) for x, y in ring.coords]
            parts.append("M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z")
    biggest = max(polys, key=lambda g: g.area)
    c = biggest.representative_point()
    lx, ly = proj(c.x, c.y)
    result.append({"diocese": name, "path": "".join(parts), "label": [round(lx), round(ly)]})

order = ["서울","인천","의정부","수원","춘천","원주","대전","청주","전주","광주","대구","안동","마산","부산","제주"]
result.sort(key=lambda r: order.index(r["diocese"]))
os.makedirs(os.path.dirname(OUT), exist_ok=True)
io.open(OUT, "w", encoding="utf-8", newline="\n").write(json.dumps(result, ensure_ascii=False))
print("dioceses", len(result), "bytes", os.path.getsize(OUT), "view", W, H)
for r in result: print(r["diocese"], len(r["path"]), r["label"])
