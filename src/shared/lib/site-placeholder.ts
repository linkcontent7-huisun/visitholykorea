/**
 * 사진이 아직 없는 성지에 보여줄 임시 이미지.
 *
 * 2026-09-12 기준 208곳 중 155곳이 사진이 없어 목록이 회색 문양으로만 채워졌다.
 * 사장님이 만든 임시 이미지 6장("곧 현장 사진을 올릴 예정" 문구가 박혀 있어
 * 진짜 사진으로 오해되지 않는다)을 빈자리에 돌려 쓴다.
 *
 * 왜 무작위가 아니라 이름 해시인가 — 새로고침할 때마다 사진이 바뀌면
 * "아까 본 그 성지"를 눈으로 못 찾는다. 같은 성지는 늘 같은 임시 사진이어야 한다.
 *
 * 이 이미지는 DB 의 image_url 에 넣지 않는다. 관리자 콘솔의 "사진 없음" 대기열은
 * DB 값으로 세므로, 임시 이미지가 있어도 그 성지는 계속 "채울 곳"으로 남는다.
 */

export const PLACEHOLDER_COUNT = 6;

/** 문자열을 0 이상의 정수로 — 32비트 FNV-1a. 암호용이 아니라 고르게 흩기만 하면 된다. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** 성지 이름(또는 id)에 고정 배정된 임시 이미지 경로. */
export function placeholderImageFor(key: string): string {
  const n = (hash(key) % PLACEHOLDER_COUNT) + 1;
  return `/placeholders/site-placeholder-${n}.webp`;
}

/**
 * 교구별 대표 사진 — 사진이 없는 성지의 빈자리를 그 교구 주교좌성당(없으면 그 교구의 다른 성지)
 * 사진으로 채운다 (2026-09-16 사장님 결정, `docs/DSH/task_IMAGE.md` 작업 1).
 *
 * 이 사진은 그 성지의 사진이 **아니다.** 화면에는 「○○교구 성지」 띠를 겹치고,
 * 대체 텍스트에 「대표 사진 · △△성당」이라고 밝힌다. DB 의 image_url 에는 넣지 않는다.
 *
 * 출처·라이선스는 여기 한 곳에만 둔다. 위키미디어는 1280px 축소판, 내장 파일은 이미
 * `holy_sites.image_url` 이 쓰는 것을 그대로 가리킨다 — 새 파일을 만들지 않았다.
 */
export interface DioceseImage {
  url: string;
  /** 사진에 찍힌 곳 — 대체 텍스트와 출처 표기에 쓴다 */
  label: string;
  source: string;
  license: string;
}

const WM = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

