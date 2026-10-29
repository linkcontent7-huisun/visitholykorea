import type { Language } from '@/shared/i18n/dictionary';
import { EXTRA_QUIZZES } from './holy-quiz-extra';

/** 한국어·영어는 필수, 나머지 언어는 아직 번역 전이라 영어로 대신 보여 준다. */
export type QuizText = { ko: string; en: string } & Partial<Record<Language, string>>;

export interface HolyQuiz {
  id: string;
  question: QuizText;
  choices: QuizText[];
  /** 정답 위치(0부터) */
  answer: number;
  hint: QuizText;
  /** 풀고 나서 보여 주는 해설 */
  explanation: QuizText;
}

export function pickText(text: QuizText, language: Language): string {
  return text[language] ?? text.en;
}

/**
 * 「성지순례 퀴즈」 1~10번 — github.com/linkcontent7-huisun/E1-2 의 data.py 를 옮겼다.
 * 정답과 해설은 docs/40-knowledge (박해 사건·주요 순교자·시성과 시복 문서)와 대조해 확인했다(2026-10-29).
 * 해설 문장은 그 문서에 적힌 내용만 쓴다 — 여기서 지어내는 값은 없다.
 */
const CORE_QUIZZES: HolyQuiz[] = [
  {
    id: 'yi-seung-hun',
    question: {
      ko: '1784년 이승훈이 북경에서 한 일로, 한국 천주교회 창설의 계기가 된 것은?',
      en: 'In 1784, what did Yi Seung-hun do in Beijing that began the Catholic Church in Korea?',
    },
    choices: [
      { ko: '사제 서품을 받았다', en: 'He was ordained a priest' },
      { ko: '세례를 받았다', en: 'He was baptized' },
      { ko: '시성식을 집전했다', en: 'He presided at a canonization' },
      { ko: '교구장에 임명되었다', en: 'He was appointed a bishop' },
    ],
    answer: 1,
    hint: {
      ko: '한국 천주교회는 사제의 파견이 아니라, 입교 의식을 받은 한 사람에서 시작되었습니다.',
      en: 'The Church in Korea began not with a priest sent from abroad, but with one man who received the rite of entry.',
    },
    explanation: {
      ko: '1784년 이승훈이 북경에서 세례를 받고 돌아온 것이 한국 천주교회의 시작입니다.',
      en: 'The Korean Church began when Yi Seung-hun was baptized in Beijing in 1784 and returned home.',
    },
  },
  {
    id: 'first-priest',
    question: { ko: '한국인 최초의 가톨릭 사제는?', en: 'Who was the first Korean Catholic priest?' },
    choices: [
      { ko: '정하상 바오로', en: 'Paul Chong Ha-sang' },
      { ko: '이승훈 베드로', en: 'Peter Yi Seung-hun' },
      { ko: '김대건 안드레아', en: 'Andrew Kim Taegon' },
      { ko: '윤지충 바오로', en: 'Paul Yun Ji-chung' },
    ],
    answer: 2,
    hint: {
      ko: '세례명은 안드레아이고, 1984년 103위 성인에 포함되었습니다.',
      en: 'His baptismal name is Andrew, and he was among the 103 saints canonized in 1984.',
    },
    explanation: {
      ko: '김대건 안드레아는 한국인 최초의 사제이며, 1984년 103위 성인 중 한 분으로 시성되었습니다.',
      en: 'Andrew Kim Taegon was the first Korean priest and was canonized in 1984 among the 103 saints.',
    },
  },
  {
    id: 'saenamteo',
    question: {
      ko: '김대건 신부가 1846년 병오박해 때 순교한 곳은?',
      en: 'Where was Fr. Andrew Kim martyred during the Byeong-o Persecution of 1846?',
    },
    choices: [
      { ko: '새남터', en: 'Saenamteo' },
      { ko: '절두산', en: 'Jeoldusan' },
      { ko: '해미읍성', en: 'Haemi Fortress' },
      { ko: '갈매못', en: 'Galmaemot' },
    ],
    answer: 0,
    hint: { ko: '한강변에 있는 순교 성지입니다.', en: 'It is a martyrs’ shrine on the Han River.' },
    explanation: {
      ko: '김대건 신부는 한강 새남터에서 군문효수형으로 순교했습니다. 그때 25세였고, 사제가 된 지 1년이 채 안 된 때였습니다.',
      en: 'Fr. Kim was martyred at Saenamteo on the Han River. He was 25, and not yet a year into his priesthood.',
    },
  },
  {
    id: 'raphael-ship',
    question: {
      ko: '1845년 사제 서품을 받은 김대건이 상하이를 떠나 조선으로 향할 때 탄 작은 목선의 이름은?',
      en: 'After his ordination in 1845, Andrew Kim sailed from Shanghai to Joseon in a small wooden boat. What was it called?',
    },
    choices: [
      { ko: '미카엘호', en: 'The Michael' },
      { ko: '가브리엘호', en: 'The Gabriel' },
      { ko: '라파엘호', en: 'The Raphael' },
      { ko: '산타마리아호', en: 'The Santa Maria' },
    ],
    answer: 2,
    hint: {
      ko: '병자를 고쳐 주는 대천사의 이름을 딴 배입니다.',
      en: 'It was named after the archangel who heals the sick.',
    },
    explanation: {
      ko: '1845년 8월 31일 라파엘호로 상하이를 떠났고, 폭풍을 만나 제주도에 닿았다가 10월 12일 강경 부근 황산포에 도착했습니다.',
      en: 'The Raphael left Shanghai on 31 August 1845, was blown to Jeju by a storm, and finally landed near Gangyeong on 12 October.',
    },
  },
  {
    id: 'jinsan',
    question: {
      ko: '1791년 신해박해(진산사건)의 발단이 된 문제는?',
      en: 'What issue sparked the Sinhae Persecution of 1791 (the Jinsan Incident)?',
    },
    choices: [
      { ko: '세금 제도', en: 'The tax system' },
      { ko: '과거 시험', en: 'The civil service exam' },
      { ko: '군역 면제', en: 'Exemption from military service' },
      { ko: '조상 제사 문제', en: 'The question of ancestral rites' },
    ],
    answer: 3,
    hint: {
      ko: '돌아가신 분의 신주(위패)와 관련된 의례 문제였습니다.',
      en: 'It was about rites concerning the memorial tablet of the deceased.',
    },
    explanation: {
      ko: '조상 제사를 우상숭배로 보고 신주를 부정하는 교리가 효와 가문 질서를 중시하던 조선 사회와 정면으로 부딪혔습니다.',
      en: 'Catholic teaching rejected ancestral rites as idolatry and denied the memorial tablet, which clashed head-on with Joseon’s order built on filial piety.',
    },
  },
  {
    id: 'sinyu',
    question: {
      ko: '1801년 신유박해 때 박해를 주도한 왕실 인물은?',
      en: 'Which royal figure led the Sinyu Persecution of 1801?',
    },
    choices: [
      { ko: '정순왕후', en: 'Queen Jeongsun' },
      { ko: '흥선대원군', en: 'Heungseon Daewongun' },
      { ko: '명성왕후', en: 'Queen Myeongseong' },
      { ko: '인수대비', en: 'Queen Insu' },
    ],
    answer: 0,
    hint: {
      ko: '어린 임금을 대신해 나라를 다스리던 왕실 여성입니다.',
      en: 'She was a royal woman ruling on behalf of a child king.',
    },
    explanation: {
      ko: '정조가 승하하고 11세 순조가 즉위하자 대왕대비 정순왕후가 수렴청정을 하며, 천주교에 우호적이던 남인을 제거하려 했습니다.',
      en: 'After King Jeongjo died and 11-year-old Sunjo took the throne, Queen Dowager Jeongsun ruled as regent and sought to purge the Namin faction friendly to Catholicism.',
    },
  },
  {
    id: 'imbert',
    question: {
      ko: '1839년 기해박해 때 순교한 파리외방전교회 선교사 세 명 중 조선대목구장(주교)은?',
      en: 'Of the three Paris Foreign Missions priests martyred in the Gihae Persecution of 1839, who was the bishop of Joseon?',
    },
    choices: [
      { ko: '모방', en: 'Maubant' },
      { ko: '샤스탕', en: 'Chastan' },
      { ko: '앵베르', en: 'Imbert' },
      { ko: '페레올', en: 'Ferréol' },
    ],
    answer: 2,
    hint: {
      ko: '교구장이었던 이의 이름은 ㅇ으로 시작합니다.',
      en: 'His name begins with the letter I.',
    },
    explanation: {
      ko: '기해박해로 앵베르 주교와 모방·샤스탕 신부, 세 선교사가 순교했습니다.',
      en: 'In the Gihae Persecution, Bishop Imbert and Frs. Maubant and Chastan, the three missionaries, were martyred.',
    },
  },
  {
    id: 'byeongin',
    question: {
      ko: '1866년부터 시작된 병인박해를 주도한 인물은?',
      en: 'Who led the Byeongin Persecution that began in 1866?',
    },
    choices: [
      { ko: '이승훈', en: 'Yi Seung-hun' },
      { ko: '흥선대원군', en: 'Heungseon Daewongun' },
      { ko: '정순왕후', en: 'Queen Jeongsun' },
      { ko: '남종삼', en: 'Nam Jong-sam' },
    ],
    answer: 1,
    hint: {
      ko: '고종의 아버지로, 쇄국 정책을 펼친 인물입니다.',
      en: 'He was King Gojong’s father and pursued a policy of isolation.',
    },
    explanation: {
      ko: '실권을 잡은 흥선대원군이 강력한 쇄국·왕권강화 정책을 펴던 때 일어난, 한국 천주교 역사상 가장 큰 박해입니다.',
      en: 'It broke out while Heungseon Daewongun held power and pursued strict isolation and royal authority, and it was the largest persecution in Korean Catholic history.',
    },
  },
  {
    id: 'canonization-1984',
    question: {
      ko: '1984년 서울 여의도광장에서 103위 시성식을 연 교황은?',
      en: 'Which pope held the canonization of the 103 martyrs at Yeouido Plaza in Seoul in 1984?',
    },
    choices: [
      { ko: '프란치스코', en: 'Francis' },
      { ko: '베네딕토 16세', en: 'Benedict XVI' },
      { ko: '바오로 6세', en: 'Paul VI' },
      { ko: '요한 바오로 2세', en: 'John Paul II' },
    ],
    answer: 3,
    hint: {
      ko: '한국 천주교 200주년을 기념해 방한한 폴란드 출신 교황입니다.',
      en: 'The Polish pope who visited Korea for the 200th anniversary of its Church.',
    },
    explanation: {
      ko: '1984년 5월 6일 요한 바오로 2세 교황이 여의도광장에서 103위를 성인으로 선포했습니다. 바티칸 밖에서 열린 첫 시성식이었습니다.',
      en: 'On 6 May 1984 Pope John Paul II declared the 103 martyrs saints at Yeouido Plaza, the first canonization held outside the Vatican.',
    },
  },
  {
    id: 'beatification-2014',
    question: {
      ko: '2014년 8월 서울 광화문광장에서 시복식이 열린 「윤지충 바오로와 동료 순교자」는 모두 몇 위일까?',
      en: 'In August 2014, “Paul Yun Ji-chung and His 123 Companions” were beatified at Gwanghwamun Square. How many martyrs in all?',
    },
    choices: [
      { ko: '24위', en: '24' },
      { ko: '79위', en: '79' },
      { ko: '124위', en: '124' },
      { ko: '103위', en: '103' },
    ],
    answer: 2,
    hint: { ko: '103위보다 많은 수입니다.', en: 'More than 103.' },
    explanation: {
      ko: '2014년 8월 16일 프란치스코 교황이 윤지충 바오로와 동료 순교자 124위를 시복했습니다.',
      en: 'On 16 August 2014 Pope Francis beatified Paul Yun Ji-chung and his companions, 124 martyrs in all.',
    },
  },
];

/** 전체 40문항. 순서가 곧 날짜별 순환 순서다. */
export const HOLY_QUIZZES: HolyQuiz[] = [...CORE_QUIZZES, ...EXTRA_QUIZZES];
