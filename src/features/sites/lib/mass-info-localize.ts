/**
 * 「▷ 미사 시간」 행(라벨·값)을 화면 언어로 바꾼다.
 *
 * 미사 시간은 서울 성지 13곳의 한국어 소개글에만 붙어 있고 외국어 소개글엔 없다(2026-09-21 실측).
 * 그래서 카드는 늘 한국어 원문에서 나오는데, 라벨(주일·평일)과 요일·「주일미사」 같은 어휘가
 * 외국어 화면에도 그대로 보였다(T-034). 성지마다 문장이 달라 열을 새로 파는 대신,
 * 자주 나오는 어휘만 사전으로 치환한다. 사전에 없는 고유명사(박물관 이름 등)는 한국어로 남긴다 —
 * 지도 앱이 보여주는 이름과 같으니 오히려 찾기 쉽다.
 */
import type { Language } from '@/shared/i18n/dictionary';

type Foreign = Exclude<Language, 'ko'>;
type Phrase = Record<Foreign, string>;

/** 행 라벨. 「문의」는 화면에서 이미 빼므로 없다. */
const LABELS: Record<string, Phrase> = {
  주일: { en: 'Sunday', es: 'Domingo', fr: 'Dimanche', pt: 'Domingo', it: 'Domenica' },
  평일: {
    en: 'Weekdays',
    es: 'Entre semana',
    fr: 'En semaine',
    pt: 'Dias de semana',
    it: 'Giorni feriali',
  },
  비고: { en: 'Notes', es: 'Notas', fr: 'Remarques', pt: 'Observações', it: 'Note' },
};

/**
 * 값 안의 구절. 긴 것부터 바꿔야 「월요일 휴관」이 「월」 요일 치환에 먼저 잡히지 않는다.
 * 13곳 원문(2025-11-30 기준)에 실제로 나오는 어휘만 담았다.
 */