export const DIOCESE_IMAGES: Record<string, DioceseImage> = {
  서울: { url: `${WM}/c/c1/Myeongdong_Cathedral_6.jpg/1280px-Myeongdong_Cathedral_6.jpg`, label: '명동대성당', source: 'Wikimedia Commons (kallerna)', license: 'CC BY-SA 4.0' },
  대구: { url: `${WM}/7/71/%EA%B3%84%EC%82%B0%EC%84%B1%EB%8B%B9.jpg/1280px-%EA%B3%84%EC%82%B0%EC%84%B1%EB%8B%B9.jpg`, label: '계산주교좌성당', source: 'Wikimedia Commons (기여자)', license: 'CC BY-SA 4.0' },
  광주: { url: `${WM}/d/d5/%EB%82%A8%EB%8F%99%EC%84%B1%EB%8B%B9_%EC%9E%85%EA%B5%AC.jpg/1280px-%EB%82%A8%EB%8F%99%EC%84%B1%EB%8B%B9_%EC%9E%85%EA%B5%AC.jpg`, label: '남동성당(5·18 기념성당)', source: 'Wikimedia Commons', license: '공공누리 제1유형' },
  // 대흥동 주교좌성당의 열린 사진은 야경 세로 한 장뿐이라(9/16) 대표 사진은 공세리성당으로
  대전: { url: `${WM}/6/61/%EA%B3%B5%EC%84%B8%EB%A6%AC%EC%84%B1%EB%8B%B9_%EC%A0%84%EA%B2%BD.jpg/1280px-%EA%B3%B5%EC%84%B8%EB%A6%AC%EC%84%B1%EB%8B%B9_%EC%A0%84%EA%B2%BD.jpg`, label: '공세리성지성당', source: 'Wikimedia Commons', license: 'CC BY-SA 3.0' },
  수원: { url: `${WM}/1/18/Roman_Cathoilic_Cathedral_Suwon_-_side_view.jpg/1280px-Roman_Cathoilic_Cathedral_Suwon_-_side_view.jpg`, label: '정자동주교좌성당', source: 'Wikimedia Commons (Avemundi)', license: 'CC BY-SA 4.0' },
  전주: { url: `${WM}/b/bb/20240728_Jeonju_Jungang_Cathedral_002.jpg/1280px-20240728_Jeonju_Jungang_Cathedral_002.jpg`, label: '전주 중앙주교좌성당', source: 'Wikimedia Commons (Jjw)', license: 'CC BY 4.0' },
  춘천: { url: `${WM}/d/d5/Jukrimdong_Cathedral_2020801_003.jpg/1280px-Jukrimdong_Cathedral_2020801_003.jpg`, label: '죽림동주교좌성당', source: 'Wikimedia Commons (Jjw)', license: 'CC BY-SA 4.0' },
  의정부: { url: `${WM}/a/a1/Cath%C3%A9drale_du_Sacr%C3%A9-C%C5%93ur_de_Marie.jpg/1280px-Cath%C3%A9drale_du_Sacr%C3%A9-C%C5%93ur_de_Marie.jpg`, label: '의정부주교좌성당', source: 'Wikimedia Commons (Yann Cueroni)', license: 'CC BY-SA 4.0' },
  인천: { url: `${WM}/7/7a/Dapdong_cathedral.JPG/1280px-Dapdong_cathedral.JPG`, label: '답동주교좌성당', source: 'Wikimedia Commons (Dalgial)', license: 'CC BY-SA 3.0' },
  원주: { url: '/images/sites/wondong.jpg', label: '원동주교좌성당', source: '국가유산청', license: '공공누리 제1유형' },
  마산: { url: `${WM}/4/45/%EC%96%91%EB%8D%95%EC%84%B1%EB%8B%B9_%EC%A0%84%EB%A9%B4.jpg/1280px-%EC%96%91%EB%8D%95%EC%84%B1%EB%8B%B9_%EC%A0%84%EB%A9%B4.jpg`, label: '양덕주교좌성당', source: 'Wikimedia Commons (장길산)', license: 'Public domain' },
  제주: { url: `${WM}/d/d1/Jungang_Cathedral.JPG/1280px-Jungang_Cathedral.JPG`, label: '제주 중앙주교좌성당', source: 'Wikimedia Commons (mintz0223)', license: 'Public domain' },
  청주: { url: `${WM}/b/b0/Cheongju_Naedeokdong_Church.jpg/1280px-Cheongju_Naedeokdong_Church.jpg`, label: '내덕동주교좌성당', source: 'Wikimedia Commons (Neoalpha)', license: 'CC0' },
  // 부산·안동·군종은 주교좌성당의 열린 라이선스 사진을 못 찾았다(9/16 위키미디어 검색) — 그 교구 성지 사진으로 대신한다
  부산: { url: '/images/sites/eonyang.jpg', label: '언양성당', source: '국가유산청', license: '공공누리 제1유형' },
  안동: { url: '/images/sites/sangju-sinang-gobaekbi.jpg', label: '상주 신앙고백비', source: '한국관광공사 TourAPI 관광정보', license: '공공누리 (제1·3유형 미확인 · 원본 무변경)' },
  군종: { url: '/images/sites/waegogae-seongji.jpg', label: '왜고개성지', source: '한국관광공사 포토코리아 (촬영 김지호)', license: '공공누리 제1유형' },
};

/** 교구의 대표 사진. 목록에 없는 교구(빈 값 포함)는 null — 호출부가 기존 임시 이미지로 넘어간다. */
export function dioceseImageFor(diocese: string | null | undefined): DioceseImage | null {
  return diocese ? (DIOCESE_IMAGES[diocese] ?? null) : null;
}
