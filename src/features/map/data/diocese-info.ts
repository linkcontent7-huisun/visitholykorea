/**
 * 교구 15곳 설명 — 성지 찾기 지도에서 교구를 누르면 뜨는 카드 (지시서 10호, 2026-11-25).
 *
 * 근거·검증: docs/40-knowledge/09-교구/2026-11-25-교구-15곳.md (Codex 교차 검증 + 개발 창 재검증).
 * 운영 DB 가 아니라 코드에 둔다 — 자주 바뀌지 않는 설명 글이다. 성지 수는 여기 적지 않고 화면에서 DB 값을 센다.
 * 한국어·영어만 쓰고, 나머지 네 언어 화면은 영어를 보인다(번역 규칙: 없는 언어는 영어로 대신).
 */

/** 교구 그림 — 교구 설명에 근거가 있는 것만(근거는 위 문서), 서울·의정부는 좁아서 그림 없이 글자만 */
export type DioceseIcon =
  | 'boat'
  | 'mountain'
  | 'bamboo'
  | 'book'
  | 'pine'
  | 'village'
  | 'pillar'
  | 'anchor'
  | 'island'
  | 'dove'
  | 'church'
  | 'orange';

interface Text {
  ko: string;
  en: string;
}

export interface DioceseInfo {
  /** diocese-shapes.json 의 diocese 값과 같다 */
  key: string;
  name: Text;
  /** 교구가 처음 세워진 해(대목구·지목구 포함) */
  founded: number;
  cathedral: Text;
  area: Text;
  about: Text;
  icon: DioceseIcon | null;
}

