export type Language = 'ko' | 'en';

export const LANGUAGES: Language[] = ['ko', 'en'];

/** 언어 전환 버튼에 쓸 이름. 자기 언어로 적는다 — 못 읽는 언어로 쓰면 고를 수가 없다. */
export const LANGUAGE_LABEL: Record<Language, string> = {
  ko: '한국어',
  en: 'English',
};

/**
 * UI 문구.
 *
 * 접수 기획서의 다국어 계획이 "한/영 우선, 추후 확장"이라 두 언어부터 채웠다.
 * 언어를 늘릴 때는 `Language` 에 코드를 넣고 이 표를 채우면 타입 검사가 빠진 곳을 잡아 준다.
 *
 * 성지 설명 본문은 여기가 아니라 DB(`holy_site_translations`)에 있다.
 * 화면 문구와 콘텐츠는 갱신 주기가 달라서 섞으면 둘 다 관리가 어려워진다.
 */
export const DICTIONARY = {
  // 내비게이션
  home: { ko: '홈', en: 'Home' },
  map: { ko: '지도', en: 'Map' },
  explore: { ko: '탐색', en: 'Explore' },
  record: { ko: '기록', en: 'Record' },
  menu: { ko: '더보기', en: 'More' },

  // 공통
  search: { ko: '검색', en: 'Search' },
  login: { ko: '로그인', en: 'Log in' },
  logout: { ko: '로그아웃', en: 'Log out' },
  signup: { ko: '회원가입', en: 'Sign up' },
  close: { ko: '닫기', en: 'Close' },
  back: { ko: '뒤로', en: 'Back' },
  copied: { ko: '복사했어요', en: 'Copied' },
  copyFailed: { ko: '길게 눌러 복사해 주세요', en: 'Press and hold to copy' },

  // 설정
  myProfile: { ko: '내 프로필', en: 'My Profile' },
  favorites: { ko: '즐겨찾는 성지', en: 'Favorite Sites' },
  appSettings: { ko: '앱 설정', en: 'App Settings' },
  languageSetting: { ko: '언어 설정', en: 'Language' },
  largeTextSetting: { ko: '큰 글자 모드', en: 'Large Text' },
  supportInfo: { ko: '지원 및 정보', en: 'Support & Info' },

  // 순례 여권
  stampButton: { ko: '순례 스탬프 찍기', en: 'Add Pilgrimage Stamp' },
  stampDone: { ko: '순례 스탬프 완료', en: 'Stamp Collected' },
  pilgrimPassport: { ko: '순례 여권', en: 'Pilgrim Passport' },

  // 오늘의 쉼표 (오버투어리즘 분산)
  quietTitle: { ko: '오늘, 조용한 자리', en: 'Quiet places today' },
  quietSubtitle: {
    ko: '한국관광공사 실시간 축제·관광 정보로 오늘의 붐빔을 계산했어요',
    en: 'Crowding estimated from Korea Tourism Organization live festival and attraction data',
  },
  quietLoading: { ko: '오늘 열리는 행사를 확인하는 중…', en: 'Checking today’s events…' },
  quietDisclaimer: {
    ko: '공사 데이터에는 실시간 혼잡도가 없어, 오늘 열리는 행사와 주변 관광 시설 밀도로 추정한 값입니다. 실제와 다를 수 있어요.',
    en: 'The tourism API has no live crowd counts. This is an estimate from today’s events and nearby facility density, so it may differ from reality.',
  },

  // 찾아가는 길 — 외국인에게 가장 중요한 화면
  directions: { ko: '찾아가는 길', en: 'Getting there' },
  addressKorean: { ko: '한국어 주소', en: 'Address in Korean' },
  addressHint: {
    ko: '택시를 탈 때 이 주소를 보여주세요',
    en: 'Show this to a taxi driver — Korean drivers may not read English addresses',
  },
  coordinates: { ko: '좌표', en: 'Coordinates' },
  openInMapApp: { ko: '지도 앱으로 열기', en: 'Open in a map app' },
  googleNote: {
    ko: '한국에서는 자동차 길찾기가 나오지 않아요. 대중교통·도보는 됩니다',
    en: 'Car directions are unavailable in Korea by law. Transit and walking work',
  },
  appleNote: {
    ko: 'iPhone 기본 지도',
    en: 'Default map app on iPhone',
  },
  kakaoNote: {
    ko: '한국에서 가장 정확해요',
    en: 'Most accurate in Korea — the app is worth installing',
  },
  naverNote: {
    ko: '대중교통 안내에 강해요',
    en: 'Best for public transport in Korea',
  },
  noCoordinates: {
    ko: '아직 좌표가 확인되지 않은 성지예요',
    en: 'Coordinates for this site are not confirmed yet',
  },

  // 방문 안내 — 비신자·외국인의 "실례할까봐"를 없애는 문구
  beforeYouGo: { ko: '들어가기 전에', en: 'Before you go in' },
  etiquetteBow: {
    ko: '문 앞에서 가볍게 목례하면 됩니다',
    en: 'A small bow at the door is enough',
  },
  etiquetteHolyWater: {
    ko: '성수는 안 찍어도 괜찮아요',
    en: 'You don’t need to use the holy water',
  },
  etiquetteSeat: {
    ko: '뒷자리 아무 데나 앉으시면 됩니다',
    en: 'Sit anywhere in the back rows',
  },
  etiquetteWelcome: {
    ko: '신자가 아니어도, 기도를 안 해도 괜찮습니다',
    en: 'You don’t have to be Catholic, and you don’t have to pray',
  },
  etiquettePhoto: {
    ko: '미사 중에는 사진을 찍지 말아 주세요',
    en: 'Please don’t take photos during Mass',
  },
} as const satisfies Record<string, Record<Language, string>>;

export type TranslationKey = keyof typeof DICTIONARY;
