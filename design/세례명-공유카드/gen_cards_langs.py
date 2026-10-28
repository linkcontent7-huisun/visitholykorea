"""스페인어·프랑스어·포르투갈어·이탈리아어 세례명 카드 (앱의 6개 언어 중 ko·en 외 4개).
틀·성인 선택·성지 규칙은 gen_cards_en.py 와 같다. 이 파일에서 손으로 적은 것은 세례명 표기, 문장 틀, 성지 문장뿐이다.
세례명(43개 × 4언어)과 문장은 모두 확인 전 단계다 — 가톨릭 용어 표기는 신자·번역자 검수가 필요하다.
실행: python gen_cards_langs.py  → cards-es|fr|pt|it/*.png , cards-*/index.tsv
"""

from gen_cards_en import HERE, NOT_SITE, SITE_EN, card_en, load_groups, name_tail

# 한국어 세례명 → 영어 세례명(검증용) → (es, fr, pt, it)
NAMES = {
    "가롤로": ("Charles", "Carlos", "Charles", "Carlos", "Carlo"),
    "가타리나": ("Catherine", "Catalina", "Catherine", "Catarina", "Caterina"),
    "골룸바": ("Columba", "Columba", "Colombe", "Columba", "Colomba"),
    "다미아노": ("Damian", "Damián", "Damien", "Damião", "Damiano"),
    "데레사": ("Teresa", "Teresa", "Thérèse", "Teresa", "Teresa"),
    "라우렌시오": ("Lawrence", "Lorenzo", "Laurent", "Lourenço", "Lorenzo"),
    "로사": ("Rose", "Rosa", "Rose", "Rosa", "Rosa"),
    "루도비코": ("Louis", "Luis", "Louis", "Luís", "Luigi"),
    "루치아": ("Lucy", "Lucía", "Lucie", "Luzia", "Lucia"),
    "루카": ("Luke", "Lucas", "Luc", "Lucas", "Luca"),
    "마르코": ("Mark", "Marcos", "Marc", "Marcos", "Marco"),
    "마르타": ("Martha", "Marta", "Marthe", "Marta", "Marta"),
    "마리아": ("Mary", "María", "Marie", "Maria", "Maria"),
    "막달레나": ("Magdalene", "Magdalena", "Madeleine", "Madalena", "Maddalena"),
    "바르바라": ("Barbara", "Bárbara", "Barbe", "Bárbara", "Barbara"),
    "바르톨로메오": ("Bartholomew", "Bartolomé", "Barthélemy", "Bartolomeu", "Bartolomeo"),
    "바오로": ("Paul", "Pablo", "Paul", "Paulo", "Paolo"),
    "베네딕타": ("Benedicta", "Benedicta", "Bénédicte", "Benedita", "Benedetta"),
    "베드로": ("Peter", "Pedro", "Pierre", "Pedro", "Pietro"),
    "세바스티아노": ("Sebastian", "Sebastián", "Sébastien", "Sebastião", "Sebastiano"),
    "수산나": ("Susanna", "Susana", "Suzanne", "Susana", "Susanna"),
    "스테파노": ("Stephen", "Esteban", "Étienne", "Estêvão", "Stefano"),
    "시메온": ("Simeon", "Simeón", "Siméon", "Simeão", "Simeone"),
    "아가타": ("Agatha", "Águeda", "Agathe", "Ágata", "Agata"),
    "아녜스": ("Agnes", "Inés", "Agnès", "Inês", "Agnese"),
    "아우구스티노": ("Augustine", "Agustín", "Augustin", "Agostinho", "Agostino"),
    "안나": ("Anne", "Ana", "Anne", "Ana", "Anna"),
    "안드레아": ("Andrew", "Andrés", "André", "André", "Andrea"),
    "안토니오": ("Anthony", "Antonio", "Antoine", "António", "Antonio"),
    "알렉시오": ("Alexis", "Alejo", "Alexis", "Aleixo", "Alessio"),
    "야고보": ("James", "Santiago", "Jacques", "Tiago", "Giacomo"),
    "엘리사벳": ("Elizabeth", "Isabel", "Élisabeth", "Isabel", "Elisabetta"),
    "요셉": ("Joseph", "José", "Joseph", "José", "Giuseppe"),
    "요한": ("John", "Juan", "Jean", "João", "Giovanni"),
    "유스토": ("Justus", "Justo", "Juste", "Justo", "Giusto"),
    "율리에타": ("Juliette", "Julieta", "Juliette", "Julieta", "Giulietta"),
    "이냐시오": ("Ignatius", "Ignacio", "Ignace", "Inácio", "Ignazio"),
    "체칠리아": ("Cecilia", "Cecilia", "Cécile", "Cecília", "Cecilia"),
    "토마스": ("Thomas", "Tomás", "Thomas", "Tomás", "Tommaso"),
    "페르페투아": ("Perpetua", "Perpetua", "Perpétue", "Perpétua", "Perpetua"),
    "프란치스코": ("Francis", "Francisco", "François", "Francisco", "Francesco"),
    "프로타시오": ("Protase", "Protasio", "Protais", "Protásio", "Protasio"),
    "헨리코": ("Henry", "Enrique", "Henri", "Henrique", "Enrico"),
}

PREP = {"es": "en", "fr": "à", "pt": "em", "it": "a"}  # 「~에서」에 해당하는 전치사

