"""세례명 카드 2판 전체 찍기 — 1단계 한국어·영어 (지시서 9호, 2026-11-25 사장님 승낙).

카드 234종 = 옛 150(세례명 43 · 한국 성인 76 · 흔한 세례명 31) + 새 84(names_new.tsv).
틀은 gen_cards_v2.card(가운데 «이름과 성인» 칸 + 맨 아래 «참고:» 출처). 성인·성지 칸 값은 1판과 같은 자료에서 다시 만든다:
  한국어 세례명·한국 성인 — data/research/saints103-cbck.tsv(주교회의) + saints103-merged.tsv(굿뉴스 구분)  ← gen_cards.py 와 같은 규칙
  영어 — gen_cards_en.load_groups / name_tail 그대로
  흔한 세례명 — gen_cards_plain.PLAIN
뜻 문장: 세례명·흔한 세례명은 names_old_meaning.tsv, 새 이름은 names_new.tsv(둘 다 Codex 검증 반영, 근거 docs/40-knowledge/08-세례명뜻/),
한국 성인 76분은 103위 표의 생몰년으로 만든 같은 꼴 문장(1984년 시성·9월 20일 기념은 103위 모두에 같은 사실).

실행: KR_FONT_DIR=~/visitholykorea-integration/기타/글꼴 python3 gen_cards_v2_all.py
      → public/baptism-cards/{ko,en}/{slug}.webp , public/baptism-cards/og/{ko,en}/{slug}.jpg
      (es·fr·pt·it 는 2단계 — 그 전까지 옛 카드, 새 84개는 영어 카드로 대신 보인다)
"""

import csv
import os
import re
from collections import defaultdict

from PIL import Image

from gen_cards_en import NOT_SITE as NOT_SITE_EN, SITE_EN, load_groups, name_tail, short_tail
from gen_cards_plain import PLAIN
from gen_cards_v2 import card
from make_card import HERE, ROOT, order_key, personal, short_name

KO_WAIT, EN_WAIT = ["한국의 성지가 기다립니다"], ["Korea’s holy sites await you"]
NOT_SITE = {"옥사", "포청옥", "형조전옥", ""}
SRC_NAME = ("굿뉴스 성인 정보 · 바티칸 뉴스 · 위키백과", "Goodnews saints · Vatican News · Wikipedia")
SRC_KSAINT_NAME = ("주교회의 103위 성인 · 굿뉴스 · 바티칸 뉴스", "CBCK 103 Martyr Saints · Goodnews · Vatican News")
SRC_SAINT = ("주교회의 103위 성인 · 굿뉴스 성인 정보", "CBCK 103 Martyr Saints · Goodnews saints")
# 김대건 신부는 사장님이 시안에서 본 문장을 그대로 쓴다(Codex 검증 반영본)
SAINT_OVERRIDE = {
    "김대건 안드레아": ("한국인 첫 사제. 1846년 새남터에서 순교했다. 한국 교회는 7월 5일에 기념한다.",
                    "Korea’s first native priest, martyred at Saenamteo in 1846. Honoured in Korea on 5 July."),
}


def tsv(name: str) -> list[dict]:
    return list(csv.DictReader(open(HERE / name, encoding="utf-8"), delimiter="\t"))


def app_rows() -> list[tuple[str, str, str, str]]:
    """앱 목록(baptism-names.ts)의 (slug, kind, ko, en) — 파일 이름·표기의 기준"""
    text = (ROOT / "src/features/baptism-card/data/baptism-names.ts").read_text(encoding="utf-8")
    return re.findall(r"slug: '([^']+)', kind: '(\w+)', names: \{ ko: '([^']*)', en: '([^']*)'", text)


def saint_meaning(life: str) -> tuple[str, str]:
    born, died = (life.split("-") + ["?"])[:2]
    born_ko = "태어난 해 모름" if "?" in born else f"{born}년 출생"
    born_en = "Year of birth unknown" if "?" in born else f"Born {born}"
    return (f"{born_ko}, {died}년 순교. 1984년 시성된 한국 순교 성인 103위 가운데 한 분으로, 9월 20일에 함께 기념한다.",
            f"{born_en}, martyred {died}. One of the 103 Korean Martyr Saints canonised in 1984, honoured together on 20 September.")