const PHRASES: Array<[string, Phrase]> = [
  [
    '부활 제2주일~그리스도왕 대축일, 동절기 쉼',
    {
      en: '2nd Sunday of Easter to Christ the King; no Mass in winter',
      es: 'del 2.º domingo de Pascua a Cristo Rey; sin misa en invierno',
      fr: 'du 2e dimanche de Pâques au Christ-Roi ; pas de messe en hiver',
      pt: 'do 2.º domingo da Páscoa a Cristo Rei; sem missa no inverno',
      it: 'dalla 2ª domenica di Pasqua a Cristo Re; nessuna messa in inverno',
    },
  ],
  [
    '매월 마지막 수요일',
    {
      en: 'last Wednesday of the month',
      es: 'último miércoles del mes',
      fr: 'dernier mercredi du mois',
      pt: 'última quarta-feira do mês',
      it: 'ultimo mercoledì del mese',
    },
  ],
  [
    '라틴어·그레고리오 성가 미사',
    {
      en: 'Latin Mass with Gregorian chant',
      es: 'misa en latín con canto gregoriano',
      fr: 'messe en latin avec chant grégorien',
      pt: 'missa em latim com canto gregoriano',
      it: 'messa in latino con canto gregoriano',
    },
  ],
  [
    '월례미사 매월 21일',
    {
      en: 'monthly Mass on the 21st',
      es: 'misa mensual el día 21',
      fr: 'messe mensuelle le 21',
      pt: 'missa mensal no dia 21',
      it: 'messa mensile il giorno 21',
    },
  ],
  [
    '첫 토요일 성모신심미사',
    {
      en: 'first Saturday: Marian devotion Mass',
      es: 'primer sábado: misa de devoción mariana',
      fr: 'premier samedi : messe de dévotion mariale',
      pt: 'primeiro sábado: missa de devoção mariana',
      it: 'primo sabato: messa di devozione mariana',
    },
  ],
  [
    '첫 토요일 성인 전구미사',
    {
      en: 'first Saturday: Mass of intercession of the saints',
      es: 'primer sábado: misa de intercesión de los santos',
      fr: 'premier samedi : messe d’intercession des saints',
      pt: 'primeiro sábado: missa de intercessão dos santos',
      it: 'primo sabato: messa di intercessione dei santi',
    },
  ],
  [
    '첫 토요일 성모신심',
    {
      en: 'first Saturday: Marian devotion',
      es: 'primer sábado: devoción mariana',
      fr: 'premier samedi : dévotion mariale',
      pt: 'primeiro sábado: devoção mariana',
      it: 'primo sabato: devozione mariana',
    },
  ],
  [
    '셋째 토요일 순교자현양미사',
    {
      en: 'third Saturday: Mass honoring the martyrs',
      es: 'tercer sábado: misa en honor de los mártires',
      fr: 'troisième samedi : messe en l’honneur des martyrs',
      pt: 'terceiro sábado: missa em honra dos mártires',
      it: 'terzo sabato: messa in onore dei martiri',
    },
  ],
  [
    '첫째 주 월요일',
    {
      en: 'first Monday of the month',
      es: 'primer lunes del mes',
      fr: 'premier lundi du mois',
      pt: 'primeira segunda-feira do mês',
      it: 'primo lunedì del mese',
    },
  ],
  [
    '군종후원회 미사',
    {
      en: 'Military Ordinariate supporters’ Mass',
      es: 'misa de la asociación de apoyo al Ordinariato Militar',
      fr: 'messe de l’association de soutien à l’Ordinariat militaire',
      pt: 'missa da associação de apoio ao Ordinariato Militar',
      it: 'messa dell’associazione di sostegno all’Ordinariato militare',
    },
  ],
  [
    '매주 목요일',
    {
      en: 'every Thursday',
      es: 'todos los jueves',
      fr: 'tous les jeudis',
      pt: 'todas as quintas-feiras',
      it: 'ogni giovedì',
    },
  ],
  [
    '성지 신심미사',
    {
      en: 'shrine devotional Mass',
      es: 'misa devocional del santuario',
      fr: 'messe de dévotion du sanctuaire',
      pt: 'missa devocional do santuário',
      it: 'messa devozionale del santuario',
    },
  ],
  [
    '월요일·공휴일 휴관',
    {
      en: 'closed Mondays and public holidays',
      es: 'cerrado lunes y festivos',
      fr: 'fermé le lundi et les jours fériés',
      pt: 'fechado às segundas e feriados',
      it: 'chiuso il lunedì e nei giorni festivi',
    },
  ],
  [
    '월요일 휴관',
    {
      en: 'closed Mondays',
      es: 'cerrado los lunes',
      fr: 'fermé le lundi',
      pt: 'fechado às segundas',
      it: 'chiuso il lunedì',
    },
  ],
  [
    '평일 순례 불가',
    {
      en: 'no pilgrim visits on weekdays',
      es: 'sin visitas entre semana',
      fr: 'pas de visite en semaine',
      pt: 'sem visitas nos dias de semana',
      it: 'nessuna visita nei giorni feriali',
    },
  ],
  [
    '순례자미사',
    {
      en: 'pilgrims’ Mass',
      es: 'misa de peregrinos',
      fr: 'messe des pèlerins',
      pt: 'missa dos peregrinos',
      it: 'messa dei pellegrini',
    },
  ],
  [
    '주일미사',
    {
      en: 'Sunday Mass',
      es: 'misa dominical',
      fr: 'messe dominicale',
      pt: 'missa dominical',
      it: 'messa domenicale',
    },
  ],
  [
    '성지미사',
    {
      en: 'shrine Mass',
      es: 'misa del santuario',
      fr: 'messe du sanctuaire',
      pt: 'missa do santuário',
      it: 'messa del santuario',
    },
  ],
  ['개방시간', { en: 'open', es: 'abierto', fr: 'ouvert', pt: 'aberto', it: 'aperto' }],
  [
    '연중무휴',
    {
      en: 'open every day',
      es: 'abierto todos los días',
      fr: 'ouvert tous les jours',
      pt: 'aberto todos os dias',
      it: 'aperto tutti i giorni',
    },
  ],
  [
    '항시 안내',
    {
      en: 'guided visits at all times',
      es: 'visitas guiadas en todo momento',
      fr: 'visites guidées à tout moment',
      pt: 'visitas guiadas a qualquer hora',
      it: 'visite guidate in ogni momento',
    },
  ],
  [
    '성화전시실',
    {
      en: 'sacred art gallery',
      es: 'sala de arte sacro',
      fr: 'salle d’art sacré',
      pt: 'sala de arte sacra',
      it: 'sala d’arte sacra',
    },
  ],
  [
    '식사 가능',
    {
      en: 'meals available',
      es: 'se sirven comidas',
      fr: 'repas possibles',
      pt: 'refeições disponíveis',
      it: 'pasti disponibili',
    },
  ],
  [
    '성지식당',
    {
      en: 'shrine restaurant',
      es: 'restaurante del santuario',
      fr: 'restaurant du sanctuaire',
      pt: 'restaurante do santuário',
      it: 'ristorante del santuario',
    },
  ],
  [
    '서울대교구 역사관',
    {
      en: 'Archdiocese of Seoul History Hall',
      es: 'Museo de Historia de la Archidiócesis de Seúl',
      fr: 'Musée d’histoire de l’archidiocèse de Séoul',
      pt: 'Museu de História da Arquidiocese de Seul',
      it: 'Museo storico dell’Arcidiocesi di Seoul',
    },
  ],
  [
    '서소문성지 역사박물관',
    {
      en: 'Seosomun Shrine History Museum',
      es: 'Museo de Historia del Santuario de Seosomun',
      fr: 'Musée d’histoire du sanctuaire de Seosomun',
      pt: 'Museu de História do Santuário de Seosomun',
      it: 'Museo storico del Santuario di Seosomun',
    },
  ],
  [
    '한국천주교순교자박물관',
    {
      en: 'Korean Catholic Martyrs Museum',
      es: 'Museo de los Mártires Católicos de Corea',
      fr: 'Musée des martyrs catholiques de Corée',
      pt: 'Museu dos Mártires Católicos da Coreia',
      it: 'Museo dei Martiri Cattolici di Corea',
    },
  ],
  [
    '포도청(옥터) 순교자현양관',
    {
      en: 'Martyrs’ Memorial Hall (old police bureau prison site)',
      es: 'Sala conmemorativa de los mártires (antigua prisión policial)',
      fr: 'Mémorial des martyrs (ancienne prison de police)',
      pt: 'Memorial dos Mártires (antiga prisão policial)',
      it: 'Memoriale dei martiri (antica prigione di polizia)',
    },
  ],
  [
    '서강대학교 성 이냐시오 성당',
    {
      en: 'St. Ignatius Church, Sogang University',
      es: 'Iglesia de San Ignacio, Universidad Sogang',
      fr: 'Église Saint-Ignace, université Sogang',
      pt: 'Igreja de Santo Inácio, Universidade Sogang',
      it: 'Chiesa di Sant’Ignazio, Università Sogang',
    },
  ],
  [
    '국군중앙주교좌성당',
    {
      en: 'Military Ordinariate Cathedral',
      es: 'Catedral del Ordinariato Militar',
      fr: 'Cathédrale de l’Ordinariat militaire',
      pt: 'Catedral do Ordinariato Militar',
      it: 'Cattedrale dell’Ordinariato militare',
    },
  ],
  [
    '삼성산 성당',
    {
      en: 'Samseongsan Church',
      es: 'Iglesia de Samseongsan',
      fr: 'Église de Samseongsan',
      pt: 'Igreja de Samseongsan',
      it: 'Chiesa di Samseongsan',
    },
  ],
  [
    '학기중',
    {
      en: 'during term',
      es: 'en período lectivo',
      fr: 'pendant le semestre',
      pt: 'durante o período letivo',
      it: 'durante il semestre',
    },
  ],
  ['소성전', { en: 'chapel', es: 'capilla', fr: 'chapelle', pt: 'capela', it: 'cappella' }],
  ['영어', { en: 'English', es: 'en inglés', fr: 'en anglais', pt: 'em inglês', it: 'in inglese' }],
  [
    '매일',
    {
      en: 'daily',
      es: 'todos los días',
      fr: 'tous les jours',
      pt: 'todos os dias',
      it: 'ogni giorno',
    },
  ],
];

