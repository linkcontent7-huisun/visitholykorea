/**
 * 순례길 공식 누리집 링크 (T-050, 2026-09-29).
 *
 * 교구·지자체·공식 순례길 누리집만 근거로 Claude 가 모으고 Codex 가 사본과 대조해
 * 둘 다 OK 한 것만 넣었다 — 근거는 data/research/route-links/(links.json · _verify.json · _pages/).
 * 외부 링크 목록일 뿐 TourAPI 응답이 아니므로 앱에 두어도 된다.
 *
 * 공식 페이지가 없는 순례길(인천·춘천·의정부의 해마다 여는 도보순례 행사 등)과
 * 앱이 이야기 순서로 엮은 코스(황석두·김대건·최양업·내포)는 일부러 넣지 않았다.
 * 없는 링크를 지어 붙이지 않는다.
 */

export interface OfficialLink {
  url: string;
  /** 운영 주체 — 누리집에 적힌 이름 그대로 */
  owner: string;
}

export interface NationwideTrail extends OfficialLink {
  /** 교구명(「서울」「수원」…) — dioceseLabel 로 언어별 표기 */
  diocese: string;
  name: string;
  /** 한국어 밖 화면에 쓰는 이름 */
  nameEn: string;
  region: string;
}

/** 앱 코스(pilgrimage_routes.slug) → 그 코스를 직접 안내하는 공식 페이지 */
export const COURSE_OFFICIAL_LINKS: Readonly<Record<string, OfficialLink>> = {
  'seoul-1-word': {
    url: 'https://martyrs.or.kr/_web/mpilgrims/aboutcourse.html?cidx=6',
    owner: '서울대교구 순교자현양위원회',
  },
  'seoul-2-life': {
    url: 'https://martyrs.or.kr/_web/mpilgrims/aboutcourse.html?cidx=7',
    owner: '서울대교구 순교자현양위원회',
  },
  'seoul-3-unity': {
    url: 'https://martyrs.or.kr/_web/mpilgrims/aboutcourse.html?cidx=8',
    owner: '서울대교구 순교자현양위원회',
  },
};

/** 전국 교구·지자체가 운영하는 순례길 — 교구 북쪽에서 남쪽 순서 */
export const NATIONWIDE_TRAILS: readonly NationwideTrail[] = [
  {
    diocese: '서울',
    name: '천주교 서울 순례길',
    nameEn: 'Seoul Catholic Pilgrimage Route',
    region: '서울',
    url: 'https://martyrs.or.kr/_web/mpilgrims/about.html',
    owner: '서울대교구 순교자현양위원회',
  },
  {
    diocese: '서울',
    name: '김대건 신부 치명 순례길',
    nameEn: 'St. Andrew Kim Taegon Martyrdom Route',
    region: '서울',
    url: 'https://martyrs.or.kr/_web/mpilgrims/aboutcourse.html?cidx=109',
    owner: '서울대교구 순교자현양위원회',
  },
  {
    diocese: '수원',
    name: '성지순례길 디딤길',
    nameEn: 'Didim-gil Pilgrimage Route',
    region: '경기',
    url: 'https://www.casuwon.or.kr/holyland/pilgrimage',
    owner: '수원교구',
  },
  {
    diocese: '원주',
    name: '순례길 님의 길',
    nameEn: 'Nimui-gil Pilgrimage Route',
    region: '강원 · 충북',
    url: 'https://sunraegil.seoji.net/course/all',
    owner: '원주교구',
  },
  {
    diocese: '대전',
    name: '내포 천주교 순례길',
    nameEn: 'Naepo Catholic Pilgrimage Trail',
    region: '충남',
    url: 'https://naepotrail.org/course/catholic',
    owner: '사단법인 내포문화숲길',
  },
  {
    diocese: '대전',
    name: '버그내 순례길',
    nameEn: 'Beogeunae Pilgrimage Route',
    region: '충남 당진',
    url: 'https://beogeunae.dangjin.go.kr/pil1.html',
    owner: '당진시',
  },
  {
    diocese: '대전',
    name: '해미국제성지순례길',
    nameEn: 'Haemi International Shrine Pilgrimage Route',
    region: '충남 서산',
    url: 'https://www.seosan.go.kr/tour/contents.do?key=6053',
    owner: '서산시',
  },
  {
    diocese: '대전',
    name: '갈매못-서짓골 성지 순례길',
    nameEn: 'Galmaemot–Seojitgol Pilgrimage Route',
    region: '충남 보령',
    url: 'https://www.brcn.go.kr/tour/sub02_02_02.do',
    owner: '보령시',
  },
  {
    diocese: '청주',
    name: '배티성지 순례길',
    nameEn: 'Baeti Shrine Pilgrimage Paths',
    region: '충북 진천',
    url: 'https://www.baeti.org/pilgrimage/guide',
    owner: '청주교구 배티성지',
  },
  {
    diocese: '안동',
    name: '사제와 함께하는 도보순례',
    nameEn: 'Walking Pilgrimage with a Priest',
    region: '경북',
    url: 'https://www.acatholic.or.kr/sub4/sub2.asp',
    owner: '안동교구',
  },
  {
    diocese: '대구',
    name: '한티가는길',
    nameEn: 'Hanti-ganeun-gil (Road to Hanti)',
    region: '경북 칠곡',
    url: 'https://hantigil.or.kr/',
    owner: '사단법인 한티',
  },
  {
    diocese: '부산',
    name: '동래읍성 순례길',
    nameEn: 'Dongnae Fortress Pilgrimage Route',
    region: '부산',
    url: 'http://old.catholicbusan.or.kr/index.php?mid=page_YTOO85',
    owner: '부산교구',
  },
  {
    diocese: '전주',
    name: '교우촌 도보순례',
    nameEn: 'Catholic Villages Walking Pilgrimage',
    region: '전북 전주 · 완주',
    url: 'https://www.jcatholic.or.kr/theme/main/pages/pilgrimage01.html',
    owner: '전주교구',
  },
  {
    diocese: '전주',
    name: '아름다운 순례길',
    nameEn: 'Jeonju Beautiful Pilgrimage Route',
    region: '전북',
    url: 'https://www.jcatholic.or.kr/theme/main/pages/pilgrimage05.html',
    owner: '전주교구',
  },
  {
    diocese: '광주',
    name: '노안-나주 순교자 기념성당 순례길',
    nameEn: 'Noan–Naju Martyrs Pilgrimage Route',
    region: '전남 나주',
    url: 'https://www.gjcatholic.or.kr/holyland/pilgrimage/noan_naju',
    owner: '광주대교구',
  },
  {
    diocese: '제주',
    name: '천주교 제주 순례길',
    nameEn: 'Jeju Catholic Pilgrimage Route',
    region: '제주',
    url: 'https://santoviaggio.com/',
    owner: '제주교구',
  },
];