def main() -> None:
    rows = app_rows()
    by_ko = {ko: (slug, kind, en) for slug, kind, ko, en in rows}
    old_meaning = {r["ko"]: r for r in tsv("names_old_meaning.tsv")}
    new = tsv("names_new.tsv")

    # 한국어 103위 (gen_cards.py 와 같은 규칙)
    merged = list(csv.reader(open(ROOT / "data/research/saints103-merged.tsv", encoding="utf-8"), delimiter="\t"))[1:]
    kind_of = {m[0]: m[2] for m in merged}
    life_of = {m[0]: m[7] for m in merged}
    by_bapt = defaultdict(list)
    people = []
    for no, name, status, date, *rest in list(csv.reader(open(ROOT / "data/research/saints103-cbck.tsv", encoding="utf-8"), delimiter="\t"))[1:]:
        site = rest[0] if rest else ""
        main_ = name.split("(")[0].strip()
        item = (int(no), main_, date, site, kind_of[no], status, life_of[no])
        by_bapt[main_.split()[-1]].append(item)
        if personal(main_, name):
            people.append(item)
    en_groups = load_groups()

    jobs = []  # (slug, ko_args, en_args)

    def died_ko(date, site):
        return f"{date[:4]}년 {site if site not in NOT_SITE else '옥중'}에서 순교"

    for bapt, items in by_bapt.items():
        items.sort(key=lambda x: order_key(x[1], x[2], x[0]))
        slug, kind, en_name = by_ko[bapt]
        assert kind == "name", bapt
        n = len(items)
        full = [f"{k} {m}" for _, m, _, _, k, _, _ in items]
        if n == 1:
            mid_ko = dict(lines=full, note=died_ko(items[0][2], items[0][3]))
        elif n <= 3:
            mid_ko = dict(lines=full, note=f"같은 세례명 성인 {n}분")
        else:
            mid_ko = dict(lines=[short_name(m) for _, m, _, _, _, _, _ in items], note=f"같은 세례명 한국 성인 {n}분")
        sites_ko = []
        for it in items:
            if it[3] not in NOT_SITE and it[3] not in sites_ko:
                sites_ko.append(it[3])
        eg = en_groups[bapt]
        full_en = [f"St. {en_name} {name_tail(i['main'], en_name)}".strip() for i in eg]
        if n == 1:
            mid_en = dict(lines=full_en, note=f"Martyred in {eg[0]['date'][:4]} " + (SITE_EN[eg[0]['site']][1] if eg[0]['site'] not in NOT_SITE_EN else "in prison"))
        elif n <= 3:
            mid_en = dict(lines=full_en, note=f"{n} saints share this name")
        else:
            mid_en = dict(lines=[short_tail(i["main"], en_name) for i in eg], note=f"{n} Korean saints share this name")
        sites_en = []
        for i in eg:
            if i["site"] not in NOT_SITE_EN and SITE_EN[i["site"]][0] not in sites_en:
                sites_en.append(SITE_EN[i["site"]][0])
        m = old_meaning[bapt]
        jobs.append((slug, (bapt, mid_ko, sites_ko[:3] or ["정리 중"], m["meaning_ko"], SRC_KSAINT_NAME[0]),
                     (en_name, mid_en, sites_en[:3] or ["Being researched"], m["meaning_en"], SRC_KSAINT_NAME[1])))

        # 한국 성인 개인 카드
        for it, ei in zip(items, eg):
            no, m_, date, site, k, status, life = it
            if not any(p[0] == no for p in people):
                continue
            pslug, pkind, pen = by_ko[m_]
            assert pkind == "saint", m_
            mk, me = SAINT_OVERRIDE.get(m_) or saint_meaning(life)
            site_en = [SITE_EN[ei["site"]][0]] if ei["site"] not in NOT_SITE_EN else ["Being researched"]
            jobs.append((pslug,
                         (m_, dict(lines=[f"{k} {m_}"], note=f"{status} · {died_ko(date, site)}"),
                          [site] if site not in NOT_SITE else ["정리 중"], mk, SRC_SAINT[0]),
                         (pen, dict(lines=[f"St. {pen}"], note=f"Martyred in {ei['date'][:4]} " + (SITE_EN[ei['site']][1] if ei['site'] not in NOT_SITE_EN else "in prison")),
                          site_en, me, SRC_SAINT[1])))

    def forms(row: list[str], own: str) -> list[str]:
        out = []
        for v in row:
            if v != own and v not in out:
                out.append(v)
        return out

    for row in PLAIN:
        ko, en = row[0], row[1]
        m = old_meaning[ko]
        jobs.append((en, (ko, dict(lines=forms(list(row[1:]), ""), note="세계 곳곳에서 불리는 같은 이름", latin=True), KO_WAIT, m["meaning_ko"], SRC_NAME[0]),
                     (en, dict(lines=forms(list(row[1:]), en), note="The same name around the world"), EN_WAIT, m["meaning_en"], SRC_NAME[1])))

    for r in new:
        langs = [r["en"], r["es"], r["fr"], r["pt"], r["it"]]
        jobs.append((r["slug"], (r["ko"], dict(lines=forms(langs, ""), note="세계 곳곳에서 불리는 같은 이름", latin=True), KO_WAIT, r["meaning_ko"], SRC_NAME[0]),
                     (r["en"], dict(lines=forms(langs, r["en"]), note="The same name around the world"), EN_WAIT, r["meaning_en"], SRC_NAME[1])))

    # 같은 이름·다른 축일(사장님 2026-11-25): feasts.tsv 에 있는 이름은 뜻 문장 대신 «축일 · 성인» 줄(축일순, 최대 4분)
    MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    feasts = defaultdict(list)
    for r in tsv("feasts.tsv"):
        feasts[r["ko"]].append(r)
    def feast_lines(ko: str) -> tuple[list[str], list[str]]:
        rows = sorted(feasts[ko], key=lambda r: r["feast"])
        kos = [f"{int(r['feast'][:2])}/{int(r['feast'][3:])} · {r['saint_ko']}" for r in rows]
        ens = [f"{int(r['feast'][3:])} {MON[int(r['feast'][:2]) - 1]} · {r['saint_en']}" for r in rows]
        if len(rows) > 4:  # 지금 표에는 없지만 다섯 분 이상이면 넷 + «그 밖에도 있음»
            kos, ens = kos[:3] + ["그 밖에도 같은 이름의 성인이 있다"], ens[:3] + ["…and other saints of this name"]
        return kos, ens
    for i, (slug, ko, en) in enumerate(jobs):
        if ko[0] in feasts:
            fk, fe = feast_lines(ko[0])
            jobs[i] = (slug, ko[:3] + (fk,) + ko[4:], en[:3] + (fe,) + en[4:])
    assert sum(1 for _, ko, _ in jobs if isinstance(ko[3], list)) == len(feasts), "feasts.tsv 의 이름이 카드 목록에 다 있어야 한다"

    slugs = [j[0] for j in jobs]
    assert len(jobs) == 150 + len(new) and len(set(slugs)) == len(slugs), (len(jobs), len(set(slugs)))
    root = ROOT / "public" / "baptism-cards"
    only_feasts = os.environ.get("ONLY") == "feasts"  # 축일 카드만 다시 찍기(다른 카드는 그대로 둔다)
    for slug, ko, en in jobs:
        if only_feasts and not isinstance(ko[3], list):
            continue
        for lang, (name, mid, sites, meaning, src) in (("ko", ko), ("en", en)):
            im = card(lang, name, mid, sites, meaning, src)
            (root / lang).mkdir(parents=True, exist_ok=True)
            (root / "og" / lang).mkdir(parents=True, exist_ok=True)
            im.save(root / lang / f"{slug}.webp", "WEBP", quality=82, method=6)
            im.resize((480, 600), Image.LANCZOS).save(root / "og" / lang / f"{slug}.jpg", "JPEG", quality=72, optimize=True)
    print(len(jobs), "cards × 2 languages", "(축일 카드만)" if only_feasts else "")
    if not only_feasts:
        write_app_data(new, by_ko)