/** 한 글자 요일. 「매월」「월례」「21일」처럼 앞뒤에 한글·숫자가 붙은 것은 건드리지 않는다. */
const DAYS: Record<string, Phrase> = {
  월: { en: 'Mon', es: 'lun', fr: 'lun', pt: 'seg', it: 'lun' },
  화: { en: 'Tue', es: 'mar', fr: 'mar', pt: 'ter', it: 'mar' },
  수: { en: 'Wed', es: 'mié', fr: 'mer', pt: 'qua', it: 'mer' },
  목: { en: 'Thu', es: 'jue', fr: 'jeu', pt: 'qui', it: 'gio' },
  금: { en: 'Fri', es: 'vie', fr: 'ven', pt: 'sex', it: 'ven' },
  토: { en: 'Sat', es: 'sáb', fr: 'sam', pt: 'sáb', it: 'sab' },
  일: { en: 'Sun', es: 'dom', fr: 'dim', pt: 'dom', it: 'dom' },
};
// lookbehind 는 iOS 16.3 이하에서 앱 전체를 죽이므로(browser-compat.test) 앞 글자를 캡처해 되돌려준다
const DAY_PATTERN = /(^|[^0-9가-힣])([월화수목금토일])(?![가-힣])/g;

export function localizeMassLabel(label: string, language: Language): string {
  if (language === 'ko') return label;
  return LABELS[label]?.[language] ?? label;
}

export function localizeMassValue(value: string, language: Language): string {
  if (language === 'ko') return value;
  let out = value;
  for (const [ko, phrase] of PHRASES) out = out.split(ko).join(phrase[language]);
  // 「월~금」「화·목」 — 물결·가운뎃점은 그대로 두고 글자만 바꾼다
  out = out.replace(
    DAY_PATTERN,
    (_, before: string, day: string) => before + (DAYS[day]?.[language] ?? day),
  );
  return out;
}