LANGS = {
    "es": dict(
        L=dict(title="Lugares santos según tu nombre de bautismo", mine="Mi nombre de bautismo",
               box="Santuarios para visitar", footer="Guía de peregrinación católica en Corea · 6 idiomas"),
        none="En investigación", gate_short="Fuera de Seosomun", gate_where="fuera de la puerta de Seosomun",
        prison="en prisión", more=lambda k: f"y {k} más",
        many=lambda n, y: f"{n} santos con este nombre · el primero, mártir en {y}",
        one=lambda f, y, w: f"{'Martirizada' if f else 'Martirizado'} en {y} {w}",
    ),
    "fr": dict(
        L=dict(title="Les lieux saints selon votre nom de baptême", mine="Mon nom de baptême",
               box="Lieux saints à visiter", footer="Guide du pèlerinage catholique en Corée · 6 langues"),
        none="En cours de recherche", gate_short="Hors de Seosomun", gate_where="hors de la porte de Seosomun",
        prison="en prison", more=lambda k: f"et {k} autre{'s' if k > 1 else ''}",
        many=lambda n, y: f"{n} saints portent ce nom · le premier, martyr en {y}",
        one=lambda f, y, w: f"Martyr en {y} {w}",
    ),
    "pt": dict(
        L=dict(title="Lugares santos pelo seu nome de batismo", mine="Meu nome de batismo",
               box="Lugares santos para visitar", footer="Guia de peregrinação católica na Coreia · 6 idiomas"),
        none="Em pesquisa", gate_short="Fora de Seosomun", gate_where="fora da porta de Seosomun",
        prison="na prisão", more=lambda k: f"e mais {k}",
        many=lambda n, y: f"{n} santos com este nome · o primeiro, mártir em {y}",
        one=lambda f, y, w: f"{'Martirizada' if f else 'Martirizado'} em {y} {w}",
    ),
    "it": dict(
        L=dict(title="I luoghi santi dal tuo nome di battesimo", mine="Il mio nome di battesimo",
               box="Luoghi santi da visitare", footer="Guida al pellegrinaggio cattolico in Corea · 6 lingue"),
        none="In fase di ricerca", gate_short="Fuori da Seosomun", gate_where="fuori dalla porta di Seosomun",
        prison="in prigione", more=lambda k: f"e altri {k}",
        many=lambda n, y: f"{n} santi con questo nome · il primo, martire nel {y}",
        one=lambda f, y, w: f"{'Martirizzata' if f else 'Martirizzato'} nel {y} {w}",
    ),
}
VOWELS = "AEIOUÁÉÍÓÚÂÊÔÀÈÌÒÙÎÛÄËÏÖÜ"


def saint_title(lang: str, female: bool, bapt: str) -> str:
    """성인 호칭 + 세례명 (스페인어 Santo Tomás, 이탈리아어 Sant'Andrea 같은 관용을 지킨다)."""
    if lang == "es":
        return ("Santa " if female else "Santo " if bapt == "Tomás" else "San ") + bapt
    if lang == "fr":
        return ("Sainte " if female else "Saint ") + bapt
    if lang == "pt":
        return ("Santa " if female else "São ") + bapt
    if bapt[0] in VOWELS:
        return "Sant'" + bapt
    return "Santa " + bapt if female else ("Santo " if bapt.startswith(("Ste", "Sp", "Z")) else "San ") + bapt


def main():
    by_bapt = load_groups()
    for lang, cfg in LANGS.items():
        col = 1 + list(LANGS).index(lang)  # NAMES 튜플에서 es=1 fr=2 pt=3 it=4
        out_dir = HERE / f"cards-{lang}"
        out_dir.mkdir(exist_ok=True)
        index, seen = [], {}
        for bapt_ko, items in sorted(by_bapt.items()):
            en, loc = NAMES[bapt_ko][0], NAMES[bapt_ko][col]
            assert {i["bapt_en"] for i in items} == {en}, (bapt_ko, en)  # 영어 표와 맞는지 검증
            assert loc not in seen, (lang, loc, bapt_ko, seen.get(loc))
            seen[loc] = bapt_ko
            first, n = items[0], len(items)
            female = first["kind"] == "성녀"
            name = f"{saint_title(lang, female, loc)} {name_tail(first['main'], en)}".strip()
            saint = name + (" " + cfg["more"](n - 1) if n > 1 else "")
            sites = []
            for i in items:
                label = cfg["gate_short"] if i["site"] == "서소문 밖" else SITE_EN[i["site"]][0] if i["site"] in SITE_EN else ""
                if i["site"] not in NOT_SITE and label not in sites:
                    sites.append(label)
            year = first["date"][:4]
            if n == 1:
                s = first["site"]
                where = cfg["prison"] if s in NOT_SITE else cfg["gate_where"] if s == "서소문 밖" else f"{PREP[lang]} {SITE_EN[s][0]}"
                detail = cfg["one"](female, year, where)
            else:
                detail = cfg["many"](n, year)
            card_en(loc, saint, detail, sites[:3] if sites else [cfg["none"]], out_dir / f"{loc}.png", cfg["L"])
            index.append((bapt_ko, loc, n, name, " · ".join(sites) or cfg["none"]))
        with open(out_dir / "index.tsv", "w", encoding="utf-8") as f:
            f.write("세례명\t" + lang + "\t성인수\t대표 성인\t성지\n")
            for r in index:
                f.write("\t".join(map(str, r)) + "\n")
        print(lang, len(index), "cards")


if __name__ == "__main__":
    main()