def write_app_data(new: list[dict], by_ko: dict) -> None:
    """앱 쪽 자료 세 가지를 다시 쓴다 (손으로 고치지 않는다).
    - baptism-names.ts: 새 이름 줄(kind 'plain')을 목록 끝에 넣는다. 예전에 넣은 새 이름 줄은 지우고 다시 넣는다.
    - baptism-card-langs.ts: 카드 그림이 한국어·영어뿐인 세례명(다른 언어 화면은 영어 카드)
    - baptism-related.ts: 함께 묶인 세례명(names_new.tsv 의 group 열 — 같은 축일·가족·같은 이름 뿌리). 양쪽으로 잇는다.
    """
    data = ROOT / "src/features/baptism-card/data"
    ts = data / "baptism-names.ts"
    new_slugs = {r["slug"] for r in new}
    lines = [ln for ln in ts.read_text(encoding="utf-8").split("\n") if not any(f"slug: '{x}'," in ln for x in new_slugs)]
    end = max(i for i, ln in enumerate(lines) if ln.strip() == "];")
    rows = []
    for r in sorted(new, key=lambda r: r["ko"]):
        inner = ", ".join(f"{lang}: '{r[lang]}'" for lang in ("ko", "en", "es", "fr", "pt", "it"))
        rows.append(f"  {{ slug: '{r['slug']}', kind: 'plain', names: {{ {inner} }} }},")
    ts.write_text("\n".join(lines[:end] + rows + lines[end:]), encoding="utf-8")

    slugs = sorted(new_slugs)
    (data / "baptism-card-langs.ts").write_text(
        "/**\n * 카드 그림이 한국어·영어뿐인 세례명 — 2판 1단계(2026-11-25)에 더한 이름.\n"
        " * 스페인어·프랑스어·포르투갈어·이탈리아어 화면은 2단계 전까지 영어 카드를 보인다.\n"
        " * 만드는 곳: design/세례명-공유카드/gen_cards_v2_all.py (손으로 고치지 않는다)\n */\n"
        "export const EN_CARD_ONLY: ReadonlySet<string> = new Set([\n"
        + "".join(f"  '{x}',\n" for x in slugs) + "]);\n", encoding="utf-8")

    ko_slug = {ko: v[0] for ko, v in by_ko.items()} | {r["ko"]: r["slug"] for r in new}
    rel: dict[str, list[str]] = defaultdict(list)
    for r in new:
        if not r["group"]:
            continue
        other = ko_slug[r["group"]]
        for a, b in ((r["slug"], other), (other, r["slug"])):
            if b not in rel[a]:
                rel[a].append(b)
    body = "".join(f"  '{k}': [{', '.join(repr(x) for x in v)}],\n" for k, v in sorted(rel.items()))
    (data / "baptism-related.ts").write_text(
        "/**\n * 함께 묶인 세례명 — 한 이름을 고르면 이 이름들이 칩으로 함께 보인다 (지시서 9호, 2026-11-25).\n"
        " * 묶는 까닭: 같은 날 함께 기념(안나·요아킴), 가족(마르타·라자로 등), 같은 이름 뿌리(유스토·유스티노).\n"
        " * 근거: docs/50-research/개발요청/2026-11-25-개발클로드-세례명-추가-목록.md 3절.\n"
        " * 만드는 곳: design/세례명-공유카드/gen_cards_v2_all.py (손으로 고치지 않는다)\n */\n"
        "export const RELATED_NAMES: Readonly<Record<string, readonly string[]>> = {\n" + body + "};\n",
        encoding="utf-8")
    print("wrote baptism-names.ts (+", len(rows), "), baptism-card-langs.ts, baptism-related.ts (", len(rel), ")")


if __name__ == "__main__":
    main()
