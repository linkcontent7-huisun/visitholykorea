export type Language = 'ko' | 'en';

export const LANGUAGES: Language[] = ['ko', 'en'];

/**
 * UI 문구(화면 요소)만 다국어로 관리한다.
 * 성지 콘텐츠 본문 번역은 DB 쪽 과제라 여기서 다루지 않는다(docs/20-architecture 참고).
 */
export const DICTIONARY = {
  home: { ko: '홈', en: 'Home' },
  map: { ko: '지도', en: 'Map' },
  explore: { ko: '탐색', en: 'Explore' },
  record: { ko: '기록', en: 'Record' },
  menu: { ko: '더보기', en: 'More' },
  search: { ko: '검색', en: 'Search' },
  login: { ko: '로그인', en: 'Log in' },
  logout: { ko: '로그아웃', en: 'Log out' },
  signup: { ko: '회원가입', en: 'Sign up' },
  myProfile: { ko: '내 프로필', en: 'My Profile' },
  favorites: { ko: '즐겨찾는 성지', en: 'Favorite Sites' },
  appSettings: { ko: '앱 설정', en: 'App Settings' },
  languageSetting: { ko: '언어 설정', en: 'Language' },
  largeTextSetting: { ko: '큰 글자 모드', en: 'Large Text' },
  supportInfo: { ko: '지원 및 정보', en: 'Support & Info' },
  stampButton: { ko: '순례 스탬프 찍기', en: 'Add Pilgrimage Stamp' },
  stampDone: { ko: '순례 스탬프 완료', en: 'Stamp Collected' },
  pilgrimPassport: { ko: '순례 여권', en: 'Pilgrim Passport' },
} as const satisfies Record<string, Record<Language, string>>;

export type TranslationKey = keyof typeof DICTIONARY;