export const DIOCESE_INFO: readonly DioceseInfo[] = [
  {
    key: '서울',
    name: { ko: '서울대교구', en: 'Archdiocese of Seoul' },
    founded: 1831,
    cathedral: { ko: '명동대성당', en: 'Myeongdong Cathedral' },
    area: { ko: '서울', en: 'Seoul' },
    about: {
      ko: '초기 한국 교회의 중심지. 새남터·서소문 밖 등 박해 시대 순교 성지가 서울 안에 남아 있다.',
      en: 'Centre of the early Korean Church; martyrdom sites of the persecutions such as Saenamteo and Seosomun remain in the city.',
    },
    icon: null,
  },
  {
    key: '인천',
    name: { ko: '인천교구', en: 'Diocese of Incheon' },
    founded: 1961,
    cathedral: { ko: '답동 주교좌성당', en: 'Dapdong Cathedral' },
    area: { ko: '인천, 경기 부천·시흥·김포, 안산 일부', en: 'Incheon, Bucheon, Siheung, Gimpo and part of Ansan' },
    about: {
      ko: '인천과 경기 서부를 맡는다. 병인박해 순교지 제물진두와 강화 갑곶 성지가 있다.',
      en: 'Covers Incheon and western Gyeonggi, with the martyrdom sites of Jemuljindu and Gapgot on Ganghwa.',
    },
    icon: 'boat',
  },
  {
    key: '수원',
    name: { ko: '수원교구', en: 'Diocese of Suwon' },
    founded: 1963,
    cathedral: { ko: '정자동 주교좌성당', en: 'Jeongja-dong Cathedral' },
    area: { ko: '경기 남부', en: 'Southern Gyeonggi' },
    about: {
      ko: '천진암을 비롯해 초기 교회와 교우촌의 자취가 남은 경기 남부를 맡는다.',
      en: 'Southern Gyeonggi, where traces of the early Church and Catholic villages remain, including Cheonjinam.',
    },
    icon: 'mountain',
  },
  {
    key: '의정부',
    name: { ko: '의정부교구', en: 'Diocese of Uijeongbu' },
    founded: 2004,
    cathedral: { ko: '의정부 주교좌성당', en: 'Uijeongbu Cathedral' },
    area: { ko: '경기 북부', en: 'Northern Gyeonggi' },
    about: {
      ko: '남북 접경 지역을 맡는 교구. 정약용 집안의 고향 마재 등 초기 교회의 자취가 있다.',
      en: 'Covers the border region of northern Gyeonggi, including Majae, home of the Jeong Yak-yong family.',
    },
    icon: null,
  },
  {
    key: '춘천',
    name: { ko: '춘천교구', en: 'Diocese of Chuncheon' },
    founded: 1939,
    cathedral: { ko: '죽림동 주교좌성당', en: 'Jungnim-dong Cathedral' },
    area: { ko: '강원 북부', en: 'Northern Gangwon' },
    about: {
      ko: '골롬반 선교사들이 일군 교구로, 한국전쟁 때 순교한 사제들을 기억한다.',
      en: 'Shaped by the Columban missionaries; remembers the priests killed during the Korean War.',
    },
    icon: 'bamboo',
  },
  {
    key: '원주',
    name: { ko: '원주교구', en: 'Diocese of Wonju' },
    founded: 1965,
    cathedral: { ko: '원동 주교좌성당', en: 'Wondong Cathedral' },
    area: { ko: '강원 남부, 충북 제천·단양', en: 'Southern Gangwon, Jecheon and Danyang' },
    about: {
      ko: '신학교가 있던 배론과 원주 감영 터 등 박해 시기 신앙의 흔적이 남아 있다.',
      en: 'Home to Baeron, once a seminary, and the Gangwon provincial office site, traces of the persecution era.',
    },
    icon: 'book',
  },
  {
    key: '대전',
    name: { ko: '대전교구', en: 'Diocese of Daejeon' },
    founded: 1948,
    cathedral: { ko: '대흥동 주교좌성당', en: 'Daeheung-dong Cathedral' },
    area: { ko: '대전, 세종, 충남', en: 'Daejeon, Sejong, South Chungcheong' },
    about: {
      ko: '«내포»라 불린 충남 서해안을 맡는다. 김대건 신부가 태어난 솔뫼와 해미 순교지가 있다.',
      en: 'Covers the Naepo coast of South Chungcheong, with Solmoe, birthplace of St Andrew Kim, and Haemi.',
    },
    icon: 'pine',
  },
  {
    key: '청주',
    name: { ko: '청주교구', en: 'Diocese of Cheongju' },
    founded: 1958,
    cathedral: { ko: '내덕동 주교좌성당', en: 'Naedeok-dong Cathedral' },
    area: { ko: '충북(제천·단양 제외)', en: 'North Chungcheong (except Jecheon and Danyang)' },
    about: {
      ko: '충북의 교우촌과 연풍 등 순교 성지를 품은 교구.',
      en: 'Covers North Chungcheong, with Catholic villages and martyrdom sites such as Yeonpung.',
    },
    icon: 'village',
  },
  {
    key: '안동',
    name: { ko: '안동교구', en: 'Diocese of Andong' },
    founded: 1969,
    cathedral: { ko: '목성동 주교좌성당', en: 'Mokseong-dong Cathedral' },
    area: { ko: '경북 북부', en: 'Northern North Gyeongsang' },
    about: {
      ko: '경북 북부 산간에 박해 시기 교우촌과 신앙 유적이 남아 있다.',
      en: 'Northern North Gyeongsang, where mountain Catholic villages of the persecution era remain.',
    },
    icon: 'mountain',
  },
  {
    key: '대구',
    name: { ko: '대구대교구', en: 'Archdiocese of Daegu' },
    founded: 1911,
    cathedral: { ko: '계산 주교좌성당', en: 'Gyesan Cathedral' },
    area: { ko: '대구, 경북(안동교구 관할 제외)', en: 'Daegu and North Gyeongsang (except the Andong diocese)' },
    about: {
      ko: '1911년 서울에서 나뉘어 세워진 대구대목구에서 시작했다. 경상감영 옥터 순교지가 있다.',
      en: 'Began as the Vicariate of Daegu, separated from Seoul in 1911; home to the Gyeongsang provincial prison martyrdom site.',
    },
    icon: 'pillar',
  },
  {
    key: '부산',
    name: { ko: '부산교구', en: 'Diocese of Busan' },
    founded: 1957,
    cathedral: { ko: '남천 주교좌성당', en: 'Namcheon Cathedral' },
    area: { ko: '부산, 울산, 경남 양산과 김해·밀양 일부', en: 'Busan, Ulsan, Yangsan and parts of Gimhae and Miryang' },
    about: {
      ko: '오륜대 한국 순교자 박물관과 부산·울산의 순교 성지가 있다.',
      en: 'Home to the Oryundae Korean Martyrs’ Museum and martyrdom sites in Busan and Ulsan.',
    },
    icon: 'anchor',
  },
  {
    key: '마산',
    name: { ko: '마산교구', en: 'Diocese of Masan' },
    founded: 1966,
    cathedral: { ko: '양덕동 주교좌성당', en: 'Yangdeok-dong Cathedral' },
    area: { ko: '경남(부산교구 관할 제외)', en: 'South Gyeongsang (except the Busan diocese)' },
    about: {
      ko: '경남 곳곳에 거제 윤봉문 성지 등 순교의 자취가 남아 있다.',
      en: 'Martyrdom sites such as that of Yun Bong-mun on Geoje remain across South Gyeongsang.',
    },
    icon: 'island',
  },
  {
    key: '광주',
    name: { ko: '광주대교구', en: 'Archdiocese of Gwangju' },
    founded: 1937,
    cathedral: { ko: '임동 주교좌성당', en: 'Imdong Cathedral' },
    area: { ko: '광주, 전남', en: 'Gwangju and South Jeolla' },
    about: {
      ko: '광주·전남의 순교 유적과 5·18을 기억하는 기념 성당이 있다.',
      en: 'Martyrdom sites across Gwangju and South Jeolla, and a memorial church for 18 May 1980.',
    },
    icon: 'dove',
  },
  {
    key: '전주',
    name: { ko: '전주교구', en: 'Diocese of Jeonju' },
    founded: 1937,
    cathedral: { ko: '중앙 주교좌성당', en: 'Jungang Cathedral' },
    area: { ko: '전북', en: 'North Jeolla' },
    about: {
      ko: '초남이와 전동성당 등 한국 천주교 초기 순교의 자취가 남아 있다.',
      en: 'Chonamyi and Jeondong Church keep the memory of the earliest Korean martyrs.',
    },
    icon: 'church',
  },
  {
    key: '제주',
    name: { ko: '제주교구', en: 'Diocese of Jeju' },
    founded: 1971,
    cathedral: { ko: '중앙 주교좌성당', en: 'Jungang Cathedral' },
    area: { ko: '제주', en: 'Jeju' },
    about: {
      ko: '김대건 신부 일행이 사제품을 받고 돌아오다 표착한 용수리가 있는 섬 교구.',
      en: 'Island diocese where St Andrew Kim’s boat drifted ashore at Yongsu on his return as a priest.',
    },
    // 귤은 교구 설명에 근거가 없다 — 사장님 결정(2026-11-25)으로 제주를 떠올리는 그림으로 둔다
    icon: 'orange',
  },
];

export function dioceseInfo(key: string): DioceseInfo | undefined {
  return DIOCESE_INFO.find((d) => d.key === key);
}

/** 한국어 화면은 한국어, 그 밖의 언어는 영어 */
export function dioceseText(text: Text, language: string): string {
  return language === 'ko' ? text.ko : text.en;
}
