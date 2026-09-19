/**
 * 홈 히어로에 고정으로 거는 성지 5곳 (2026-09-16 회의 결정).
 *
 * 매일 돌아가던 예전 방식 대신 다섯 곳을 못 박고 사진을 `public/images/hero/` 에 직접 둔다 —
 * 첫 화면이 Wikimedia 응답 속도에 흔들리지 않고, 서비스워커가 한 번 받은 사진을 30일 쓴다
 * (`vite.config.ts` 의 `site-photos` 캐시). 성지 정보는 우리 자체 DB 라 저장·캐싱해도 된다(ADR 0002).
 *
 * 이름·지역·분류는 DB 를 아직 못 받았을 때의 **대체 표기**다. 화면은 같은 id 의 DB 행이 있으면
 * 그쪽(번역 포함)을 우선한다. 사진 출처는 CC 계열이라 화면에 표기해야 한다(라이선스 의무).
 *
 * 솔뫼 사진은 9/17 사장님이 준 입구 십자가 문 사진으로 교체했다(교황 방문 현수막이 찍힌 옛 사진 대신).
 * 🔴 사진을 바꿀 때는 **파일 이름도 바꾼다**(slug). 서비스워커가 `/images/hero/` 를 CacheFirst 로 잡아 두어 같은 이름이면
 * 이미 받은 사람에게 옛 사진이 계속 보인다(9/17 솔뫼 교체 때 실제로 그랬다). 세로가 긴 피사체(십자가)가 넓은 PC 띠에서
 * 잘리면 `objectPosition` 으로 초점을 올린다.
 */
export interface HeroSite {
  /** `holy_sites.id` (2026-09-16 운영 DB 실측) */
  id: string;
  /** 파일 이름 — `/images/hero/<slug>-800.jpg` · `-1280.jpg` */
  slug: string;
  name: string;
  region: string;
  category: string;
  imageSource: string;
  imageLicense: string;
  /** CSS object-position. PC 히어로는 2.6:1 띠라 위아래가 잘린다 — 중요한 것이 위에 있으면 `50% 20%` 처럼 올린다. 없으면 가운데 */
  objectPosition?: string;
}

export const HERO_SITES: readonly HeroSite[] = [
  {
    id: '4b4199cf-2236-4842-8996-38ee9d36e542',
    slug: 'myeongdong-nave', // 9/19 사장님 사진(내부 회중석)으로 교체 — 캐시 때문에 이름을 바꿨다
    name: '명동대성당',
    region: '서울',
    category: '주교좌성당',
    imageSource: '직접 촬영',
    imageLicense: '앱 사용 동의',
  },
  {
    id: 'f1e25869-e3cb-40de-b4b6-da5b5b398797',
    slug: 'daeheung-nave', // 9/19 사장님 사진(내부 제대)으로 교체
    name: '대흥동 성당',
    region: '대전',
    category: '주교좌성당',
    imageSource: '직접 촬영',
    imageLicense: '앱 사용 동의',
  },
  {
    id: '66e08f67-b761-40aa-9c6e-db6bd6efb6d6',
    slug: 'gongseri-spring', // 9/19 대전교구 홍보국 제공 사진(봄 전경)으로 교체
    name: '공세리성지성당',
    region: '대전',
    category: '성당',
    imageSource: '대전교구 홍보국 제공',
    imageLicense: '앱 사용 허락',
  },
  {
    id: '7e9b0733-1c97-4d1c-beb0-fd7e9c6ab8c0',
    slug: 'solmoe-gate', // 9/17 사진 교체 — 캐시 때문에 이름을 바꿨다
    name: '솔뫼성지',
    region: '대전',
    category: '순례길',
    // 2026-09-17 사장님이 준 사진(입구 십자가 문)으로 교체. 위키미디어 사진은 더 이상 쓰지 않는다.
    imageSource: '직접 촬영',
    imageLicense: '앱 사용 동의',
    objectPosition: '50% 6%', // 십자가 셋이 위쪽에 있다 — PC 띠에서 위 여백을 남긴다
  },
  {
    id: 'aeac09d0-c5ef-4091-b1b0-b84686940659',
    slug: 'haemi-stone', // 9/19 대전교구 홍보국 제공 사진(표지석·기념관)으로 교체
    name: '해미순교성지',
    region: '대전',
    category: '순교성지',
    imageSource: '대전교구 홍보국 제공',
    imageLicense: '앱 사용 허락',
  },
];

/** 폭에 맞는 자체 저장 사진 주소. 휴대폰은 800, PC 는 1280. */
export function heroImageSrc(slug: string, width: 800 | 1280): string {
  return `/images/hero/${slug}-${width}.jpg`;
}
